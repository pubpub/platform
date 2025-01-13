// @ts-check

/**
 * @type {import("kanel").PreRenderHook}
 */
function kanelDatabaseDefaultExportFixPreRenderHook(outputAcc, instantiatedConfig) {
	return Object.fromEntries(
		Object.entries(outputAcc).map(([name, output]) => {
			output.declarations = output.declarations.flatMap((declaration) => {
				if (declaration.declarationType !== "enum") {
					return declaration
				}

				const comment = declaration.comment

				if (!comment) {
					return declaration
				}

				const cleanedComment = comment.flatMap((line) => line.split(/\n/))

				return {
					...declaration,
					comment: cleanedComment,
				}
			})

			return [name, output]
		})
	)
}

module.exports = { cleanupEnumComments: kanelDatabaseDefaultExportFixPreRenderHook }
