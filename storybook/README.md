# Storybook

## Running

```
pnpm run dev
```

Storybook should start running at `localhost:6006`!

## Developing

You probably want to first run `pnpm i && pnpm p:dev` at the root of the repo. This will install all dependencies and also build our own packages in dev mode such that they will hot reload.

When working on a component in i.e. `packages/ui`, you can import the component in a storybook story using your typical `import { Button } from "ui/button`. Editing `packages/ui/src/button.tsx` should reflect changes in Storybook immediately.

### About tailwind

This storybook is configured to use the `styles.css` made by `packages/ui`. [tailwind.config.ts](./tailwind.config.ts) is set up to monitor our source files in `packages/` to detect CSS classes used by tailwind. In addition, it is configured to monitor our own [stories](./stories) so that we can use tailwind within storybook, such as if we want to add some tailwind classes to a wrapper around a component (for example, the "Loading" button story includes an `animate-spin` that is only used by this storybook project and not in `packages/ui`.)
