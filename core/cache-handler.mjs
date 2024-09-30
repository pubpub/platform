/**
 * Solution taken from here: https://github.com/vercel/next.js/discussions/48324#discussioncomment-10542097
 *
 * We are reexporting `next.js`'s default cache handler to get around
 * the fixed 2mb limit for cached fetches.
 * We run into this limit somewhat quickly if we fetch more than 100 pubs.
 */

import FileSystemCache from "next/dist/server/lib/incremental-cache/file-system-cache.js";

export default FileSystemCache;
