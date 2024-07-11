// @ts-check

/**
 * @type {import("kanel").PreRenderHook}
 *
 */
function kanelDatabaseDefaultExportFixPreRenderHook(outputAcc, instantiatedConfig) {
	return Object.fromEntries(
		Object.entries(outputAcc).map(([name, output]) => {
			if (name !== "src/Database") {
				return [name, output];
			}
			output.declarations = output.declarations.flatMap((declaration) => {
				if (
					declaration.declarationType !== "typeDeclaration" ||
					declaration.name !== "Database"
				) {
					return [declaration];
				}
				console.log(declaration);
				return [
					{
						...declaration,
						exportAs: "named",
						comment: [
							"We export this as named in order to avoid weirdness with preconstruct.",
						],
					},
					{
						...declaration,
						name: "DefaultDatabaseExport",
						comment: ["Backup default export that's the same as the above"],
					},
				];
			});

			console.log(output);

			return [name, output];
		})
	);
}

module.exports = { kanelDatabaseDefaultExportFixPreRenderHook };
