import { execSync } from 'child_process'
const appVersion = `${process.env.HIGHLIGHT_APP_NAME}-${process.env.VERCEL_GIT_COMMIT_SHA}`
const cmd = `npx @highlight-run/sourcemap-uploader upload --apiKey "${process.env.HIGHLIGHT_API_KEY}" --appVersion "${appVersion}" --path ".next/static\" --basePath "~/_next/static\"`
execSync(cmd, { stdio: 'inherit' })
