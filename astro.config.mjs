// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://extlabs.io',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/developers/dashboard') &&
        !page.includes('/developers/manage') &&
        !page.includes('/api'),
    }),
  ],
  devToolbar: {
    enabled: false,
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  image: {
    domains: [
      'avatars.githubusercontent.com',
      'res.cloudinary.com',
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