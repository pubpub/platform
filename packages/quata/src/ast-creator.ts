/** biome-ignore-all lint/suspicious/noConsole: console is used for debugging */
import jsonata from "jsonata"

const defaultQuery = `$$[size < $length($input.body.entries) and status = $input.status]^(>priority, created_at).{
    "title": $.title,
    "snippet": $substring($.body, 0, $input.config.snippet_length),
    "query_terms": $split($lower($input.query), " ")
  }`

export function createAst(query: string = defaultQuery) {
	const ast = jsonata(query)
	return ast.ast()
}

if (import.meta.main) {
	const args = process.argv.slice(2)
	const ast = createAst(args[0])
	console.dir(ast, { depth: null })
}
