import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { Capabilities } from "db/public"
import { logger } from "logger"

import { generateCapabilityInserts } from "./capabalities.definition"

const generateMigrationTimestamp = (): string => {
	const now = new Date()
	const year = now.getUTCFullYear()
	const month = String(now.getUTCMonth() + 1).padStart(2, "0")
	const day = String(now.getUTCDate()).padStart(2, "0")
	const hour = String(now.getUTCHours()).padStart(2, "0")
	const minute = String(now.getUTCMinutes()).padStart(2, "0")
	const second = String(now.getUTCSeconds()).padStart(2, "0")

	return `${year}${month}${day}${hour}${minute}${second}`
}

const getCapabilitiesPrismaFilePath = (): string => {
	return join(process.cwd(), "prisma", "schema", "capabilities", "Capabilities.prisma")
}

const getCurrentCapabilitiesFromPrismaFile = (): string[] => {
	try {
		const filePath = getCapabilitiesPrismaFilePath()
		const content = readFileSync(filePath, "utf8")

		const enumMatch = content.match(/enum Capabilities \{([\s\S]*?)\}/)
		if (!enumMatch) {
			logger.warn({ msg: "could not find Capabilities enum in prisma file" })
			return []
		}

		const enumContent = enumMatch[1]
		const values: string[] = []

		const lines = enumContent.split("\n")
		for (const line of lines) {
			const trimmed = line.trim()
			if (trimmed && !trimmed.startsWith("//") && !trimmed.startsWith("/*")) {
				const capabilityMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9]*)/)
				if (capabilityMatch) {
					values.push(capabilityMatch[1])
				}
			}
		}

		return values
	} catch (error) {
		logger.warn({ msg: "could not read capabilities from prisma file", error })
		return []
	}
}

const getExpectedCapabilitiesEnum = (): string[] => {
	return Object.values(Capabilities).sort()
}

const updateCapabilitiesInPrismaFile = (newValues: string[]): void => {
	try {
		const filePath = getCapabilitiesPrismaFilePath()
		const content = readFileSync(filePath, "utf8")

		let newEnumContent = "enum Capabilities {\n"
		for (const value of newValues) {
			if (value === "manageStage") {
				newEnumContent += `    ${value} // includes managing stage name, actions, automations, and move constraints\n`
			} else {
				newEnumContent += `    ${value}\n`
			}
		}
		newEnumContent += "}"

		const newContent = content.replace(/enum Capabilities \{[\s\S]*?\}/, newEnumContent)

		writeFileSync(filePath, newContent, "utf8")

		logger.info({
			msg: "updated capabilities in prisma file",
			filePath,
			capabilitiesCount: newValues.length,
		})
	} catch (error) {
		logger.error({ msg: "failed to update capabilities in prisma file", error })
		throw error
	}
}

const generateEnumMigrationSql = (
	currentValues: string[],
	expectedValues: string[]
): { sql: string; hasChanges: boolean } => {
	const currentSet = new Set(currentValues)
	const expectedSet = new Set(expectedValues)

	const toAdd = expectedValues.filter((v) => !currentSet.has(v))
	const toRemove = currentValues.filter((v) => !expectedSet.has(v))

	const hasChanges = toAdd.length > 0 || toRemove.length > 0

	if (!hasChanges) {
		return { sql: "", hasChanges: false }
	}

	let sql = ""

	if (toRemove.length > 0) {
		// when removing enum values, we need to recreate the enum
		sql += `/*\nWarnings:\n\n- The values [${toRemove.join(",")}] on the enum \`Capabilities\` will be removed. If these variants are still used in the database, this will fail.\n\n*/\n`

		// delete rows that use the removed capabilities
		sql += `-- AlterEnum\n`
		sql += `DELETE FROM "membership_capabilities"\nWHERE\n`
		sql += toRemove
			.map((value) => `  "capability" = '${value}'::"Capabilities"`)
			.join("\n  OR ")
		sql += ";\n\n"

		sql += `BEGIN;\n\n`
		sql += `CREATE TYPE "Capabilities_new" AS ENUM(\n`
		sql += expectedValues.map((value) => `  '${value}'`).join(",\n")
		sql += "\n);\n\n"
		sql += `ALTER TABLE "membership_capabilities"\n`
		sql += `ALTER COLUMN "capability" TYPE "Capabilities_new" USING ("capability"::TEXT::"Capabilities_new");\n\n`
		sql += `ALTER TYPE "Capabilities"\n`
		sql += `RENAME TO "Capabilities_old";\n\n`
		sql += `ALTER TYPE "Capabilities_new"\n`
		sql += `RENAME TO "Capabilities";\n\n`
		sql += `DROP TYPE "Capabilities_old";\n\n`
		sql += `COMMIT;\n\n`
	} else if (toAdd.length > 0) {
		for (const value of toAdd) {
			sql += `-- AlterEnum\n`
			sql += `ALTER TYPE "Capabilities" ADD VALUE '${value}';\n`
		}
		sql += `COMMIT;\n\n`
	}

	return { sql, hasChanges }
}

