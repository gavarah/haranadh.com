import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://haranadh.com',
  outDir: 'dist',
  build: {
    format: 'file'
  }
});
