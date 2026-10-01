// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // GitHub Pages serves this repo at https://mo-lemi.github.io/Molemi-s-Certification-Inventory/
  // If you rename the repo (or add a custom domain), update `site` and `base` here.
  site: 'https://mo-lemi.github.io',
  base: '/Molemi-s-Certification-Inventory',
  vite: {
    plugins: [tailwindcss()],
  },
});
