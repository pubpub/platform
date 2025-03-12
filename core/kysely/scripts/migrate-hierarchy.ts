/* eslint-disable no-console, no-restricted-properties */

import pluralize from "pluralize";

import type { CommunitiesId, PubsId } from "db/public";
import { CoreSchemaType } from "db/public";
import { expect } from "utils";

import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { slugifyString } from "~/lib/string";
import { createDatabase } from "../database-init";

const db = createDatabase({
	url: `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`,
	logLevel: "debug",
	debug: true,
});

type Relation = {
	parentPubId: PubsId;
	childPubId: PubsId;
	childPubTypeName: string;
	communityId: CommunitiesId;
	communitySlug: string;
	relationSlug: string;
};

const makeRelationsByCommunityId = (relations: Relation[]) => {
	const relationsByCommunityId = new Map<CommunitiesId, Map<string, Relation>>();
	for (const relation of relations) {
		let relationSlugs = relationsByCommunityId.get(relation.communityId);
		if (relationSlugs === undefined) {
			relationSlugs = new Map();
			relationsByCommunityId.set(relation.communityId, relationSlugs);
		}
		relationSlugs.set(relation.relationSlug, relation);
	}
	return relationsByCommunityId;
};

const migrateHierarchy = async () => {
	const relations: Relation[] = (
		await db
			.selectFrom("pubs as children")
			.innerJoin("pubs as parents", "children.parentId", "parents.id")
			.innerJoin("pub_types", "pub_types.id", "children.pubTypeId")
			.innerJoin("communities", "communities.id", "pub_types.communityId")
			.select([
				"parents.id as parentPubId",
				"children.id as childPubId",
				"pub_types.name as childPubTypeName",
				"communities.id as communityId",
				"communities.slug as communitySlug",
			])
			.execute()
	).map((relation) => {
		return {
			...relation,
			relationSlug: `${relation.communitySlug}:${slugifyString(pluralize(relation.childPubTypeName))}`,
		};
	});

	console.log(`Migrating ${relations.length} parent-child relationship(s) to relation fields:`);

	if (relations.length === 0) {
		console.log("No parent-child relations to migrate.");
		return;
	}

	const relationsByCommunityId = makeRelationsByCommunityId(relations);

	const relationFieldInsertExpressions = Array.from(relationsByCommunityId.entries()).flatMap(
		([communityId, relationSlugs]) =>
			Array.from(relationSlugs).map(([, relation]) => ({
				communityId,
				name: pluralize(relation.childPubTypeName),
				slug: relation.relationSlug,
				schemaName: CoreSchemaType.Null,
				isRelation: true,
			}))
	);

	console.log(`Creating ${relationFieldInsertExpressions.length} relation fields`);

	relationsByCommunityId.forEach((relationSlugs, communityId) => {
		console.log(
			`  In community ${communityId}: ${Array.from(relationSlugs.keys()).join(", ")}`
		);
	});

	await db.transaction().execute(async (trx) => {
		// upsert new relation fields
		const relationResults = await trx
			.insertInto("pub_fields")
			.values(relationFieldInsertExpressions)
			.returningAll()
			// Field slugs are unique, so do nothing if the slug already exists
			.onConflict((b) => b.doNothing())
			.execute();

		const persistedRelationsByRelationSlug = new Map(
			relationResults.map((relationResult) => [relationResult.slug, relationResult])
		);

		const relationValueInsertExpressions = relations
			.filter((relation) => persistedRelationsByRelationSlug.has(relation.relationSlug))
			.map((relation) => ({
				fieldId: expect(persistedRelationsByRelationSlug.get(relation.relationSlug)).id,
				pubId: relation.parentPubId,
				relatedPubId: relation.childPubId,
				lastModifiedBy: createLastModifiedBy("system"),
				value: null,
			}));

		if (relationValueInsertExpressions.length === 0) {
			console.log("No relation values to create.");
			return;
		}

		console.log(`Creating ${relationValueInsertExpressions.length} relation values`);

		// upsert relation values
		await trx
			.insertInto("pub_values")
			.values(relationValueInsertExpressions)
			// [pubId, relatedPubId, fieldId] is unique, so do nothing if the
			// relationship already exists
			.onConflict((b) => b.doNothing())
			.execute();
	});
};

migrateHierarchy()
	.then(() => {
		console.log("Successfully migrated hierarchy.");
	})
	.catch((error) => {
		console.error("Failed to migrate hierarchy. Any database changes were rolled back.");
		console.error(error);
	});
