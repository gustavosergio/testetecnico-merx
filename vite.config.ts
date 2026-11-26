import { defineConfig } from 'vite'

const workerOrigin = 'http://127.0.0.1:8787'

export default defineConfig({
  build: { outDir: 'dist/client' },
  server: {
    proxy: {
      '/api': {
        target: workerOrigin,
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (outgoing, incoming) => {
            // Preserve same-origin checks across the local Vite → Worker hop.
            if (incoming.headers.origin === 'http://' + incoming.headers.host) {
              outgoing.setHeader('Origin', workerOrigin)
            }
          })
        },
      },
    },
  },
})
