import { describe, expect, it } from "vitest";

import { Action, ActionRunStatus, CoreSchemaType, Event } from "db/public";

import { mockServerCode } from "~/lib/__tests__/utils";

const { createForEachMockedTransaction, getCommunity } = await mockServerCode();
const { getTrx } = createForEachMockedTransaction();

const pubTriggerTestSeed = async () => {
	const slugName = `test-server-pub-${new Date().toISOString()}`;
	getCommunity.mockImplementation(() => {
		return {
			slug: slugName,
		};
	});
	const { createSeed } = await import("~/prisma/seed/createSeed");

	return createSeed({
		community: {
			name: "test",
			slug: slugName,
		},
		pubFields: {
			Title: { schemaName: CoreSchemaType.String },
			Description: { schemaName: CoreSchemaType.String },
		},
		pubTypes: {
			"Basic Pub": {
				Title: { isTitle: true },
				Description: { isTitle: false },
			},
		},
		stages: {
			Submission: {
				actions: {
					"1": {
						action: Action.log,
						config: {
							debounce: 1,
						},
					},
					"2": {
						action: Action.email,
						config: {
							recipientEmail: "all@pubpub.org",
							body: "Hello",
							subject: "Test",
						},
					},
					"3": {
						action: Action.googleDriveImport,
						config: {
							folderUrl: "https://drive.google.com/drive/folders/1234567890",
							outputField: `${slugName}:title`,
						},
					},
				},
			},
		},
		pubs: [
			{
				pubType: "Basic Pub",
				values: {
					Title: "Some title",
					Description: "Some description",
				},
				stage: "Submission",
			},
		],
		forms: {},
	});
};

describe("runActionInstance", () => {
	it("should be able to successfully run the most simple action", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { pubs, actions, community } = await seedCommunity(await pubTriggerTestSeed(), {
			randomSlug: false,
		});
		const { runActionInstance } = await import("~/actions/_lib/runActionInstance");

		const logActionInstance = actions.find((a) => a.action === Action.log)!;
		const result = await runActionInstance({
			actionInstanceId: logActionInstance.id,
			pubId: pubs[0].id,
			event: Event.pubEnteredStage,
			communityId: community.id,
			stack: [],
			actionInstanceArgs: null,
			automationId: null,
		});

		expect(result).toMatchObject({
			success: true,
			report: "Logged out some data, check your console.",
			data: {},
		});

		const actionRuns = await getTrx()
			.selectFrom("action_runs")
			.where("pubId", "=", pubs[0].id)
			.where("actionInstanceId", "=", logActionInstance.id)
			.selectAll()
			.execute();

		expect(actionRuns).toHaveLength(1);

		expect(actionRuns[0].status).toEqual(ActionRunStatus.success);
		expect(actionRuns[0].result, "Action run should be successfully created").toMatchObject({
			success: true,
			report: "Logged out some data, check your console.",
			data: {},
		});
	}, 10_000);

	it.skip("should properly blame the action run if an action modifies a pub", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { pubs, actions, community, pubFields } = await seedCommunity(
			await pubTriggerTestSeed(),
			{
				randomSlug: false,
			}
		);
		const { runActionInstance } = await import("~/actions/_lib/runActionInstance");

		const googleDriveImportActionInstance = actions.find(
			(a) => a.action === Action.googleDriveImport
		)!;

		const fakeDocURL = "https://docs.google.com/document/d/1234567890";
		const result = await runActionInstance({
			automationId: null,
			actionInstanceId: googleDriveImportActionInstance.id,
			pubId: pubs[0].id,
			event: Event.pubEnteredStage,
			actionInstanceArgs: {
				outputField: `${community.slug}:title`,
				docUrl: fakeDocURL,
			},
			communityId: community.id,
			stack: [],
		});

		expect(result).toEqual({
			success: true,
			report: "Successfully imported",
			data: {},
		});

		const actionRun = await trx
			.selectFrom("action_runs")
			.where("pubId", "=", pubs[0].id)
			.where("actionInstanceId", "=", googleDriveImportActionInstance.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(actionRun?.result).toEqual({
			success: true,
			report: "Successfully imported",
			data: {},
		});

		const pubValuesAfterUpdate = await trx
			.selectFrom("pub_values")
			.where("pubId", "=", pubs[0].id)
			.selectAll()
			.execute();

		expect(pubValuesAfterUpdate).toHaveLength(2);
		const titleValue = pubValuesAfterUpdate.find((v) => v.fieldId === pubFields.Title.id);

		expect(titleValue?.value).toEqual(fakeDocURL);

		const pubValuesHistory = await trx
			.selectFrom("pub_values_history")
			.where("actionRunId", "=", actionRun.id)
			.selectAll()
			.execute();

		expect(pubValuesHistory).toHaveLength(1);
		expect(pubValuesHistory[0].newRowData?.value).toEqual(fakeDocURL);
	});
});
