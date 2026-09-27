import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // L'application vit sous /dashboard : sans ce préfixe, les ressources
  // compilées seraient demandées à la racine, là où vit le site vitrine.
  base: '/dashboard/',
  plugins: [react(), tailwindcss()],
});
