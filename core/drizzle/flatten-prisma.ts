import { execSync } from "child_process";
import fs from "node:fs/promises";
import path from "node:path";

async function main() {
	const prismaMigrationsFolder = new URL("../prisma/migrations", import.meta.url);
	const prismaMigrations = await fs.readdir(prismaMigrationsFolder);

	// ensure output directory exists
	await fs.mkdir(new URL("./migrations", import.meta.url), { recursive: true });

	const outputFile = new URL("./migrations/0000_init.sql", import.meta.url);
	const outputPath = path.relative(process.cwd(), outputFile.pathname);

	// create or truncate output file
	await fs.writeFile(outputFile, "");

	// track source file paths for git move
	const sourcePaths = [];

	for (const migration of prismaMigrations) {
		const migrationPath = path.join(prismaMigrationsFolder.pathname, migration);
		const stats = await fs.stat(migrationPath);
		if (!stats.isDirectory()) continue;

		const migrationFile = new URL(
			`../prisma/migrations/${migration}/migration.sql`,
			import.meta.url
		);
		const relativeMigrationPath = path.relative(process.cwd(), migrationFile.pathname);
		sourcePaths.push(relativeMigrationPath);

		try {
			// read migration file content as stream to handle large files efficiently
			const fileHandle = await fs.open(migrationFile, "r");
			const content = await fileHandle.readFile({ encoding: "utf-8" });
			await fileHandle.close();

			// ensure content ends with semicolon if not empty
			let processedContent = content.trim();
			if (processedContent.length > 0 && !processedContent.endsWith(";")) {
				processedContent += ";";
			}

			// append migration header and content to output file
			const header = `\n-- migration: ${migration}\n\n`;
			await fs.appendFile(outputFile, header + processedContent + "\n");
		} catch (error) {
			if (error.code === "ENOENT") {
				console.warn(`Migration file not found for ${migration}`);
				continue;
			}
			throw error;
		}
	}

	console.log(`Flattened migrations written to ${outputFile}`);

	// generate git commands to preserve history
	console.log("\nTo preserve git history, run the following commands:");
	console.log(`git add ${outputPath}`);
	console.log(`git commit -m "Create flattened migration file"`);

	// Create commands for each source file
	sourcePaths.forEach((sourcePath) => {
		execSync(
			`git blame ${sourcePath} --porcelain | awk '/^[0-9a-f]{40}/{print $1}' | xargs -I{} git blame ${outputPath} -C {} -f`
		);
	});

	console.log(
		"\nNote: This approach doesn't perfectly preserve git blame history but helps Git recognize moved code."
	);
}

main();
