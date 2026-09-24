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
      customPages: [
        'https://extlabs.store/category/privacy',
        'https://extlabs.store/category/media',
        'https://extlabs.store/category/automation',
        'https://extlabs.store/category/customization',
        'https://extlabs.store/category/ai',
        'https://extlabs.store/category/dev',
        'https://extlabs.store/category/productivity',
        'https://extlabs.store/category/networking',
        'https://extlabs.store/category/social',
        'https://extlabs.store/category/shopping',
      ],
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