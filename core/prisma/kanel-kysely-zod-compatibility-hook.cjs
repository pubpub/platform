// @ts-check

const kanelZodCastRegex = /as unknown as z.Schema<(.*?)(Mutator|Initializer)>/;

/**
 * @type {import("kanel").PostRenderHook}
 *
 * Renames the type of the `as unknown as z.Schema` casts from `kanel-zod` to
 * to be compatible with `kanel-kysely`, turning
 * 1. `as unknown as z.Schema<TableMutator>` into `as unknown as z.Schema<TableUpdate>`
 * 2. `as unknown as z.Schema<TableInitializer>` into `as unknown as z.Schema<NewTable>`
 */
function kanelKyselyZodCompatibilityHook(path, lines, instantiatedConfig) {
	return lines.map((line) => {
		// if (line.includes("export const")) {
		// 	return line.replace(/export const (.*?) = z/, "export const $1Schema = z");
		// }

		if (!line.includes("as unknown as z.Schema")) {
			return line;
		}

		const replacedLine = line.replace(
			kanelZodCastRegex,
			(_, typeName, mutatorOrInitializer) => {
				if (!mutatorOrInitializer) {
					return `as unknown as z.Schema<${typeName}>`;
				}

				if (mutatorOrInitializer === "Mutator") {
					return `as unknown as z.Schema<${typeName}Update>`;
				}

				return `as unknown as z.Schema<New${typeName}>`;
			}
		);

		return replacedLine;
	});
}

/**
 * @type {import("kanel").PreRenderHook}
 *
 * Renames the type of the `as unknown as z.Schema` casts from `kanel-zod` to
 * to be compatible with `kanel-kysely`, turning
 * 1. `as unknown as z.Schema<TableMutator>` into `as unknown as z.Schema<TableUpdate>`
 * 2. `as unknown as z.Schema<TableInitializer>` into `as unknown as z.Schema<NewTable>`
 */
function kanelKyselyZodCompatibilityPreRenderHook(outputAcc, instantiatedConfig) {
	const renamedSchemas = Object.fromEntries(
		Object.entries(outputAcc).map(([name, o]) => {
			const { declarations } = o;

			return [
				name,
				{
					declarations: declarations.map((declaration) => {
						if (declaration.declarationType !== "constant") {
							return declaration;
						}

						return {
							...declaration,
							name: `${declaration.name}Schema`,
						};
					}),
				},
			];
		})
	);

	return renamedSchemas;
}

module.exports = { kanelKyselyZodCompatibilityHook, kanelKyselyZodCompatibilityPreRenderHook };
