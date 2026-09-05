// src/lib/auth.ts
import type { D1Database } from '@cloudflare/workers-types';
import type { DbUser } from './db';

const SESSION_COOKIE_NAME = 'extlabs_session';
const SESSION_EXPIRY_DAYS = 7;

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  blog: string | null;
}

/**
 * Generate GitHub OAuth authorization URL
 */
export function getGitHubAuthUrl(clientId: string, state: string, redirectUri?: string): string {
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('scope', 'read:user user:email public_repo');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  if (redirectUri) {
    url.searchParams.set('redirect_uri', redirectUri);
  }
  return url.toString();
}

/**
 * Exchange OAuth code for GitHub Access Token
 */
export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri?: string
): Promise<string | null> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
  });
  if (redirectUri) {
    params.set('redirect_uri', redirectUri);
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'ExtLabs-Directory',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    console.error('Failed to exchange code for token:', await response.text());
    return null;
  }

  const data = (await response.json()) as { access_token?: string; error?: string };
  return data.access_token || null;
}

/**
 * Fetch authenticated GitHub user profile and verified email
 */
export async function getGitHubUserProfile(accessToken: string): Promise<GitHubUserProfile | null> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'ExtLabs-Directory',
  };

  const response = await fetch('https://api.github.com/user', { headers });

  if (!response.ok) {
    console.error('Failed to fetch GitHub profile:', await response.text());
    return null;
  }

  const user = (await response.json()) as GitHubUserProfile;

  // Always query /user/emails to get the verified personal/support email
  try {
    const emailRes = await fetch('https://api.github.com/user/emails', { headers });
    if (emailRes.ok) {
      const emails = (await emailRes.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
        visibility?: string | null;
      }>;

      if (Array.isArray(emails) && emails.length > 0) {
        // Priority 1: Verified primary email that is not a GitHub noreply dummy
        const realPrimary = emails.find(
          (e) => e.verified && e.primary && !e.email.includes('noreply')
        );
        // Priority 2: Any verified email that is not a noreply dummy
        const realVerified = emails.find(
          (e) => e.verified && !e.email.includes('noreply')
        );
        // Priority 3: Any real email not containing noreply
        const realAny = emails.find((e) => !e.email.includes('noreply'));
        // Priority 4: Verified primary email (even if noreply)
        const anyPrimary = emails.find((e) => e.primary && e.verified);
        // Priority 5: Fallback to first available
        const chosen = realPrimary || realVerified || realAny || anyPrimary || emails[0];

        if (chosen && chosen.email) {
          user.email = chosen.email;
        }
      }
    } else {
      console.warn('GitHub /user/emails status:', emailRes.status);
    }
  } catch (e) {
    console.error('Error fetching /user/emails:', e);
  }

  return user;
}

/**
 * Upsert user in Cloudflare D1 and create a new session
 */
