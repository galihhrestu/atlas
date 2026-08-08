import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const distIndex = resolve('dist/index.html')
const fallback = resolve('dist/404.html')

if (!existsSync(distIndex)) {
  throw new Error('dist/index.html was not created by Vite.')
}

copyFileSync(distIndex, fallback)
console.log('Created dist/404.html for GitHub Pages SPA routes.')
