import { describe, expect, it } from "vitest";

import { Capabilities, MemberRole, MembershipType } from "db/public";

import { mockServerCode } from "~/lib/__tests__/utils";
import {
	generateCapabilityInserts,
	getCapabilitiesForRole,
	getCapabilityMappingsArray,
	getTargetCapabilitiesForMembershipType,
	hasCapability,
} from "./capabalities.definition";
import { syncCapabilitiesToDatabase, validateCapabilitiesInSync } from "./sync-capabilities";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

describe("capability mappings definition", () => {
	it("should not have duplicate mappings", () => {
		const mappings = getCapabilityMappingsArray();
		const seen = new Set();
		for (const mapping of mappings) {
			const key = `${mapping.type}:${mapping.role}:${mapping.capability}`;
			if (seen.has(key)) {
				throw new Error(`duplicate mapping found: ${key}`);
			}
			seen.add(key);
		}
	});

	it("should generate valid sql inserts", () => {
		const sql = generateCapabilityInserts();

		expect(sql).toContain("TRUNCATE TABLE");
		expect(sql).toContain("INSERT INTO");
		expect(sql).toContain("membership_capabilities");
		expect(sql).toContain("MembershipType");
		expect(sql).toContain("MemberRole");
		expect(sql).toContain("Capabilities");

		// should have the right number of values
		const mappings = getCapabilityMappingsArray();
		const valueLines = sql.split("\n").filter((line) => line.trim().startsWith("("));
		expect(valueLines.length).toBe(mappings.length);
	});
});

describe("capability helper functions", () => {
	it("should get capabilities for specific role", () => {
		const adminPubCapabilities = getCapabilitiesForRole(MembershipType.pub, MemberRole.admin);

		expect(adminPubCapabilities).toContain(Capabilities.createRelatedPub);
		expect(adminPubCapabilities).toContain(Capabilities.viewPub);
		expect(adminPubCapabilities.length).toBeGreaterThan(0);

		const contributorPubCapabilities = getCapabilitiesForRole(
			MembershipType.pub,
			MemberRole.contributor
		);
		expect(contributorPubCapabilities).not.toContain(Capabilities.createRelatedPub);
		expect(contributorPubCapabilities).toContain(Capabilities.viewPub);
	});

	it("should get capabilities for specific target", () => {
		const pubCapabilities = getTargetCapabilitiesForMembershipType(MembershipType.pub);

		expect(pubCapabilities.length).toBeGreaterThan(0);
	});

	it("should check if role has specific capability", () => {
		expect(
			hasCapability(MembershipType.pub, MemberRole.admin, Capabilities.createRelatedPub)
		).toBe(true);
		expect(
			hasCapability(MembershipType.pub, MemberRole.contributor, Capabilities.createRelatedPub)
		).toBe(false);
		expect(
			hasCapability(MembershipType.pub, MemberRole.contributor, Capabilities.viewPub)
		).toBe(true);
	});
});

describe("capability sync functionality", () => {
	it("should validate and sync capabilities successfully", async () => {
		const trx = getTrx();
		// first sync the capabilities
		await syncCapabilitiesToDatabase({ trx });

		// then validate they are in sync
		const validation = await validateCapabilitiesInSync({ trx });
		expect(validation.inSync).toBe(true);
		expect(validation.differences).toBeUndefined();
	});

	it("should detect out of sync capabilities", async () => {
		const trx = getTrx();
		// sync capabilities first
		await syncCapabilitiesToDatabase({ trx });

		// manually remove a capability to create mismatch
		await trx
			.deleteFrom("membership_capabilities")
			.where("type", "=", MembershipType.pub)
			.where("role", "=", MemberRole.admin)
			.where("capability", "=", Capabilities.deletePub)
			.execute();

		const validation = await validateCapabilitiesInSync({ trx });
		expect(validation.inSync).toBe(false);
		expect(validation.differences).toBeDefined();
		expect(validation.differences).toContain(
			`missing: ${MembershipType.pub}:${MemberRole.admin}:${Capabilities.deletePub}`
		);
	}, 10000);
});
