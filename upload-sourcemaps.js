import path from "path"
import { execSync } from "child_process"

const projectRoot = process.cwd()
const nextBuildDir = path.join(projectRoot, ".next")

const commitSHA = process.env.NEXT_PUBLIC_COMMIT_SHA
const appVersion = `${process.env.HIGHLIGHT_APP_NAME}-${commitSHA ? commitSHA : "local"}`

const cmd = `npx @highlight-run/sourcemap-uploader upload --apiKey "${process.env.HIGHLIGHT_PROJECT_ID}" --appVersion "${appVersion}" --path "${nextBuildDir}" --basePath /var/task/.next`
execSync(cmd, { stdio: "inherit" })