import { afterEach } from "node:test";

import { describe, expect, it, vitest } from "vitest";

import type {
	ActionRunsId,
	CommunitiesId,
	PubFieldsId,
	PubsId,
	PubTypesId,
	PubValuesId,
	StagesId,
} from "db/public";
import { CoreSchemaType } from "db/public";

import type { ActionPub, RunProps } from "../types";
import type { action } from "./action";
import type { ClientExceptionOptions } from "~/lib/serverActions";
import { updatePub } from "~/lib/server";
import { didSucceed } from "~/lib/serverActions";
import { run } from "./run";

vitest.mock("~/lib/env/env.mjs", () => {
	return {
		env: {
			DATACITE_API_URL: "https://api.test.datacite.org",
			DATACITE_REPOSITORY_ID: "id",
			DATACITE_REPOSITORY_PASSWORD: "password",
		},
	};
});

vitest.mock("~/lib/server", () => {
	return {
		getPubsWithRelatedValuesAndChildren: () => {
			return { ...pub, values: [] };
		},
		updatePub: vitest.fn(() => {
			return {};
		}),
	};
});

type Fetch = typeof global.fetch;

// TODO: use vitest.stubGlobal with a little wrapper that lets us pass an array
// of responses
let _fetch = global.fetch;
const mockFetch = (...fns: Fetch[]) => {
	const mock = vitest.fn<Fetch>((url, init) => {
		const next = fns.shift();
		if (next === undefined) {
			throw new Error("mocked fetch called too many times");
		}
		return next(url, init);
	});
	global.fetch = mock;
	return mock;
};

const unmockFetch = () => {
	global.fetch = _fetch;
};

const pub = {
	id: "" as PubsId,
	values: [
		{
			id: "" as PubValuesId,
			fieldId: "" as PubFieldsId,
			fieldName: "",
			fieldSlug: "pubpub:title",
			value: "It's a title",
			createdAt: new Date(),
			updatedAt: new Date(),
			schemaName: CoreSchemaType.String,
			relatedPubId: null,
		},
		{
			id: "" as PubValuesId,
			fieldId: "" as PubFieldsId,
			fieldName: "",
			fieldSlug: "pubpub:doi",
			value: undefined,
			createdAt: new Date(),
			updatedAt: new Date(),
			schemaName: CoreSchemaType.String,
			relatedPubId: null,
		},
		{
			id: "" as PubValuesId,
			fieldId: "" as PubFieldsId,
			fieldName: "",
			fieldSlug: "pubpub:url",
			value: "https://www.pubpub.org",
			createdAt: new Date(),
			updatedAt: new Date(),
			schemaName: CoreSchemaType.URL,
			relatedPubId: null,
		},
		{
			id: "" as PubValuesId,
			fieldId: "" as PubFieldsId,
			fieldName: "",
			fieldSlug: "pubpub:publication-date",
			value: new Date("01-01-2024").toString(),
			createdAt: new Date(),
			updatedAt: new Date(),
			schemaName: CoreSchemaType.DateTime,
			relatedPubId: null,
		},
	],
	children: [],
	communityId: "" as CommunitiesId,
	createdAt: new Date(),
	updatedAt: new Date(),
	title: "A Preprint",
	pubType: {
		id: "" as PubTypesId,
		communityId: "" as CommunitiesId,
		name: "Preprint",
		description: "",
		createdAt: new Date(),
		updatedAt: new Date(),
		fields: [],
	},
	pubTypeId: "" as PubTypesId,
	stageId: null,
	parentId: null,
	depth: 1,
} as ActionPub;

const RUN_OPTIONS: RunProps<typeof action> = {
	actionRunId: "" as ActionRunsId,
	stageId: "" as StagesId,
	communityId: "" as CommunitiesId,
	config: {
		url: "placeholder",
		publisher: "Knowledge Futures",
		publicationDate: new Date(),
		creator: "placeholder",
		creatorName: "placeholder",
		doiPrefix: undefined,
		doi: "",
		doiSuffix: "placeholder",
		title: "placeholder",
		pubFields: {
			url: ["pubpub:url"],
			creator: ["pubpub:author"],
			creatorName: ["pubpub:name"],
			publicationDate: ["pubpub:publication-date"],
			doi: ["pubpub:doi"],
			doiSuffix: ["pubpub:doi-suffix"],
			title: ["pubpub:title"],
		},
	},
	configFieldOverrides: new Set(),
	pub,
	args: {} as any,
	argsFieldOverrides: new Set(),
	lastModifiedBy: "system|0",
};

