// @ts-check

/**
 * @type {import("kanel").PreRenderHook}
 */
function kanelHistoryTableGeneric(outputAcc, instantiatedConfig) {
	return Object.fromEntries(
		Object.entries(outputAcc).map(([name, output]) => {
			const parentTable = name.match(/(\w+)History$/)?.[1];

			console.log(name, parentTable);
			if (!parentTable) {
				return [name, output];
			}
			console.log(name, parentTable);

			output.declarations = output.declarations.map((declaration) => {
				if (declaration.declarationType !== "interface") {
					return declaration;
				}

				if (declaration.name !== `${parentTable}HistoryTable`) {
					return declaration;
				}
				const idName = `${parentTable}HistoryId`;

				return {
					name: `${parentTable}HistoryTable`,
					declarationType: "typeDeclaration",
					typeDefinition: [`HistoryTable<${parentTable}, ${idName}>`],
					exportAs: "named",
					comment: declaration.comment,
					typeImports: [
						{
							importAsType: true,
							name: parentTable,
							isDefault: false,
							path: `./${parentTable}`,
							isAbsolute: true,
						},
						{
							importAsType: true,
							name: "HistoryTable",
							isDefault: false,
							path: "../types/HistoryTable",
							isAbsolute: true,
						},
					],
				};
			});

			return [name, output];
		})
	);
}

module.exports = { kanelHistoryTableGeneric };
