## Developing
  ```
  pnpm install
  pnpm build
  pnpm dev
  ```
  Running build first is important to make sure the any prebuild scripts run (e.g. Prisma generate), and to make sure packages have dist files ready for consumption. Dev scripts disable tsup clean to avoid clearing out the dist directory going forward to avoid race conditions where an app is looking for a package, but it's `dist` has just been cleaned out.