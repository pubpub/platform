// @ts-check

const kanelZodCastRegex = /as unknown as z.Schema<(.*?)(Mutator|Initializer)?>/

/**
 * @param {string} schemaName
 */
const asZodObject = (schemaName) =>
	`as z.ZodObject<{[K in keyof ${schemaName}]: z.Schema<${schemaName}[K]>}>`

const replaceSchemaCast = (/** @type {string} */ line) => {
	line = line.replace(/(\w+?: [^z][^.]\w+)/, "$1Schema")

	if (!line.includes("as unknown as z.Schema")) {
		return line
	}

	const replacedLine = line.replace(kanelZodCastRegex, (_, typeName, mutatorOrInitializer) => {
		// TODO: write custom maps for unknown types, that way i don't need to do this
		return ""
		if (!mutatorOrInitializer) {
			return asZodObject(typeName)
		}

		if (mutatorOrInitializer === "Mutator") {
			return asZodObject(`${typeName}Update`)
		}

		return asZodObject(`New${typeName}`)
	})
	return replacedLine
}

/**
 * @param {import("kanel").TypeImport} typeImport
 */
const renameImportToUseSchemaSuffix = (typeImport) => {
	const { importAsType, isDefault, name, isAbsolute, path } = typeImport
	const isSchemaImport = !isAbsolute && !isDefault && !importAsType
	if (!isSchemaImport) {
		return typeImport
	}

	return {
		...typeImport,
		name: `${name}Schema`,
	}
}

/**
 * even though they are not enforced to be uuids in the database
 * for backwards compatibility reasons, we still want to enforce them
 * to be uuids when parsing, as we use uuids everywhere
 * @param {string} line
 */
const makeUuid = (line) => line.replace(/z.string\(\) /, "z.string().uuid() ")

/**
 * tables with composite primary keys that are NOT FK references to another table's PK end up
 * generating redundant schema types for each column. and they're invalid because they don't have
 * the Schema prefix that we append to the imports later in this hook.
 * @param {string} line
 */
const appendSchemaToIdentifiers = (line) =>
	line.replace(/^([^.]+) as unknown/, "$1Schema as unknown")

/**
 * @type {import("kanel").PreRenderHook}
 *
 * Does two things:
 * 1. Removes the `as unknown as z.Schema` casts from `kanel-zod` to allow you to use the `z.object`s as actual
 * ZodObjects. By casting them to `z.Schema`, you lose the ability to do e.g. `z.pick`, `z.partial`, etc. The
 * cast is also incorrect, as the type that it uses is not the Kysely one see https://github.com/kristiandupont/kanel/issues/563#issuecomment-2157934214.
 * 2. Casts the `id` fields to `z.string().uuid()` to allow them to be parsed as uuids, and brands them with the correct type.
 * This makes sure that if you do `usersSchema.parse(user)` it will return a type compatible with `Users`.
 */
function kanelKyselyZodCompatibilityPreRenderHook(outputAcc, instantiatedConfig) {
	const renamedSchemas = Object.fromEntries(
		Object.entries(outputAcc).map(([name, o]) => {
			const { declarations } = o

			return [
				name,
				{
					declarations: declarations.map((declaration) => {
						if (declaration.declarationType !== "constant") {
							return declaration
						}

						// change enum into native enum
						if (declaration.comment?.[0]?.startsWith("Zod schema for ")) {
							const enumName =
								declaration.comment?.[0].match(/Zod schema for (.*)/)?.[1]

							const value = Array.isArray(declaration.value)
								? declaration.value[0]
								: declaration.value

							if (enumName && value.startsWith("z.enum")) {
								declaration.value = [`z.nativeEnum(${enumName})`]
							}
						}

						/**
						 * rename all the imports to use the Schema suffix
						 */
						const imports = declaration.typeImports?.map(renameImportToUseSchemaSuffix)

						const declValue = Array.isArray(declaration.value)
							? declaration.value.map(replaceSchemaCast) // these are all the id schemas.
							: appendSchemaToIdentifiers(makeUuid(declaration.value))

						return {
							...declaration,
							typeImports: imports,
							value: declValue,
							name: `${declaration.name}Schema`,
						}
					}),
				},
			]
		})
	)

	return renamedSchemas
}

module.exports = { kanelKyselyZodCompatibilityPreRenderHook }
