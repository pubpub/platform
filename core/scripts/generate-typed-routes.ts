/* eslint-disable no-restricted-properties */
/* eslint-disable no-console */

import { spawn } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";

const linkPath = new URL("../.next/types/link.d.ts", import.meta.url).pathname;
console.log(`linkPath: ${linkPath}`);

let exists = existsSync(linkPath);

if (exists) {
	unlinkSync(linkPath);
}

const child = spawn("pnpm", ["next", "dev"], {
	stdio: "inherit",
	env: { ...process.env, TYPED_ROUTES: "true" },
});

child.on("message", (message) => {
	console.log(message);
});

child.on("exit", (code, signal) => {
	console.log(`generate-typed-routes exited with code ${code} and signal ${signal}`);
	process.exit(0);
});

child.on("error", (err) => {
	console.error(`generate-typed-routes error: ${err}`);
	console.error(err);
	process.exit(1);
});

setInterval(() => {
	// check if `.next/types/link.d.ts` exists
	exists = existsSync(linkPath);
	console.log(`link.d.ts exists: ${exists}`);
	if (exists) {
		child.kill();
		console.log(`Successfully generated link.d.ts`);
		process.exit(0);
	}
}, 1000);
