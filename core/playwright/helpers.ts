/* eslint-disable no-restricted-properties */
import type { Page } from "@playwright/test";

import { CoreSchemaType, MemberRole } from "db/public";

import type { CommunitySeedOutput, Seed } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { CommunityPage } from "./fixtures/community-page";
import { FieldsPage } from "./fixtures/fields-page";
import { PubTypesPage } from "./fixtures/pub-types-page";
import { InbucketClient } from "./inbucketClient";

export const createCommunity = async ({
	page,
	community,
	fields = [
		["Title", CoreSchemaType.String],
		["Content", CoreSchemaType.String],
	],
	types = [["Submission", "A submitted pub", ["title", "content"]]],
}: {
	page: Page;
	community?: Partial<{ name: string; slug: string }>;
	fields?: Parameters<InstanceType<typeof FieldsPage>["addField"]>[];
	types?: Parameters<InstanceType<typeof PubTypesPage>["addType"]>[];
}) => {
	const communitySlug = community?.slug ?? "test-community-slug";
	const communityPage = new CommunityPage(page);
	await communityPage.goto();
	await communityPage.addCommunity(community?.name ?? "test community", communitySlug);

	const fieldsPage = new FieldsPage(page, communitySlug);
	await fieldsPage.goto();
	for (const [name, format] of fields) {
		await fieldsPage.addField(name, format);
	}

	const typesPage = new PubTypesPage(page, communitySlug);
	await typesPage.goto();
	for (const [name, description, fields] of types) {
		await typesPage.addType(name, description, fields);
	}
};

const INBUCKET_TESTING_URL = process.env.INBUCKET_URL ?? "http://localhost:54324";

export const inbucketClient = new InbucketClient(INBUCKET_TESTING_URL);

export const retryAction = async (action: () => Promise<void>, maxAttempts = 3) => {
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			await action();
			return;
		} catch (error) {
			if (attempt === maxAttempts) throw error;
		}
	}
};

export const baseSeed = createSeed({
	community: { name: `test community`, slug: `test-community-slug` },
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
	},
	pubTypes: {
		Submission: {
			Title: { isTitle: true },
		},
	},
	users: {
		admin: {
			password: "password",
			role: MemberRole.admin,
		},
	},
});

export type BaseSeedOutput = CommunitySeedOutput<typeof baseSeed>;

export const seedBase = async () => {
	return seedCommunity(baseSeed) as any;
};
