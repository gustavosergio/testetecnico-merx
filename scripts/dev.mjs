// Start Vite and a local Worker together so session cookies stay on one origin.
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const wrangler = resolve('node_modules/wrangler/bin/wrangler.js')
const vite = resolve('node_modules/vite/bin/vite.js')
mkdirSync('dist/client', { recursive: true })
const migration = spawnSync(
  process.execPath,
  [wrangler, 'd1', 'migrations', 'apply', 'DB', '--local'],
  {
    stdio: 'inherit',
  },
)
if (migration.status !== 0) process.exit(migration.status ?? 1)

const children = [
  spawn(process.execPath, [wrangler, 'dev', '--local', '--port', '8787'], {
    stdio: 'inherit',
  }),
  spawn(
    process.execPath,
    [vite, '--host', '127.0.0.1', ...process.argv.slice(2)],
    { stdio: 'inherit' },
  ),
]
let stopping = false
function stop(code) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill('SIGTERM')
  process.exitCode = code
}
for (const child of children) child.on('exit', (code) => stop(code ?? 0))
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
