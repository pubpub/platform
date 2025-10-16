import { logger } from "logger";

export async function runMigrations() {
	try {
		logger.info("Running Prisma migrations...");

		const { execSync } = await import("child_process");
		execSync("npx prisma migrate deploy --config prisma/prisma.config.ts", {
			stdio: "inherit",
			// eslint-disable-next-line no-restricted-properties
			env: { ...process.env },
		});

		logger.info("Prisma migrations completed successfully");
	} catch (error) {
		logger.error("Failed to run Prisma migrations:", error);
		throw error;
	}
}

runMigrations().catch((error) => {
	logger.error("Migration auto-run failed:", error);
	process.exit(1);
});
