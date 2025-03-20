import { execSync } from "child_process";
import fs from "node:fs/promises";
import path from "node:path";

interface CommitInfo {
	hash: string;
	author: string;
	email: string;
	date: string;
	content: string;
}

// get primary author for a migration file
async function getFilePrimaryAuthor(
	migrationFile: URL
): Promise<{ author: string; email: string } | null> {
	try {
		const filePath = path.relative(process.cwd(), migrationFile.pathname);

		// get the author who contributed the most lines
		const blameOutput = execSync(`git blame --line-porcelain ${filePath}`, {
			encoding: "utf-8",
		});

		const authorCounts = new Map<string, { count: number; email: string }>();

		let currentAuthor = "";
		let currentEmail = "";

		blameOutput.split("\n").forEach((line) => {
			if (line.startsWith("author ")) {
				currentAuthor = line.substring(7);
			} else if (line.startsWith("author-mail ")) {
				currentEmail = line.substring(12).replace(/[<>]/g, "");
			} else if (line.startsWith("\t")) {
				// content line - count it
				const authorKey = currentAuthor;
				if (!authorCounts.has(authorKey)) {
					authorCounts.set(authorKey, { count: 0, email: currentEmail });
				}

				const record = authorCounts.get(authorKey);
				record.count++;
			}
		});

		// find author with most contributions
		let primaryAuthor = null;
		let maxCount = 0;

		for (const [author, data] of authorCounts.entries()) {
			if (data.count > maxCount) {
				maxCount = data.count;
				primaryAuthor = { author, email: data.email };
			}
		}

		return primaryAuthor;
	} catch (error) {
		console.warn(`Could not get git blame for ${migrationFile}: ${error.message}`);
		return null;
	}
}

async function main() {
	const prismaMigrationsFolder = new URL("../prisma/migrations", import.meta.url);
	const prismaMigrations = await fs.readdir(prismaMigrationsFolder);

	// ensure output directory exists
	await fs.mkdir(new URL("./migrations", import.meta.url), { recursive: true });
	const outputFile = new URL("./migrations/0000_init.sql", import.meta.url);
	const outputPath = path.relative(process.cwd(), outputFile.pathname);

	// Sort migrations by name to ensure chronological order
	const sortedMigrations = prismaMigrations.sort();

	// gather all migrations with their authors
	const migrationsWithAuthors = [];

	for (const migration of sortedMigrations) {
		const migrationPath = path.join(prismaMigrationsFolder.pathname, migration);
		const stats = await fs.stat(migrationPath);
		if (!stats.isDirectory()) continue;

		const migrationFile = new URL(
			`../prisma/migrations/${migration}/migration.sql`,
			import.meta.url
		);

		try {
			// read raw content
			const fileHandle = await fs.open(migrationFile, "r");
			const content = await fileHandle.readFile({ encoding: "utf-8" });
			await fileHandle.close();

			// ensure content ends with semicolon if not empty
			let processedContent = content.trim();
			if (processedContent.length > 0 && !processedContent.endsWith(";")) {
				processedContent += ";";
			}

			// get primary author for this migration
			const authorInfo = await getFilePrimaryAuthor(migrationFile);

			if (authorInfo) {
				migrationsWithAuthors.push({
					migration,
					content: `-- migration: ${migration}\n\n${processedContent}\n`,
					author: authorInfo.author,
					email: authorInfo.email,
				});
			} else {
				// fallback: use current git user
				const currentAuthor = execSync("git config user.name", {
					encoding: "utf-8",
				}).trim();
				const currentEmail = execSync("git config user.email", {
					encoding: "utf-8",
				}).trim();

				migrationsWithAuthors.push({
					migration,
					content: `-- migration: ${migration}\n\n${processedContent}\n`,
					author: currentAuthor,
					email: currentEmail,
				});
			}
		} catch (error) {
			if (error.code === "ENOENT") {
				console.warn(`Migration file not found for ${migration}`);
				continue;
			}
			throw error;
		}
	}

	// create script to generate all commits in order
	const scriptFile = new URL("./create_migration_history.sh", import.meta.url);
	const scriptPath = path.relative(process.cwd(), scriptFile.pathname);

	let scriptContent = `#!/bin/bash
set -e

# Create empty migration file
>${outputPath}

# Process migrations in chronological order
`;

	// add each migration as a separate commit by its author
	for (const { migration, content, author, email } of migrationsWithAuthors) {
		const authorString = `${author} <${email}>`;

		scriptContent += `# Migration: ${migration} by ${author}\n`;
		scriptContent += `cat >> ${outputPath} << 'EOF'\n`;
		scriptContent += content + "\n";
		scriptContent += "EOF\n\n";

		// create commit with this author
		scriptContent += `git add ${outputPath}\n`;
		scriptContent += `GIT_COMMITTER_NAME="${author}" GIT_COMMITTER_EMAIL="${email}" `;
		scriptContent += `git commit --author="${authorString}" -m "Move migration ${migration} to flattened file"\n\n`;
	}

	// write script and make it executable
	await fs.writeFile(scriptFile, scriptContent);
	await fs.chmod(scriptFile, 0o755);

	console.log(`Script generated at ${scriptPath}`);
	console.log(`Run it to create the flattened migration file with preserved git history.`);
	console.log(
		`Note: This will create ${migrationsWithAuthors.length} commits in chronological order.`
	);
}

main();
