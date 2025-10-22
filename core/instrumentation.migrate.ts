import { logger } from "logger";

export async function runMigrations() {
	const { execSync } = await import("child_process");

	try {
		logger.info("Running Prisma migrations...");
		execSync("npx prisma migrate deploy --config prisma/prisma.config.ts", {
			stdio: "pipe",
			// eslint-disable-next-line no-restricted-properties
			env: { ...process.env },
		});

		logger.info("Prisma migrations completed successfully");
	} catch (error) {
		logger.error({ msg: "Failed to run Prisma migrations:", err: error });
		throw error;
	}
}

runMigrations().catch((error) => {
	logger.error({ msg: "Migration auto-run failed:", err: error });
	process.exit(1);
});
