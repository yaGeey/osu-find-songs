import path from "path"
import { execSync } from "child_process"

const nextBuildDir = path.resolve('.next')
const appVersion = `${process.env.HIGHLIGHT_APP_NAME}-${process.env.VERCEL_GIT_COMMIT_SHA}`

const cmd = `npx @highlight-run/sourcemap-uploader upload --apiKey "${process.env.HIGHLIGHT_API_KEY}" --appVersion "${appVersion}" --path "/.next" --basePath /var/task/.next`
execSync(cmd, { stdio: "inherit" })