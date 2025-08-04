/* eslint-disable no-restricted-properties */
import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";

import { CoreSchemaType, MemberRole } from "db/public";

import type { MessageResponse } from "./inbucketClient";
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

export const getUrlFromInbucketMessage = async (message: MessageResponse, page: Page) => {
	const url = message.body.html?.match(/a href="([^"]+)"/)?.[1];
	if (!url) {
		return undefined;
	}

	// Use the browser to decode the html entities in our URL
	const decodedUrl = await page.evaluate((url) => {
		const elem = document.createElement("div");
		elem.innerHTML = url;
		return elem.textContent!;
	}, url!);

	return decodedUrl;
};

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

export const createBaseSeed = () => {
	const id = crypto.randomUUID();
	return createSeed({
		community: { name: `test community ${id}`, slug: `test-community-${id}` },
		pubFields: {
			Title: { schemaName: CoreSchemaType.String },
			Content: { schemaName: CoreSchemaType.String },
		},
		pubTypes: {
			Submission: {
				Title: { isTitle: true },
				Content: { isTitle: false },
			},
		},
		users: {
			admin: {
				slug: faker.string.nanoid(),
				password: "password",
				role: MemberRole.admin,
			},
		},
	});
};

export type BaseSeedOutput = CommunitySeedOutput<ReturnType<typeof createBaseSeed>>;

export const seedBase = async () => {
	const baseSeed = createBaseSeed();
	return seedCommunity(baseSeed) as any;
};

export const PubFieldsOfEachType = Object.fromEntries(
	Object.values(CoreSchemaType).map((type) => [
		type,
		{
			schemaName: type,
		},
	])
) as Record<CoreSchemaType, { schemaName: CoreSchemaType }>;

export const waitForBaseCommunityPage = async (
	page: Page,
	communitySlug?: string,
	slug?: "pubs" | "stages"
) => {
	await page.waitForURL(new RegExp(`.*/c/${communitySlug ?? ".*"}/${slug ?? "stages"}.*`), {
		timeout: 10_000,
	});
};

export const closeToast = async (page: Page) => {
	await page.getByTestId("toast-close").click();
};
