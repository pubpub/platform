import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "./schema/",
	migrations: {
		path: "./migrations/",
		seed: "tsx --import #register-loader prisma/seed.ts",
	},
});
