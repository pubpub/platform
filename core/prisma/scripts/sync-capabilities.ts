#!/usr/bin/env tsx

import type {
	generateCapabilityMigration as generateCapabilityMigrationType,
	printCapabilityMigration as printCapabilityMigrationType,
	validateCapabilitiesEnum as validateCapabilitiesEnumType,
} from "~/lib/authorization/generate-migration"
import type {
	syncCapabilitiesToDatabase as syncCapabilitiesToDatabaseType,
	validateCapabilitiesInSync as validateCapabilitiesInSyncType,
} from "~/lib/authorization/sync-capabilities"

/* eslint-disable no-console */

const COMMANDS = {
	sync: "sync capabilities to database",
	"dry-run": "show what would be synced without making changes",
	validate: "check if capabilities are in sync",
	"validate-enum": "check if capabilities enum is in sync",
	"generate-migration": "generate a new migration file with enum changes",
	"print-migration": "print migration sql to stdout",
} as const

const printUsage = () => {
	for (const [_cmd, _desc] of Object.entries(COMMANDS)) {
	}
}

const loadDatabaseTools = async (
	needsDatabase: boolean
): Promise<{
	syncCapabilitiesToDatabase: typeof syncCapabilitiesToDatabaseType
	validateCapabilitiesInSync: typeof validateCapabilitiesInSyncType
}> => {
	if (!needsDatabase) {
		return {
			syncCapabilitiesToDatabase: null as any,
			validateCapabilitiesInSync: null as any,
		}
	}

	const syncModule = await import("~/lib/authorization/sync-capabilities")
	return {
		syncCapabilitiesToDatabase: syncModule.syncCapabilitiesToDatabase,
		validateCapabilitiesInSync: syncModule.validateCapabilitiesInSync,
	}
}

const loadMigrationTools = async (
	needsMigrationTools: boolean
): Promise<{
	generateCapabilityMigration: typeof generateCapabilityMigrationType
	printCapabilityMigration: typeof printCapabilityMigrationType
	validateCapabilitiesEnum: typeof validateCapabilitiesEnumType
}> => {
	if (!needsMigrationTools) {
		return {
			generateCapabilityMigration: null as any,
			printCapabilityMigration: null as any,
			validateCapabilitiesEnum: null as any,
		}
	}

	const migrationModule = await import("~/lib/authorization/generate-migration")
	return {
		generateCapabilityMigration: migrationModule.generateCapabilityMigration,
		printCapabilityMigration: migrationModule.printCapabilityMigration,
		validateCapabilitiesEnum: migrationModule.validateCapabilitiesEnum,
	}
}

const main = async () => {
	const command = process.argv[2] as keyof typeof COMMANDS | undefined

	if (!command || !(command in COMMANDS)) {
		printUsage()
		process.exit(1)
	}

	// dynamically import dependencies to avoid loading env vars for help/print commands
	// this kinda silly, but i did not want to use a switch statement
	const needsDatabase = ["sync", "dry-run", "validate"].includes(command)
	const needsMigrationTools = ["generate-migration", "print-migration", "validate-enum"].includes(
		command
	)

	const { syncCapabilitiesToDatabase, validateCapabilitiesInSync } =
		await loadDatabaseTools(needsDatabase)
	const { generateCapabilityMigration, printCapabilityMigration, validateCapabilitiesEnum } =
		await loadMigrationTools(needsMigrationTools)

	try {
		switch (command) {
			case "sync": {
				await syncCapabilitiesToDatabase()
				break
			}

			case "dry-run": {
				await syncCapabilitiesToDatabase({ dryRun: true })
				break
			}

			case "validate": {
				const { inSync, differences } = await validateCapabilitiesInSync()

				if (inSync) {
				} else {
					differences?.forEach((_diff) => {})
					process.exit(1)
				}
				break
			}

			case "validate-enum": {
				const { enumInSync, enumDifferences } = validateCapabilitiesEnum()

				if (enumInSync) {
				} else {
					if (enumDifferences?.toAdd.length) {
					}
					if (enumDifferences?.toRemove.length) {
					}
					process.exit(1)
				}
				break
			}

			case "generate-migration": {
				const _migrationPath = generateCapabilityMigration()
				break
			}

			case "print-migration": {
				printCapabilityMigration({ updatePrismaFile: false })
				break
			}

			default: {
				process.exit(1)
			}
		}
	} catch (_error) {
		process.exit(1)
	}
}

// this is pretty neat, it only runs if you run the script directly, rather than being imported
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((_error) => {
		process.exit(1)
	})
}
