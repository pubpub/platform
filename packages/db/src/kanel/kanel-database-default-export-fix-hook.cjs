// @ts-check

/**
 *
 * @template {import("kanel").Declaration | import("kanel").InterfacePropertyDeclaration} T
 * @param {T} declaration
 * @returns {T}
 */
const makeNamedTypeImports = (declaration) => {
	const declarationWithNonDefaultImports = {
		...declaration,
		...("exportAs" in declaration ? { exportAs: "named" } : {}),
		typeImports: declaration?.typeImports?.map((typeImport) => ({
			...typeImport,
			isDefault: false,
		})),
	}

	if ("properties" in declaration) {
		return {
			...declarationWithNonDefaultImports,
			properties: declaration.properties.map(makeNamedTypeImports),
		}
	}

	return declarationWithNonDefaultImports
}

/**
 * This hook makes all the default exports of the database be named exports, so that they can be imported with `import { Table } from "db/table"`.
 * This is necessary to be able to import everything from `db/public` instead of e.g.`db/public/Users`, and fixes some other issues related
 * to `preconstruct` (specifically, `default export Database` leads to some weird situations)
 *
 * @type {import("kanel").PreRenderHook}
 */
function kanelDatabaseDefaultExportFixPreRenderHook(outputAcc, instantiatedConfig) {
	return Object.fromEntries(
		Object.entries(outputAcc).map(([name, output]) => {
			output.declarations = output.declarations.flatMap((declaration) => {
				const declarationWithNamedImports = makeNamedTypeImports(declaration)

				return declarationWithNamedImports
			})

			return [name, output]
		})
	)
}

module.exports = { kanelDatabaseDefaultExportFixPreRenderHook }
