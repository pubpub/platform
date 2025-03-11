// @ts-check

/**
 * Roughly:
 *
 * When running seed, either from prisma or in playwright, we register a custom module loader from './module-loader.js'
 * This custom module loader is used to intercept the loading of certain modules, and replace them with our own stubs.
 * This is necessary mostly for react and next specific modules, which are only useable in a "next-y" context.
 * Things like `React.cache`, `unstable_cache`, and `server-only` are examples of modules that are replaced with stubs.
 *
 * Order of operations:
 * 1. This file is preloaded with `--import`.
 * 2. It registers a module loader in `./module-loader.js`.
 * 3. This intercepts the loading of certain modules, and replaces them with the stubs in `./stubs.js`.
 *
 * Extremely convoluted, wish there was a better solution
 */

import { register } from "node:module";

register("./module-loader.js", import.meta.url);
