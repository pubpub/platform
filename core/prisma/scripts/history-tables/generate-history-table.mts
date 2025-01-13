import { spawnSync } from "child_process"
import fs from "fs"
import readline from "readline/promises"

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

const tableName = await rl.question(
	"Enter the name of the table (snake_case) to generate a history table for: "
)

if (!tableName) {
	throw new Error("Please provide a table name")
}

const baseModelNamePlural = toPascalCase(tableName)

const baseModelNameSingular = baseModelNamePlural.replace(/(ie)?s$/, (_, ie) => (ie ? "y" : ""))

const historyModelName = `${baseModelNameSingular}History`
const historyTableName = `${tableName}_history`

const prismaFolder = new URL("../../schema", import.meta.url).pathname

const schemaFile = new URL(`${prismaFolder}/schema.prisma`, import.meta.url).pathname

const migrationsFolder = new URL("../../migrations", import.meta.url).pathname

const historyTableFolder = new URL(`${prismaFolder}/history-tables`, import.meta.url).pathname

const newHistoryTableFile = new URL(
	`${historyTableFolder}/${historyModelName}.prisma`,
	import.meta.url
).pathname

const historyTableAlreadyExists = fs.existsSync(newHistoryTableFile)

if (historyTableAlreadyExists) {
	console.warn(`History table ${tableName} already exists`)
	const answer = await rl.question(`Do you want to overwrite it? (y/N)`)
	if (answer !== "y") {
		throw new Error(`History table ${tableName} already exists`)
	}

	fs.unlinkSync(newHistoryTableFile)
}

const camelCasedTableName = `${baseModelNameSingular[0].toLowerCase()}${baseModelNameSingular.slice(1)}`

const historyTableSchema = `
model ${historyModelName} {
 id            String        @id @default(dbgenerated("gen_random_uuid()"))
 createdAt     DateTime      @default(now())
 operationType OperationType

 // has check constraint to ensure that oldRowData and newRowData are not both null
 // see ./migrations/20241203164958_add_history_table/migration.sql
 // type is the type of the Table that is being changed, e.g \`PubValues\` for PubValuesHistory
 // using a kysely pre-render hook
 oldRowData Json?
 newRowData Json?

 // primary key of the row that was changed
 ${camelCasedTableName}Id String?

 // identifying information
 user             User?           @relation(fields: [userId], references: [id])
 userId           String?
 apiAccessToken   ApiAccessToken? @relation(fields: [apiAccessTokenId], references: [id])
 apiAccessTokenId String?
 actionRun        ActionRun?      @relation(fields: [actionRunId], references: [id])
 actionRunId      String?
 // set to \`system\` if the change was made by the system, eg during seeds
 other            String?

 @@map(name: "${historyTableName}")
}
`

fs.writeFileSync(newHistoryTableFile, historyTableSchema)

console.log(`✅ History table ${historyModelName} created`)
console.log("Adding lastModifiedBy column to base table...")

const schemaText = fs.readFileSync(schemaFile, "utf-8")

const baseTableModelRegx = new RegExp(`model ${baseModelNameSingular} \\{.*?\\}\\n`, "msi")

const baseTableModelText = schemaText.match(baseTableModelRegx)?.[0]

if (!baseTableModelText) {
	throw new Error("Failed to find base table model in schema file")
}

const baseTableModelLastModifiedByColumn = baseTableModelText.match(
	new RegExp(`lastModifiedBy String`, "msi")
)?.[0]

if (!baseTableModelLastModifiedByColumn) {
	// this instructs kanel to use a different type for the lastModifiedBy column
	// defined at `db/src/types/LastModifiedBy.ts`
	const typeComment = `/// @type(LastModifiedBy, '../types', true, false, true)`
	const baseTableModelWithNewLastModifiedByColumn = baseTableModelText.replace(
		/(id\b.*?)\n/,
		`\$1
  ${typeComment}
  lastModifiedBy String\n`
	)

	const baseTableSchemaWithNewLastModifiedByColumn = schemaText.replace(
		baseTableModelText,
		baseTableModelWithNewLastModifiedByColumn
	)

	fs.writeFileSync(schemaFile, baseTableSchemaWithNewLastModifiedByColumn)

	console.log(`✅ Last modified by column added to base table`)
} else {
	console.log(`✅ Last modified by column already exists in base table`)
}

console.log("Formatting...")

spawnSync("pnpm --filter core exec prisma format", {
	stdio: "inherit",
	shell: true,
})

console.log("Done!")

const continueWithMigration = await rl.question(
	"Do you also want to create a migration file? (Y/n)"
)

if (continueWithMigration === "n") {
	console.log("Skipping migration file creation...")
	console.log("Done!")
	process.exit(0)
}
const date = new Date().toISOString().replace(/[-:T]/g, "").split(".")[0]

const newMigrationName = `${date}_add_${historyTableName}_history_table`

const newMigrationFolder = new URL(`${migrationsFolder}/${newMigrationName}`, import.meta.url)
	.pathname

fs.mkdirSync(newMigrationFolder, { recursive: true })

const newMigrationFile = new URL(`${newMigrationFolder}/migration.sql`, import.meta.url).pathname

const migrationTemplate = fs.readFileSync(
	new URL("./history-table-migration-template.sql", import.meta.url).pathname,
	"utf-8"
)

const migrationContent = migrationTemplate
	.replace(/{{tableName}}/g, tableName)
	.replace(/{{historyTableName}}/g, historyTableName)
	.replace(/{{camelCasedTableName}}/g, camelCasedTableName)

fs.writeFileSync(newMigrationFile, migrationContent)

console.log(`✅ Migration file ${newMigrationName} created`)
console.log("Run `pnpm --filter core migrate-dev` to apply the migration")
console.log("Done!")

process.exit(0)

function toPascalCase(str: string) {
	return str.replace(/^\w|_\w/g, (match) => match.replace(/_/g, "").toUpperCase())
}
