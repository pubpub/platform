/* eslint-disable no-console */
import fs from "node:fs/promises";
import path from "node:path";

import { getTableName, Schema } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { PgDialect } from "drizzle-orm/pg-core";

import * as allProcedures from "./procedures";
import * as allTriggers from "./triggers";

// Configuration
const DRIZZLE_MIGRATIONS_DIR = "./drizzle/migrations";
const DRIZZLE_META_DIR = "./drizzle/migrations/meta";

const pgDialect = new PgDialect();

// A driver mock to compile SQL statements
const mockDriver = {
	escape: (str: string) => `'${str.replace(/'/g, "''")}'`,
};

// Simple hash function
function hashString(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return hash.toString(16);
}

async function main() {
	console.log("Generating migration for triggers and procedures...");

	// Get the latest migration file
	const migrationFiles = (await fs.readdir(DRIZZLE_MIGRATIONS_DIR))
		.filter((file) => file.endsWith(".sql"))
		.sort();

	if (migrationFiles.length === 0) {
		console.error("No migration files found!");
		process.exit(1);
	}

	const latestMigrationFile = migrationFiles[migrationFiles.length - 1];
	const migrationPath = path.join(DRIZZLE_MIGRATIONS_DIR, latestMigrationFile);

	console.log(`Using migration file: ${latestMigrationFile}`);

	// Get the latest snapshot to update
	const snapshotFiles = (await fs.readdir(DRIZZLE_META_DIR))
		.filter((file) => file.endsWith("_snapshot.json"))
		.sort();

	if (snapshotFiles.length === 0) {
		console.error("No snapshot files found!");
		process.exit(1);
	}

	const latestSnapshotFile = snapshotFiles[snapshotFiles.length - 1];
	const snapshotPath = path.join(DRIZZLE_META_DIR, latestSnapshotFile);

	console.log(`Using snapshot: ${latestSnapshotFile}`);

	// Read the snapshot
	const snapshotContent = await fs.readFile(snapshotPath, "utf8");
	const snapshot = JSON.parse(snapshotContent);

	// Initialize custom fields if they don't exist
	snapshot.procedures = snapshot.procedures || {};
	snapshot.triggers = snapshot.triggers || {};

	// Generate SQL for all procedures and triggers
	const procedures = Object.values(allProcedures);
	const triggers = Object.values(allTriggers);

	let migrationSql = "\n\n-- AUTOMATICALLY GENERATED PROCEDURES AND TRIGGERS\n\n";

	// First, generate procedures
	migrationSql += "-- PROCEDURES\n\n";

	for (const procedure of procedures) {
		// Compile body if it's an SQL template
		const bodyText = procedure.getBody();

		// Add the create statement
		migrationSql += `${procedure.getCreateStatement(bodyText)}\n\n`;

		// Update snapshot
		const procedureKey = `${procedure._.options.schema || "public"}.${procedure._.name}`;
		const snapshotProc = procedure.toJSON();
		snapshotProc.hash = hashString(bodyText);
		snapshot.procedures[procedureKey] = snapshotProc;
	}

	// go through old procedures, see if all match
	for (const key in snapshot.procedures) {
		if (!procedures.some((p) => p._.name === key)) {
			console.log(`Procedure ${key} no longer exists`);
			migrationSql += `DROP FUNCTION IF EXISTS "${key}";\n\n`;
		}
	}

	// Then, generate triggers
	migrationSql += "-- TRIGGERS\n\n";

	try {
		for (const trigger of triggers) {
			// Add drop statement first
			// migrationSql += `${trigger.getDropStatement()}\n\n`;

			// Add create statement
			const createStatement = trigger.getCreateStatement(mockDriver);
			migrationSql += `${createStatement}\n\n`;

			// Update snapshot
			const tableName = trigger.getObjectName();
			console.log(trigger._.table);
			const tableSchema = trigger._.table[Schema];
			const triggerKey = `${tableSchema}.${tableName}.${trigger._.name}`;

			const snapshotTrigger = trigger.toJSON();
			if (typeof trigger._.condition !== "string" && trigger._.condition) {
				snapshotTrigger.condition = pgDialect.sqlToQuery(trigger._.condition).sql;
			}
			snapshot.triggers[triggerKey] = snapshotTrigger;
		}

		for (const key in snapshot.triggers) {
			if (!triggers.some((t) => t._.name === key)) {
				console.log(`Trigger ${key} no longer exists`);
				migrationSql += `DROP TRIGGER IF EXISTS "${key}";\n\n`;
			}
		}
	} catch (e) {
		console.error("Something went wrong while generating the migration for triggers ", e);
		throw e;
	}

	// Append to migration file
	await fs.appendFile(migrationPath, migrationSql);
	console.log(`Appended triggers and procedures to ${latestMigrationFile}`);

	// Write updated snapshot
	await fs.writeFile(snapshotPath, JSON.stringify(snapshot));
	console.log(`Updated snapshot: ${latestSnapshotFile}`);

	console.log("Migration for database objects generated successfully!");
}

main().catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
