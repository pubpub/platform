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
	};

	if ("properties" in declaration) {
		return {
			...declarationWithNonDefaultImports,
			properties: declaration.properties.map(makeNamedTypeImports),
		};
	}

	return declarationWithNonDefaultImports;
};

/**
 * @type {import("kanel").PreRenderHook}
 *
 */
function kanelDatabaseDefaultExportFixPreRenderHook(outputAcc, instantiatedConfig) {
	return Object.fromEntries(
		Object.entries(outputAcc).map(([name, output]) => {
			output.declarations = output.declarations.flatMap((declaration) => {
				const declarationWithNamedImports = makeNamedTypeImports(declaration);

				return declarationWithNamedImports;
			});

			return [name, output];
		})
	);
}

module.exports = { kanelDatabaseDefaultExportFixPreRenderHook };