const makeStubDatacitePayload = (doi?: string) => {
	return {
		data: {
			attributes: {
				doi,
			},
		},
	};
};

const makeStubDataciteResponse = (doi?: string) =>
	new Response(JSON.stringify(makeStubDatacitePayload(doi)));

describe("DataCite action", () => {
	afterEach(() => {
		unmockFetch();
	});

	it("creates a deposit if the pub does not have a DOI and a DOI prefix is configured", async () => {
		const doi = "10.100/a-preprint";
		const fetch = mockFetch(async () => makeStubDataciteResponse(doi));
		await run({ ...RUN_OPTIONS, config: { ...RUN_OPTIONS.config, doiPrefix: "10.100" } });

		expect(fetch).toHaveBeenCalledOnce();
		expect(fetch.mock.lastCall![1]!.method).toBe("POST");
		expect(updatePub).toHaveBeenCalledWith(
			expect.objectContaining({
				pubValues: {
					"pubpub:doi": doi,
				},
			})
		);
	});

	it("creates a deposit if the pub has a DOI not recognized by DataCite", async () => {
		const doi = "10.100/a-preprint";
		const fetch = mockFetch(
			async () => new Response(undefined, { status: 404 }),
			async () => makeStubDataciteResponse(doi)
		);
		await run({ ...RUN_OPTIONS, config: { ...RUN_OPTIONS.config, doi } });

		expect(fetch.mock.lastCall![1]!.method).toBe("POST");
	});

	it("updates a deposit if the pub has a DOI recognized by DataCite", async () => {
		const doi = "10.100/a-preprint";
		const fetch = mockFetch(
			async () => new Response(),
			async () => makeStubDataciteResponse(doi)
		);
		await run({ ...RUN_OPTIONS, config: { ...RUN_OPTIONS.config, doi } });

		expect(fetch.mock.lastCall![1]!.method).toBe("PUT");
	});

	it("reports an error if the pub has neither a DOI nor a DOI suffix and no DOI prefix is configured", async () => {
		const result = await run(RUN_OPTIONS);

		expect(didSucceed(result)).toBe(false);
	});

	it("reports an error when the DOI fails to persist", async () => {
		const error = new Error();
		vitest.mocked(updatePub).mockImplementationOnce(() => {
			throw error;
		});
		mockFetch(async () => makeStubDataciteResponse());
		const result = await run({
			...RUN_OPTIONS,
			config: { ...RUN_OPTIONS.config, doiPrefix: "10.100" },
		});

		expect(didSucceed(result)).toBe(false);
		expect((result as ClientExceptionOptions).cause).toBe(error);
	});

	it("uses the DOI suffix field if provided", async () => {
		const doiPrefix = "10.100";
		const doiSuffix = "100";
		const doi = `${doiPrefix}/${doiSuffix}`;

		const fetch = mockFetch(
			async () => new Response("{}"),
			async () => makeStubDataciteResponse(doi)
		);

		await run({
			...RUN_OPTIONS,
			config: {
				...RUN_OPTIONS.config,
				doiPrefix,
				doiSuffix,
			},
		});

		const call = fetch.mock.lastCall![1]!;
		const body = JSON.parse(call.body as string);
		expect(body.data.attributes.doi).toBe(doi);
		expect(call.method).toBe("POST");
	});

	it.todo("transforms related contributor pubs into DataCite creators");

	// unsure about these two one:
	it.todo("transforms child pubs with DOIs and related pubs into relatedIdentifiers");
	it.todo("transforms child pubs without DOIs into relatedItems");

	it.todo("deposits explicit and pub-provided metadata fields", () => {
		// Title
		// Publisher
		// Publication year
		// "Created" date
		// "Updated" date
		// Resource type -- probably hardcoded "Preprint" for now
		// URL
		// And more! (License etc.)
	});
});
