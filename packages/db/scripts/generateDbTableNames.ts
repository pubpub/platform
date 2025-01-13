import { writeFile } from "fs/promises"

import { Kysely, PostgresDialect, TableMetadata } from "kysely"
import { Pool } from "pg"

import { logger } from "logger"

import type { Database } from "../src/Database"

const db = new Kysely<Database>({
	dialect: new PostgresDialect({
		pool: new Pool({
			connectionString: process.env.DATABASE_URL,
		}),
	}),
})

const fileTemplate = (tableNames: string[], tables: TableMetadata[]) =>
	`// This file is generated by generateDbTableNames.ts
// Do not modify manually

export const databaseTableNames = ${JSON.stringify(tableNames, null, 2)} as const; 

export const databaseTables = ${JSON.stringify(tables, null, 2)};
`

async function generateDatabaseTables(destination: string, schemas = ["public"]) {
	logger.info(`Generating database tables at ${destination} for schemas ${schemas.join(", ")}`)

	const currentPath = new URL(import.meta.url).pathname

	const packageDbPath = currentPath.match(/.*?\/packages\/db\//)?.[0]

	const destinationPath = `${packageDbPath}${destination}`

	const tables = await db.introspection.getTables()

	if (!tables) {
		throw new Error("No tables found")
	}
	const filteredTables = tables
		// do not include jobs and other tables
		.filter((table) => table.schema && schemas.includes(table.schema))

	const tableNames = filteredTables.map((table) => table.name)

	return writeFile(destinationPath, fileTemplate(tableNames, filteredTables))
}

const destination = process.argv[2]

if (!destination) {
	throw new Error("No destination provided")
}

if (!destination?.endsWith(".ts")) {
	throw new Error("Destination must be a typescript file")
}

const [, , , ...schemas] = process.argv

generateDatabaseTables(destination, schemas)
	.then(() => {
		logger.info(`Database tables generated at: ${destination}`)
		process.exit(0)
	})
	.catch((error) => {
		logger.error({ msg: "Error generating database tables", error })
	})
