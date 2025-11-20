// @ts-check

/**
 * Replaces the `oldRowData` and `newRowData` properties with `ColumnType<${parentTable}, string | null, string | null>`
 *
 * @type {import("kanel").PreRenderHook}
 */
function kanelHistoryTableGeneric(outputAcc, _instantiatedConfig) {
	return Object.fromEntries(
		Object.entries(outputAcc).map(([name, output]) => {
			const parentTable = name.match(/(\w+)History$/)?.[1]

			if (!parentTable) {
				return [name, output]
			}

			output.declarations = output.declarations.map((declaration) => {
				if (declaration.declarationType !== "interface") {
					return declaration
				}

				if (declaration.name !== `${parentTable}HistoryTable`) {
					return declaration
				}

				const replacedOldNewRowData = declaration.properties.map((property) => {
					if (property.name === "oldRowData" || property.name === "newRowData") {
						return {
							...property,
							typeName: `ColumnType<${parentTable}, string | null, string | null>`,
						}
					}
					return property
				})

				return {
					...declaration,
					properties: replacedOldNewRowData,
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
							name: "ColumnType",
							isDefault: false,
							path: "kysely",
							isAbsolute: true,
						},
					],
				}
			})

			return [name, output]
		})
	)
}

module.exports = { kanelHistoryTableGeneric }
