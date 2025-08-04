#!/usr/bin/env tsx
import type {
	generateCapabilityMigration as generateCapabilityMigrationType,
	printCapabilityMigration as printCapabilityMigrationType,
	validateCapabilitiesEnum as validateCapabilitiesEnumType,
} from "~/lib/authorization/generate-migration";
import type {
	syncCapabilitiesToDatabase as syncCapabilitiesToDatabaseType,
	validateCapabilitiesInSync as validateCapabilitiesInSyncType,
} from "~/lib/authorization/sync-capabilities";

/* eslint-disable no-console */

const COMMANDS = {
	sync: "sync capabilities to database",
	"dry-run": "show what would be synced without making changes",
	validate: "check if capabilities are in sync",
	"validate-enum": "check if capabilities enum is in sync",
	"generate-migration": "generate a new migration file with enum changes",
	"print-migration": "print migration sql to stdout",
} as const;

const printUsage = () => {
	console.log("Usage: tsx core/scripts/sync-capabilities.ts <command>");
	console.log("\nCommands:");
	for (const [cmd, desc] of Object.entries(COMMANDS)) {
		console.log(`  ${cmd.padEnd(20)} ${desc}`);
	}
};

const loadDatabaseTools = async (
	needsDatabase: boolean
): Promise<{
	syncCapabilitiesToDatabase: typeof syncCapabilitiesToDatabaseType;
	validateCapabilitiesInSync: typeof validateCapabilitiesInSyncType;
}> => {
	if (!needsDatabase) {
		return {
			syncCapabilitiesToDatabase: null as any,
			validateCapabilitiesInSync: null as any,
		};
	}

	const syncModule = await import("~/lib/authorization/sync-capabilities");
	return {
		syncCapabilitiesToDatabase: syncModule.syncCapabilitiesToDatabase,
		validateCapabilitiesInSync: syncModule.validateCapabilitiesInSync,
	};
};

const loadMigrationTools = async (
	needsMigrationTools: boolean
): Promise<{
	generateCapabilityMigration: typeof generateCapabilityMigrationType;
	printCapabilityMigration: typeof printCapabilityMigrationType;
	validateCapabilitiesEnum: typeof validateCapabilitiesEnumType;
}> => {
	if (!needsMigrationTools) {
		return {
			generateCapabilityMigration: null as any,
			printCapabilityMigration: null as any,
			validateCapabilitiesEnum: null as any,
		};
	}

	const migrationModule = await import("~/lib/authorization/generate-migration");
	return {
		generateCapabilityMigration: migrationModule.generateCapabilityMigration,
		printCapabilityMigration: migrationModule.printCapabilityMigration,
		validateCapabilitiesEnum: migrationModule.validateCapabilitiesEnum,
	};
};

const main = async () => {
	const command = process.argv[2] as keyof typeof COMMANDS | undefined;

	if (!command || !(command in COMMANDS)) {
		console.error(`error: unknown command "${command || ""}"`);
		printUsage();
		process.exit(1);
	}

	// dynamically import dependencies to avoid loading env vars for help/print commands
	// this kinda silly, but i did not want to use a switch statement
	const needsDatabase = ["sync", "dry-run", "validate"].includes(command);
	const needsMigrationTools = ["generate-migration", "print-migration", "validate-enum"].includes(
		command
	);

	const { syncCapabilitiesToDatabase, validateCapabilitiesInSync } =
		await loadDatabaseTools(needsDatabase);
	const { generateCapabilityMigration, printCapabilityMigration, validateCapabilitiesEnum } =
		await loadMigrationTools(needsMigrationTools);

	try {
		switch (command) {
			case "sync": {
				console.log("syncing capabilities to database...");
				await syncCapabilitiesToDatabase();
				console.log("✅ capabilities synced successfully");
				break;
			}

			case "dry-run": {
				console.log("running dry-run sync...");
				await syncCapabilitiesToDatabase({ dryRun: true });
				console.log("✅ dry-run completed");
				break;
			}

			case "validate": {
				console.log("validating capabilities sync...");
				const { inSync, differences } = await validateCapabilitiesInSync();

				if (inSync) {
					console.log("✅ capabilities are in sync");
				} else {
					console.error("❌ capabilities are out of sync");
					console.error("differences:");
					differences?.forEach((diff) => console.error(`  - ${diff}`));
					process.exit(1);
				}
				break;
			}

			case "validate-enum": {
				console.log("validating capabilities enum...");
				const { enumInSync, enumDifferences } = validateCapabilitiesEnum();

				if (enumInSync) {
					console.log("✅ capabilities enum is in sync");
				} else {
					console.error("❌ capabilities enum is out of sync");
					if (enumDifferences?.toAdd.length) {
						console.error(`capabilities to add: ${enumDifferences.toAdd.join(", ")}`);
					}
					if (enumDifferences?.toRemove.length) {
						console.error(
							`capabilities to remove: ${enumDifferences.toRemove.join(", ")}`
						);
					}
					process.exit(1);
				}
				break;
			}

			case "generate-migration": {
				console.log("generating capability migration...");
				const migrationPath = generateCapabilityMigration();
				console.log(`✅ migration generated: ${migrationPath}`);
				console.log("📝 prisma schema file updated automatically");
				break;
			}

			case "print-migration": {
				printCapabilityMigration({ updatePrismaFile: false });
				break;
			}

			default: {
				console.error(`error: unhandled command "${command}"`);
				process.exit(1);
			}
		}
	} catch (error) {
		console.error("❌ command failed:", error);
		process.exit(1);
	}
};

// this is pretty neat, it only runs if you run the script directly, rather than being imported
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error("fatal error:", error);
		process.exit(1);
	});
}
