// @ts-check

const kanelZodCastRegex = /as unknown as z.Schema<(.*?)(Mutator|Initializer)?>/;

/**
 * @type {import("kanel").PostRenderHook}
 *
 * Renames the type of the `as unknown as z.Schema` casts from `kanel-zod` to
 * to be compatible with `kanel-kysely`, turning
 * 1. `as unknown as z.Schema<TableMutator>` into `as unknown as z.Schema<TableUpdate>`
 * 2. `as unknown as z.Schema<TableInitializer>` into `as unknown as z.Schema<NewTable>`
 */
// function kanelKyselyZodCompatibilityHook(path, lines, instantiatedConfig) {
// 	return lines;
// 	return lines.map((line) => {
// 		// if (line.includes("export const")) {
// 		// 	return line.replace(/export const (.*?) = z/, "export const $1Schema = z");
// 		// }
// 		// if (line.includes("import {")) {
// 		// 	const imports = line.replace(
// 		// 		/import \{(.*?)\} (from '\.\/.*?')/,
// 		// 		(_, imports, from) => {
// 		// 			const fix = `import {${imports.replace(/ (\w+), type/, " $1Schema, type")}} ${from}`;
// 		// 			return fix;
// 		// 		}
// 		// 	);
// 		// 	return imports;
// 		// }
// 		// if (!line.includes("as unknown as z.Schema")) {
// 		// 	return line;
// 		// }
// 		// const replacedLine = line.replace(
// 		// 	kanelZodCastRegex,
// 		// 	(_, typeName, mutatorOrInitializer) => {
// 		// 		if (!mutatorOrInitializer) {
// 		// 			return `satisfies z.Schema<${typeName}>`;
// 		// 		}
// 		// 		if (mutatorOrInitializer === "Mutator") {
// 		// 			return `satisfies z.Schema<${typeName}Update>`;
// 		// 		}
// 		// 		return `satisfies z.Schema<New${typeName}>`;
// 		// 	}
// 		// );
// 		// return replacedLine;
// 	});
// }

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

						// change enum into native enum
						if (declaration.comment?.[0]?.startsWith("Zod schema for ")) {
							const enumName =
								declaration.comment?.[0].match(/Zod schema for (.*)/)?.[1];

							if (enumName) {
								declaration.value = [`z.nativeEnum(${enumName})`];
							}
						}

						/**
						 * rename all the imports to use the Schema suffix
						 */
						const imports = declaration.typeImports?.map((typeImport) => {
							const { importAsType, isDefault, name, isAbsolute, path } = typeImport;
							const isSchemaImport = !isAbsolute && !isDefault && !importAsType;
							if (!isSchemaImport) {
								return typeImport;
							}

							return {
								...typeImport,
								name: `${name}Schema`,
							};
						});

						const declValue = Array.isArray(declaration.value)
							? declaration.value.map((line) => {
									line = line.replace(/(\w+?: [^z][^.]\w+)/, "$1Schema");

									if (!line.includes("as unknown as z.Schema")) {
										return line;
									}

									const replacedLine = line.replace(
										kanelZodCastRegex,
										(_, typeName, mutatorOrInitializer) => {
											if (!mutatorOrInitializer) {
												return `as z.Schema<${typeName}>`;
											}

											if (mutatorOrInitializer === "Mutator") {
												return `as z.Schema<${typeName}Update>`;
											}

											return `as z.Schema<New${typeName}>`;
										}
									);
									return replacedLine;
								})
							: // these are all the id schemas.
								// even though they are not enforced to be uuids in the database
								// for backwards compatibility reasons, we still want to enforce them
								// to be uuids when parsing, as we use uuids everywhere
								declaration.value.replace(/z.string\(\) /, "z.string().uuid() ");

						return {
							...declaration,
							typeImports: imports,
							value: declValue,
							name: `${declaration.name}Schema`,
						};
					}),
				},
			];
		})
	);

	return renamedSchemas;
}

module.exports = { kanelKyselyZodCompatibilityPreRenderHook };
