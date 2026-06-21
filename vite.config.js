import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync } from 'fs';

// Plugin qui copie DOSCO_Standalone.html vers dist/index.html
const doscoStandalonePlugin = {
  name: 'dosco-standalone',
  closeBundle() {
    const src = resolve(__dirname, 'DOSCO_Standalone.html');
    const dst = resolve(__dirname, 'dist', 'index.html');
    if (existsSync(src)) {
      copyFileSync(src, dst);
      console.log('✅ DOSCO_Standalone.html copié vers dist/index.html');
    }
  }
};

export default defineConfig({
  plugins: [doscoStandalonePlugin],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Pas de rollup — on utilise directement le HTML standalone
    rollupOptions: {
      input: resolve(__dirname, 'DOSCO_Standalone.html'),
    },
  },
  // Capacitor WebView : autoriser les ressources locales
  server: {
    host: true,
  },
});