export async function createOrUpdateUserSession(
  db: D1Database,
  profile: GitHubUserProfile,
  configuredSuperAdmin?: string,
  accessToken?: string
): Promise<{ user: DbUser; sessionId: string }> {
  const githubIdStr = profile.id.toString();
  const username = profile.login.toLowerCase();

  // Determine role:
  // If matches configured super admin (e.g. 'ishara-madu'), grant super_admin
  const isSuperAdmin = configuredSuperAdmin
    ? username === configuredSuperAdmin.toLowerCase()
    : username === 'ishara-madu';

  // Check if user already exists
  const existingUser = await db
    .prepare('SELECT * FROM users WHERE github_id = ? OR username = ?')
    .bind(githubIdStr, username)
    .first<DbUser>();

  let userId: string;
  let userRole = existingUser ? existingUser.role : isSuperAdmin ? 'super_admin' : 'developer';

  if (isSuperAdmin && userRole !== 'super_admin') {
    userRole = 'super_admin';
  }

  if (existingUser) {
    userId = existingUser.id;
    let updated = false;
    if (accessToken) {
      try {
        await db
          .prepare(`
            UPDATE users 
            SET github_id = ?, username = ?, email = COALESCE(?, email), name = ?, avatar_url = ?, role = ?, github_access_token = ?, updated_at = DATETIME('now')
            WHERE id = ?
          `)
          .bind(
            githubIdStr,
            username,
            profile.email || null,
            profile.name || profile.login,
            profile.avatar_url,
            userRole,
            accessToken,
            userId
          )
          .run();
        updated = true;
      } catch {
        // Fallback if github_access_token column does not exist yet
      }
    }

    if (!updated) {
      await db
        .prepare(`
          UPDATE users 
          SET github_id = ?, username = ?, email = COALESCE(?, email), name = ?, avatar_url = ?, role = ?, updated_at = DATETIME('now')
          WHERE id = ?
        `)
        .bind(
          githubIdStr,
          username,
          profile.email || null,
          profile.name || profile.login,
          profile.avatar_url,
          userRole,
          userId
        )
        .run();
    }
  } else {
    userId = `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    let inserted = false;
    if (accessToken) {
      try {
        await db
          .prepare(`
            INSERT INTO users (id, github_id, username, email, name, avatar_url, role, status, two_factor_enabled, github_access_token)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0, ?)
          `)
          .bind(
            userId,
            githubIdStr,
            username,
            profile.email || null,
            profile.name || profile.login,
            profile.avatar_url,
            userRole,
            accessToken
          )
          .run();
        inserted = true;
      } catch {
        // Fallback if github_access_token column does not exist yet
      }
    }

    if (!inserted) {
      await db
        .prepare(`
          INSERT INTO users (id, github_id, username, email, name, avatar_url, role, status, two_factor_enabled)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0)
        `)
        .bind(
          userId,
          githubIdStr,
          username,
          profile.email || null,
          profile.name || profile.login,
          profile.avatar_url,
          userRole
        )
        .run();
    }
  }

  // Ensure an associated developer profile exists if user is a developer
  const existingDev = await db
    .prepare('SELECT * FROM developers WHERE user_id = ? OR slug = ?')
    .bind(userId, username)
    .first<any>();

  // Determine website: if user has website on GitHub profile, take it; otherwise fallback to GitHub profile link
  let devWebsite = profile.blog?.trim() || '';
  if (devWebsite && !devWebsite.startsWith('http://') && !devWebsite.startsWith('https://')) {
    devWebsite = `https://${devWebsite}`;
  }
  if (!devWebsite) {
    devWebsite = `https://github.com/${username}`;
  }

  if (!existingDev) {
    const devId = `dev_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    await db
      .prepare(`
        INSERT INTO developers (id, user_id, slug, display_name, avatar_url, website, bio, is_verified, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'active')
      `)
      .bind(
        devId,
        userId,
        username,
        profile.name || profile.login,
        profile.avatar_url,
        devWebsite,
        profile.bio || 'Chromium extension developer.'
      )
      .run();
  } else if (!existingDev.website || (existingDev.website.includes('github.com') && profile.blog?.trim())) {
    await db
      .prepare('UPDATE developers SET website = ? WHERE id = ?')
      .bind(devWebsite, existingDev.id)
      .run();
  }

  // Create active session in D1
  const sessionId = `ses_${crypto.randomUUID()}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await db
    .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, userId, expiresAt.toISOString())
    .run();

  const user = (await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<DbUser>())!;
  return { user, sessionId };
}

/**
 * Get current session user from request Cookie
 */
export async function getSessionUser(db: D1Database, request: Request): Promise<DbUser | null> {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
  if (!match) return null;

  const sessionId = decodeURIComponent(match[1]);
  if (!sessionId) return null;

  const result = await db
    .prepare(`
      SELECT u.* 
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > DATETIME('now') AND u.status = 'active'
    `)
    .bind(sessionId)
    .first<DbUser>();

  return result || null;
}

/**
 * Destroy active session (Logout)
 */
export async function destroySession(db: D1Database, request: Request): Promise<void> {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
  if (!match) return;

  const sessionId = decodeURIComponent(match[1]);
  if (sessionId) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }
}

/**
 * Generate Set-Cookie header for session
 */
export function createSessionCookie(sessionId: string): string {
  const maxAge = SESSION_EXPIRY_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax; Secure`;
}

/**
 * Generate Set-Cookie header to clear session
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`;
}
