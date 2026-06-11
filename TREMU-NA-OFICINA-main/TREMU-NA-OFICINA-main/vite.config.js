import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O bundle do @mediapipe/tasks-vision aponta para um source map com um nome
// errado (vision_bundle_mjs.js.map) que não vem no pacote, o que faz o Vite
// despejar um aviso "Failed to load source map" a cada arranque. Como o Vite
// lê o source map na fase de "load" (antes dos hooks transform), interceptamos
// o load do ficheiro e devolvemos o código sem a referência partida.
function stripMediapipeSourcemap() {
  return {
    name: 'strip-mediapipe-sourcemap',
    enforce: 'pre',
    load(id) {
      const file = id.split('?')[0];
      if (file.includes('@mediapipe/tasks-vision') && file.endsWith('.mjs')) {
        const code = readFileSync(file, 'utf-8');
        return code.replace(/\/\/[#@]\s*sourceMappingURL=\S+\s*$/m, '');
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [stripMediapipeSourcemap(), react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
});
