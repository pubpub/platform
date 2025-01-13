import type { databaseTableNames } from "db/table-names";

type DatabaseTableName = (typeof databaseTableNames)[number];

type LinkedCacheTags = {
	[Table in DatabaseTableName]?: DatabaseTableName[];
};

/**
 * which tables should be tagged with extra tags when using `autoCache`
 *
 * this is necessary when eg tables are updated outside of the app logic,
 * like through a trigger.
 */
export const LINKED_CACHE_TAGS = {
	// updating the title pub_value of a pub triggers an update of pub.title
	// updating a pub_value in general triggers an update of pub.updatedAt
	// updating _PubFieldToPubType (eg setting isTitle to true) triggers an update of pub.title
	pubs: ["pub_values", "_PubFieldToPubType"],
} as LinkedCacheTags;

export const getTablesWithLinkedTables = (tables: DatabaseTableName[]) => {
	const extraTables = tables.flatMap((table) => LINKED_CACHE_TAGS[table] ?? []);

	const uniqueExtraTables = [...new Set([...tables, ...extraTables])];

	return uniqueExtraTables;
};
