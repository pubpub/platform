import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

type SqlObject = { name: string; sql: string }

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, "migrations")
const outputFile = join(__dirname, "consolidated-triggers.sql")

const migrationDirs = readdirSync(migrationsDir)
	.filter((f) => f.match(/^\d{14}_/))
	.sort()

const functions = new Map<string, SqlObject>()
const triggers = new Map<string, SqlObject>()

const extractName = (sql: string, pattern: RegExp) => {
	const match = sql.match(pattern)
	return match?.[1]?.trim()
}

for (const dir of migrationDirs) {
	const file = join(migrationsDir, dir, "migration.sql")
	try {
		const content = readFileSync(file, "utf-8")

		// extract function definitions (capture until LANGUAGE clause with optional modifiers)
		const functionMatches = content.matchAll(
			/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(\w+)\s*\([^)]*\)[\s\S]*?LANGUAGE\s+\w+(?:\s+(?:VOLATILE|STABLE|IMMUTABLE|STRICT|SECURITY\s+DEFINER|SECURITY\s+INVOKER))*\s*;/gi
		)
		for (const match of functionMatches) {
			const name = match[1].trim()
			functions.set(name, { name, sql: match[0].trim() })
		}

		// extract trigger definitions
		const triggerMatches = content.matchAll(
			/^CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+(\w+)[\s\S]*?EXECUTE\s+(?:FUNCTION|PROCEDURE)\s+\w+\s*\([^)]*\)\s*;/gim
		)

		for (const match of triggerMatches) {
			const name = extractName(match[0], /CREATE.*?TRIGGER\s+(\w+)/i)
			if (name) triggers.set(name, { name, sql: match[0].trim() })
		}

		// handle drops
		const dropMatches = content.matchAll(
			/DROP\s+(TRIGGER|FUNCTION)\s+(?:IF\s+EXISTS\s+)?(\w+)/gi
		)
		for (const match of dropMatches) {
			const [, type, name] = match
			if (type.toUpperCase() === "TRIGGER") triggers.delete(name)
			if (type.toUpperCase() === "FUNCTION") functions.delete(name)
		}
	} catch {}
}

const triggersByTable = new Map<string, SqlObject[]>()
const _functionsByName = new Map<string, SqlObject>()

// group triggers by table
for (const trigger of triggers.values()) {
	const tableMatch = trigger.sql.match(
		/(?:AFTER|BEFORE)\s+(?:\w+\s+(?:OR\s+\w+\s+)*)+ON\s+"?(\w+)"?/i
	)
	const table = tableMatch?.[1] || "unknown"
	if (!triggersByTable.has(table)) triggersByTable.set(table, [])
	triggersByTable.get(table)!.push(trigger)
}

// map functions to triggers that use them
const triggerFunctions = new Set<string>()
for (const trigger of triggers.values()) {
	const fnMatch = trigger.sql.match(/EXECUTE\s+(?:FUNCTION|PROCEDURE)\s+(\w+)/i)
	if (fnMatch) triggerFunctions.add(fnMatch[1])
}

// build output
const output: string[] = ["-- Consolidated triggers and functions", ""]

// sort tables for determinism
const sortedTables = Array.from(triggersByTable.keys()).sort()

for (const table of sortedTables) {
	const tableTriggers = triggersByTable.get(table)!
	output.push(`-- Table: ${table}`, "")

	// add functions used by these triggers
	const usedFunctions = new Set<string>()
	for (const trigger of tableTriggers) {
		const fnMatch = trigger.sql.match(/EXECUTE\s+(?:FUNCTION|PROCEDURE)\s+(\w+)/i)
		if (fnMatch && functions.has(fnMatch[1])) usedFunctions.add(fnMatch[1])
	}

	for (const fnName of Array.from(usedFunctions).sort()) {
		output.push(functions.get(fnName)!.sql, "", "")
	}

	// add triggers
	for (const trigger of tableTriggers) {
		output.push(trigger.sql, "")
	}

	output.push("")
}

// add remaining functions not associated with triggers
output.push("-- Standalone functions", "")
for (const [name, fn] of Array.from(functions.entries()).sort(([a], [b]) => a.localeCompare(b))) {
	if (!triggerFunctions.has(name)) {
		output.push(fn.sql, "", "")
	}
}

writeFileSync(outputFile, output.join("\n"))
console.log(
	`Consolidated ${functions.size} functions and ${triggers.size} triggers to ${outputFile}`
)