const generateMigrationContent = (options?: { updatePrismaFile?: boolean }): string => {
	const updatePrisma = options?.updatePrismaFile ?? false

	const currentEnumValues = getCurrentCapabilitiesFromPrismaFile()
	const expectedEnumValues = getExpectedCapabilitiesEnum()

	const { sql: enumSql, hasChanges: enumHasChanges } = generateEnumMigrationSql(
		currentEnumValues,
		expectedEnumValues
	)

	if (updatePrisma && enumHasChanges) {
		updateCapabilitiesInPrismaFile(expectedEnumValues)
	}

	const capabilitySql = generateCapabilityInserts()

	let migrationContent = `-- generated from capability definitions in code\n`
	migrationContent += `-- this migration syncs the Capabilities enum and membership_capabilities table with canonical definitions\n\n`

	if (enumHasChanges) {
		migrationContent += enumSql
		migrationContent += `-- sync membership capabilities data after enum changes\n`
	} else {
		migrationContent += `-- no enum changes needed\n\n`
	}

	migrationContent += capabilitySql

	return migrationContent
}

export const generateCapabilityMigration = (options?: {
	outputDir?: string
	migrationName?: string
	updatePrismaFile?: boolean
}): string => {
	const timestamp = generateMigrationTimestamp()
	const migrationName = options?.migrationName ?? "sync_capabilities"
	const filename = `${timestamp}_${migrationName}`
	const outputDir = options?.outputDir ?? join(process.cwd(), "prisma", "migrations", filename)

	const migrationContent = generateMigrationContent({
		updatePrismaFile: options?.updatePrismaFile ?? true,
	})

	try {
		mkdirSync(outputDir, { recursive: true })

		const migrationPath = join(outputDir, "migration.sql")
		writeFileSync(migrationPath, migrationContent, "utf8")

		logger.info({
			msg: "capability migration generated successfully",
			path: migrationPath,
			timestamp,
		})

		return migrationPath
	} catch (error) {
		logger.error({ msg: "failed to generate capability migration", error })
		throw error
	}
}

export const printCapabilityMigration = (options?: { updatePrismaFile?: boolean }): void => {
	const _migrationContent = generateMigrationContent({
		updatePrismaFile: options?.updatePrismaFile ?? false,
	})
}

export const validateCapabilitiesEnum = (): {
	enumInSync: boolean
	enumDifferences?: {
		toAdd: string[]
		toRemove: string[]
	}
} => {
	try {
		const currentValues = getCurrentCapabilitiesFromPrismaFile()
		const expectedValues = getExpectedCapabilitiesEnum()

		const currentSet = new Set(currentValues)
		const expectedSet = new Set(expectedValues)

		const toAdd = expectedValues.filter((v) => !currentSet.has(v))
		const toRemove = currentValues.filter((v) => !expectedSet.has(v))

		const enumInSync = toAdd.length === 0 && toRemove.length === 0

		logger.info({
			msg: "capability enum validation",
			enumInSync,
			currentCount: currentValues.length,
			expectedCount: expectedValues.length,
			toAdd: toAdd.length > 0 ? toAdd : undefined,
			toRemove: toRemove.length > 0 ? toRemove : undefined,
		})

		return {
			enumInSync,
			enumDifferences: enumInSync ? undefined : { toAdd, toRemove },
		}
	} catch (error) {
		logger.error({ msg: "failed to validate capabilities enum", error })
		throw error
	}
}
