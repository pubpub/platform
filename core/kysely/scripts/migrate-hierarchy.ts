import pluralize from "pluralize";

import type { CommunitiesId, PubsId } from "db/public";
import { CoreSchemaType } from "db/public";
import { expect } from "utils";

import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { slugifyString } from "~/lib/string";
import { db } from "../database";

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
		let communityRelationSlugs = relationsByCommunityId.get(relation.communityId);
		if (communityRelationSlugs === undefined) {
			communityRelationSlugs = new Map();
			relationsByCommunityId.set(relation.communityId, communityRelationSlugs);
		}
		communityRelationSlugs.set(relation.relationSlug, relation);
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

	console.log(relationFieldInsertExpressions);

	// upsert new relation fields
	const relationResults = await db
		.insertInto("pub_fields")
		.values(relationFieldInsertExpressions)
		.returningAll()
		// Field slugs are unique, so do nothing if the slug already exists
		.onConflict((b) => b.doNothing())
		.execute();

	const persistedRelationsByRelationSlug = new Map(
		relationResults.map((relationResult) => [relationResult.slug, relationResult])
	);

	console.log(persistedRelationsByRelationSlug);

	const relationValueInsertExpressions = relations
		.filter((relation) => persistedRelationsByRelationSlug.has(relation.relationSlug))
		.map((relation) => ({
			fieldId: expect(persistedRelationsByRelationSlug.get(relation.relationSlug)).id,
			pubId: relation.parentPubId,
			relatedPubId: relation.childPubId,
			lastModifiedBy: createLastModifiedBy("system"),
			value: null,
		}));

	// upsert relation values
	await db
		.insertInto("pub_values")
		.values(relationValueInsertExpressions)
		// [pubId, relatedPubId, fieldId] is unique, so do nothing if the
		// relationship already exists
		.onConflict((b) => b.doNothing())
		.execute();
};

migrateHierarchy();
