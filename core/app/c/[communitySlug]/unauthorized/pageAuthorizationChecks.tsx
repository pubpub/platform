import { cache } from "react";
import { redirect } from "next/navigation";

import type { CommunitiesId, FormsId, PubsId, StagesId, UsersId } from "db/public";
import { Capabilities, MembershipType } from "db/public";

import type {
	CapabilitiesTargetForCapability,
	CapabilityTarget,
	CommunityTarget,
	FormTarget,
	PubTarget,
	StageTarget,
} from "~/lib/authorization/capabilities";
import {
	communityCapabilities,
	formCapabilities,
	pubCapabilities,
	stageCapabilities,
	userCan,
} from "~/lib/authorization/capabilities";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";

type PageAuthorizationCheckMap = Record<string, Capabilities | Capabilities[] | null>;

/**
 * Map of page names to capabilities.
 *
 * Capabilities can be an array, in which case they will be interpreted as "OR",
 * eg the user needs the capability `viewPub` or `viewStage` to be able to see a Pub.
 */
export const pageAuthorizationChecks = {
	allPubs: null,
	pub: Capabilities.viewPub,
	editPub: Capabilities.updatePubValues,
	createPub: Capabilities.createPub,
	allWorkflows: null,
	stage: Capabilities.viewStage,
	manageWorkflows: Capabilities.editCommunity,
	allForms: Capabilities.editCommunity,
	actionLog: Capabilities.editCommunity,
	types: Capabilities.editCommunity,
	fields: Capabilities.editCommunity,
	members: Capabilities.editCommunity,
	settings: Capabilities.editCommunity,
	apiTokens: Capabilities.editCommunity,
	docs: Capabilities.editCommunity,
	apiDocs: [Capabilities.editCommunity, Capabilities.viewPub],
} as const satisfies PageAuthorizationCheckMap;

type CapabilitiesForTargetCapabilityArray<
	C extends Capabilities[],
	R extends string[] = [],
> = C extends [...infer Rest extends Capabilities[], infer L extends Capabilities]
	? CapabilitiesForTargetCapabilityArray<
			Rest,
			[...R, IdForCapabilityTarget<CapabilitiesTargetForCapability<L>>]
		>
	: R;

type IdForCapabilityTarget<T extends CapabilityTarget> = T extends {
	type: MembershipType.pub;
	pubId: PubsId;
}
	? PubsId
	: T extends {
				type: MembershipType.stage;
				stageId: StagesId;
		  }
		? StagesId
		: T extends {
					type: MembershipType.community;
					communityId: CommunitiesId;
			  }
			? CommunitiesId
			: never;

type Targeted<C extends Capabilities | Capabilities[] | null> = C extends Capabilities
	? [IdForCapabilityTarget<CapabilitiesTargetForCapability<C>>]
	: C extends Capabilities[]
		? CapabilitiesForTargetCapabilityArray<C>
		: never[];

const isSingleCapability = (
	capability: Capabilities | Capabilities[] | null
): capability is Capabilities => {
	return capability !== null && !Array.isArray(capability);
};

const constructTargetFromCapability = <T extends Capabilities>(
	capability: T,
	targetId: string
): T extends (typeof formCapabilities)[number]
	? FormTarget
	: T extends (typeof pubCapabilities)[number]
		? PubTarget
		: T extends (typeof stageCapabilities)[number]
			? StageTarget
			: T extends (typeof communityCapabilities)[number]
				? CommunityTarget
				: never => {
	if (formCapabilities.some((c) => c === capability)) {
		const target = {
			type: MembershipType.form,
			formId: targetId as FormsId,
		} satisfies FormTarget;

		return target as any;
	} else if (pubCapabilities.some((c) => c === capability)) {
		const target = {
			type: MembershipType.pub,
			pubId: targetId as PubsId,
		} satisfies PubTarget;

		return target as any;
	} else if (stageCapabilities.some((c) => c === capability)) {
		const target = {
			type: MembershipType.stage,
			stageId: targetId as StagesId,
		} satisfies StageTarget;

		return target as any;
	} else if (communityCapabilities.some((c) => c === capability)) {
		const target = {
			type: MembershipType.community,
			communityId: targetId as CommunitiesId,
		} satisfies CommunityTarget;

		return target as any;
	}

	throw new Error(`Invalid capability, ${capability} is not a single capability`);
};

export const userCanViewPage = cache(
	async <
		T extends keyof typeof pageAuthorizationChecks,
		Capability extends
			(typeof pageAuthorizationChecks)[T] = (typeof pageAuthorizationChecks)[T],
		Target extends Targeted<Capability> = Targeted<Capability>,
	>(
		page: T,
		userId: UsersId,
		/**
		 * The ids of the targets necessary.
		 * Done in this spread out way instead of an array to make it possible to
		 * use React.cache
		 */
		...targetIds: Target
	) => {
		const communitySlug = await getCommunitySlug();

		const capability = pageAuthorizationChecks[page];

		if (capability === null) {
			return true;
		}

		if (targetIds.length === 0) {
			throw new Error(`Target is null for page ${page}`);
		}

		if (Array.isArray(capability)) {
			const results = await Promise.all(
				capability.map((cap, idx) =>
					userCan(cap, constructTargetFromCapability(cap, targetIds[idx]), userId)
				)
			);

			const result = results.some((result) => result);

			if (!result) {
				return redirect(`/c/${communitySlug}/unauthorized`);
			}

			return true;
		}

		// typescript is not smart enough to do this itself
		if (!isSingleCapability(capability)) {
			throw new Error(`Invalid capability, ${capability} is not a single capability`);
		}

		const target = constructTargetFromCapability(capability, targetIds[0]);

		const result = await userCan(capability, target, userId);

		if (!result) {
			return redirect(`/c/${communitySlug}/unauthorized`);
		}

		return result;
	}
);
