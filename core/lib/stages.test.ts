import { describe, expect, test } from "vitest";

import type { CommunitiesId, StagesId } from "db/public";

import { getOrderedStages } from "./stages";

const date = new Date();
const biconnectedStages = [
	{
		moveConstraints: [
			{
				id: "88da690f-60c2-4c26-96eb-471539376625" as StagesId,
				name: "circular stage B",
			},
		],
		moveConstraintSources: [
			{
				id: "88da690f-60c2-4c26-96eb-471539376625" as StagesId,
				name: "circular stage B",
			},
			{
				id: "247b1ecc-7808-4eb5-90ba-134cfcfbbd3e" as StagesId,
				name: "circular stage C",
			},
		],
		pubsCount: 0,
		memberCount: 0,
		actionInstancesCount: 0,
		id: "9d50ab3a-30f4-4317-9e77-27b63daf5ea2" as StagesId,
		createdAt: date,
		updatedAt: date,
		name: "circular stage A",
		order: "aa",
		communityId: "5419787f-4958-4a47-8519-eefc85613177" as CommunitiesId,
	},
	{
		moveConstraints: [
			{
				id: "9d50ab3a-30f4-4317-9e77-27b63daf5ea2" as StagesId,
				name: "circular stage A",
			},
			{
				id: "247b1ecc-7808-4eb5-90ba-134cfcfbbd3e" as StagesId,
				name: "circular stage C",
			},
		],
		moveConstraintSources: [
			{
				id: "9d50ab3a-30f4-4317-9e77-27b63daf5ea2" as StagesId,
				name: "circular stage A",
			},
		],
		pubsCount: 0,
		memberCount: 0,
		actionInstancesCount: 0,
		id: "88da690f-60c2-4c26-96eb-471539376625" as StagesId,
		createdAt: date,
		updatedAt: date,
		name: "circular stage B",
		order: "aa",
		communityId: "5419787f-4958-4a47-8519-eefc85613177" as CommunitiesId,
	},
	{
		moveConstraints: [
			{
				id: "9d50ab3a-30f4-4317-9e77-27b63daf5ea2" as StagesId,
				name: "circular stage A",
			},
		],
		moveConstraintSources: [
			{
				id: "88da690f-60c2-4c26-96eb-471539376625" as StagesId,
				name: "circular stage B",
			},
		],
		pubsCount: 0,
		memberCount: 0,
		actionInstancesCount: 0,
		id: "247b1ecc-7808-4eb5-90ba-134cfcfbbd3e" as StagesId,
		createdAt: date,
		updatedAt: date,
		name: "circular stage C",
		order: "aa",
		communityId: "5419787f-4958-4a47-8519-eefc85613177" as CommunitiesId,
	},
];

const stages = [
	{
		moveConstraints: [
			{
				id: "c5d4e451-10c8-42f5-96ce-32a436f39cf0" as StagesId,
				name: "Published",
			},
		],
		moveConstraintSources: [
			{
				id: "0d06b908-c1fd-45ce-aa5f-9838cba37331" as StagesId,
				name: "Submitted",
			},
		],
		pubsCount: 0,
		memberCount: 0,
		actionInstancesCount: 0,
		id: "19e075dd-fa39-4b14-87f0-894a354c530b" as StagesId,
		createdAt: date,
		updatedAt: date,
		name: "Review",
		order: "aa",
		communityId: "5419787f-4958-4a47-8519-eefc85613177" as CommunitiesId,
	},
	{
		moveConstraints: [
			{
				id: "c4cdab92-7eed-4f6e-9c70-fcac1ca32be0" as StagesId,
				name: "In Production",
			},
		],
		moveConstraintSources: [],
		pubsCount: 0,
		memberCount: 0,
		actionInstancesCount: 0,
		id: "437c2458-940f-4923-b415-60d2033b1044" as StagesId,
		createdAt: date,
		updatedAt: date,
		name: "Extra root",
		order: "aa",
		communityId: "5419787f-4958-4a47-8519-eefc85613177" as CommunitiesId,
	},
	{
		moveConstraints: [
			{
				id: "c4cdab92-7eed-4f6e-9c70-fcac1ca32be0" as StagesId,
				name: "In Production",
			},
			{
				id: "19e075dd-fa39-4b14-87f0-894a354c530b" as StagesId,
				name: "Review",
			},
		],
		moveConstraintSources: [],
		pubsCount: 0,
		memberCount: 0,
		actionInstancesCount: 0,
		id: "0d06b908-c1fd-45ce-aa5f-9838cba37331" as StagesId,
		createdAt: date,
		updatedAt: date,
		name: "Submitted",
		order: "aa",
		communityId: "5419787f-4958-4a47-8519-eefc85613177" as CommunitiesId,
	},
	{
		moveConstraints: [
			{
				id: "c5d4e451-10c8-42f5-96ce-32a436f39cf0" as StagesId,
				name: "Published",
			},
		],
		moveConstraintSources: [
			{
				id: "0d06b908-c1fd-45ce-aa5f-9838cba37331" as StagesId,
				name: "Submitted",
			},
			{
				id: "437c2458-940f-4923-b415-60d2033b1044" as StagesId,
				name: "Extra root",
			},
		],
		pubsCount: 0,
		memberCount: 0,
		actionInstancesCount: 0,
		id: "c4cdab92-7eed-4f6e-9c70-fcac1ca32be0" as StagesId,
		createdAt: date,
		updatedAt: date,
		name: "In Production",
		order: "ff",
		communityId: "5419787f-4958-4a47-8519-eefc85613177" as CommunitiesId,
	},
	{
		moveConstraints: [],
		moveConstraintSources: [
			{
				id: "c4cdab92-7eed-4f6e-9c70-fcac1ca32be0" as StagesId,
				name: "In Production",
			},
			{
				id: "19e075dd-fa39-4b14-87f0-894a354c530b" as StagesId,
				name: "Review",
			},
		],
		pubsCount: 0,
		memberCount: 0,
		actionInstancesCount: 0,
		id: "c5d4e451-10c8-42f5-96ce-32a436f39cf0" as StagesId,
		createdAt: date,
		updatedAt: date,
		name: "Published",
		order: "gg",
		communityId: "5419787f-4958-4a47-8519-eefc85613177" as CommunitiesId,
	},
];

describe("stage sorting", () => {
	test("it includes stages from biconnected graphs (even though they can't be sorted)", () => {
		const sorted = getOrderedStages(biconnectedStages);
		expect(sorted.length).toBe(3);
	});

	test("it renders the last stage last", () => {
		const sorted = getOrderedStages(stages);
		expect(sorted[sorted.length - 1].name).toBe("Published");
	});

	test("it doesn't duplicate stages when there are multiple roots", () => {
		const sorted = getOrderedStages(stages);
		expect(sorted.length).toEqual(new Set(sorted.map((stage) => stage.name)).size);
	});
	test("it doesn't crash or duplicate stages when a graph includes a cycle", () => {
		const biconnected = structuredClone(biconnectedStages);
		const stagesWithCycle = [...structuredClone(stages), ...biconnected];
		stagesWithCycle[0].moveConstraints.push({
			id: biconnected[0].id,
			name: biconnected[0].name,
		});
		const sorted = getOrderedStages(stagesWithCycle);
		expect(sorted.length).toEqual(new Set(sorted.map((stage) => stage.name)).size);
	});
});
