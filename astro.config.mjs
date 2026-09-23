// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://extlabs.store',
  trailingSlash: 'never',
  adapter: cloudflare(),
  integrations: [
    sitemap({
      customSitemaps: ['https://extlabs.store/sitemap-extensions.xml'],
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/developers/dashboard') &&
        !page.includes('/developers/manage') &&
        !page.includes('/developers/new') &&
        !page.includes('/developers/settings') &&
        !page.includes('/developers/login') &&
        !page.includes('/api') &&
        !page.includes('/search') &&
        !page.endsWith('/privacy') &&
        !page.endsWith('/privacy/') &&
        !page.endsWith('/terms') &&
        !page.endsWith('/terms/') &&
        !page.endsWith('/security-verification') &&
        !page.endsWith('/security-verification/'),
    }),
  ],
  devToolbar: {
    enabled: false,
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'tap',
  },
  image: {
    domains: [
      'avatars.githubusercontent.com',
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'googleusercontent.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});