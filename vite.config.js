import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Production-only CSP (the dev server needs inline scripts for React refresh).
// 'unsafe-inline' styles are required because all styling is inline.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

const cspMeta = {
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
  ],
}

export default defineConfig({
  plugins: [react(), cspMeta],
  base: './',
})
