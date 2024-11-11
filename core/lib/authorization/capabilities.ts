import type { PubsId, StagesId, UsersId } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";

import { db } from "~/kysely/database";

type Target =
	| {
			type: MembershipType.pub;
			pubId: PubsId;
	  }
	| {
			type: MembershipType.stage;
			stageId: StagesId;
	  };

export const userCan = async (capability: Capabilities, target: Target, userId: UsersId) => {
	if (target.type === MembershipType.pub) {
		const result = await db
			.with("stage", (db) =>
				db
					.selectFrom("PubsInStages")
					.where("PubsInStages.pubId", "=", target.pubId)
					.select("PubsInStages.stageId")
			)
			.with("stage_ms", (db) =>
				db
					.selectFrom("stage_memberships")
					.where("stage_memberships.userId", "=", userId)
					.where((eb) =>
						eb(
							"stage_memberships.stageId",
							// We use "in" because the db structure allows a pub to be in more than
							// one stage. But we don't actually expect there to be multiple stageIds
							// returned (for now)
							"in",
							eb.selectFrom("stage").select("stageId")
						)
					)
			)
			.with("pub_ms", (db) =>
				db.selectFrom("pub_memberships").where("pub_memberships.userId", "=", userId)
			)
			.with("community_ms", (db) =>
				db
					.selectFrom("community_memberships")
					.where("community_memberships.userId", "=", userId)
			)
			.selectNoFrom((eb) =>
				eb
					.exists(
						eb
							.selectFrom("membership_capabilities")
							.where((eb) =>
								eb.or([
									eb.and([
										eb(
											"membership_capabilities.role",
											"in",
											eb.selectFrom("stage_ms").select("role")
										),
										eb(
											"membership_capabilities.type",
											"=",
											MembershipType.stage
										),
									]),
									eb.and([
										eb(
											"membership_capabilities.role",
											"in",
											eb.selectFrom("pub_ms").select("role")
										),
										eb("membership_capabilities.type", "=", MembershipType.pub),
									]),
									eb.and([
										eb(
											"membership_capabilities.role",
											"in",
											eb.selectFrom("community_ms").select("role")
										),
										eb(
											"membership_capabilities.type",
											"=",
											MembershipType.community
										),
									]),
								])
							)
							.where("membership_capabilities.capability", "=", capability)
					)
					.as("hasCapability")
			)
			.executeTakeFirst();

		return Boolean(result?.hasCapability);
	}
};
