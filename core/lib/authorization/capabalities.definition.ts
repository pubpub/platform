import { Capabilities, MemberRole, MembershipType } from "db/public";

/**
 * Admins always have all capabilities if editor has them, editor always have all capabilities if contributor has them
 */
type RoleTuple =
	| [MemberRole.admin, MemberRole.editor, MemberRole.contributor]
	| [MemberRole.admin, MemberRole.editor]
	| [MemberRole.admin];

// canonical definition of capability mappings
// this is the single source of truth that will be used to generate migrations and sync the database
// organized by capability -> membership type -> roles that have that capability
export const CAPABILITY_MAPPINGS = {
	// pub
	[Capabilities.viewPub]: {
		target: [MembershipType.pub],
		access: {
			[MembershipType.pub]: [MemberRole.admin, MemberRole.editor, MemberRole.contributor],
			[MembershipType.stage]: [MemberRole.admin, MemberRole.editor, MemberRole.contributor],
			[MembershipType.community]: [MemberRole.admin, MemberRole.editor],
		},
	},
	[Capabilities.deletePub]: {
		target: [MembershipType.pub],
		access: {
			[MembershipType.pub]: [MemberRole.admin, MemberRole.editor, MemberRole.contributor],
			[MembershipType.stage]: [MemberRole.admin],
			[MembershipType.community]: [MemberRole.admin, MemberRole.editor],
		},
	},
	[Capabilities.movePub]: {
		target: [MembershipType.pub],
		access: {
			[MembershipType.pub]: [MemberRole.admin, MemberRole.editor],
			[MembershipType.stage]: [MemberRole.admin, MemberRole.editor],
			[MembershipType.community]: [MemberRole.admin, MemberRole.editor],
		},
	},
	[Capabilities.createRelatedPub]: {
		target: [MembershipType.pub],
		access: {
			[MembershipType.pub]: [MemberRole.admin, MemberRole.editor],
			[MembershipType.stage]: [MemberRole.admin, MemberRole.editor, MemberRole.contributor],
			[MembershipType.community]: [MemberRole.admin, MemberRole.editor],
		},
	},
	[Capabilities.seeExtraPubValues]: {
		target: [MembershipType.pub, MembershipType.stage, MembershipType.community],
		access: {
			[MembershipType.pub]: [MemberRole.admin, MemberRole.editor],
			[MembershipType.stage]: [MemberRole.admin, MemberRole.editor],
			[MembershipType.community]: [MemberRole.admin, MemberRole.editor],
		},
	},

	// pub creation
	[Capabilities.createPubWithForm]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [
				MemberRole.admin,
				MemberRole.editor,
				MemberRole.contributor,
			],
		},
	},
	[Capabilities.createPubWithAnyForm]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin, MemberRole.editor],
		},
	},

	// pub editing
	[Capabilities.editPubWithForm]: {
		// FIXME: maybe this should have this target?
		// target: [MembershipType.pub, MembershipType.stage],
		target: [],
		access: {
			[MembershipType.pub]: [MemberRole.admin, MemberRole.editor, MemberRole.contributor],
			[MembershipType.stage]: [MemberRole.admin, MemberRole.editor, MemberRole.contributor],
			[MembershipType.community]: [MemberRole.admin, MemberRole.editor],
		},
	},
	[Capabilities.editPubWithAnyForm]: {
		// FIXME: maybe this should have this target?
		// target: [MembershipType.pub, MembershipType.stage],
		target: [],
		access: {
			[MembershipType.pub]: [MemberRole.admin, MemberRole.editor],
			[MembershipType.stage]: [MemberRole.admin, MemberRole.editor],
			[MembershipType.community]: [MemberRole.admin, MemberRole.editor],
		},
	},
	[Capabilities.editPubWithDefaultForm]: {
		// FIXME: maybe this should have this target?
		// target: [MembershipType.pub, MembershipType.stage],
		target: [],
		access: {
			[MembershipType.pub]: [MemberRole.admin, MemberRole.editor],
			[MembershipType.stage]: [MemberRole.admin, MemberRole.editor],
			[MembershipType.community]: [MemberRole.admin, MemberRole.editor],
		},
	},

	// actions
	[Capabilities.runAction]: {
		target: [MembershipType.pub],
		access: {
			[MembershipType.pub]: [MemberRole.admin],
			[MembershipType.stage]: [MemberRole.admin, MemberRole.editor],
			[MembershipType.community]: [MemberRole.admin, MemberRole.editor],
		},
	},

	// membership management
	[Capabilities.addPubMember]: {
		target: [MembershipType.stage],
		access: {
			[MembershipType.stage]: [MemberRole.admin],
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.removePubMember]: {
		target: [MembershipType.stage],
		access: {
			[MembershipType.stage]: [MemberRole.admin],
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.addStageMember]: {
		target: [MembershipType.stage],
		access: {
			[MembershipType.stage]: [MemberRole.admin],
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.removeStageMember]: {
		target: [MembershipType.stage],
		access: {
			[MembershipType.stage]: [MemberRole.admin],
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.addCommunityMember]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin, MemberRole.editor],
		},
	},
	[Capabilities.removeCommunityMember]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.addFormMember]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.removeFormMember]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},

	// stage management
	[Capabilities.viewStage]: {
		target: [MembershipType.stage],
		access: {
			[MembershipType.stage]: [MemberRole.admin, MemberRole.editor, MemberRole.contributor],
			[MembershipType.community]: [MemberRole.admin, MemberRole.editor],
		},
	},
	[Capabilities.manageStage]: {
		target: [MembershipType.stage],
		access: {
			[MembershipType.stage]: [MemberRole.admin],
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.createStage]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.deleteStage]: {
		target: [MembershipType.stage],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},

	// community management
	[Capabilities.addCommunity]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.editCommunity]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.manageMemberGroups]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},

	// pub structure management
	[Capabilities.createPubField]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.editPubField]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.archivePubField]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.createPubType]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.editPubType]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.deletePubType]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},

	// form management
	[Capabilities.createForm]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.editForm]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.archiveForm]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},

	// api management
	[Capabilities.createApiToken]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},
	[Capabilities.revokeApiToken]: {
		target: [MembershipType.community],
		access: {
			[MembershipType.community]: [MemberRole.admin],
		},
	},
} as const satisfies Record<
	Capabilities,
	{
		/**
		 * The target is the membership type that can be invoked by using `userCan`.
		 */
		target: MembershipType[];
		access: Partial<Record<MembershipType, RoleTuple>> & {
			// it's mandatory to allow community admins to have all capabilities
			[MembershipType.community]: RoleTuple;
		};
	}
>;

export type CapabilityMappings = typeof CAPABILITY_MAPPINGS;

type GetCapabilitesForMembershipType<T extends MembershipType> = {
	[K in keyof CapabilityMappings]: T extends keyof CapabilityMappings[K] ? K : never;
}[keyof CapabilityMappings];

export type PubCapabilities = GetCapabilitesForMembershipType<MembershipType.pub>;
export type StageCapabilities = GetCapabilitesForMembershipType<MembershipType.stage>;
export type CommunityCapabilities = GetCapabilitesForMembershipType<MembershipType.community>;

type GetTargetCapabilities<T extends MembershipType> = {
	[K in keyof CapabilityMappings]: T extends CapabilityMappings[K]["target"][number] ? K : never;
}[keyof CapabilityMappings];

export type PubTargetCapabilities = GetTargetCapabilities<MembershipType.pub>;
export type StageTargetCapabilities = GetTargetCapabilities<MembershipType.stage>;
export type CommunityTargetCapabilities = GetTargetCapabilities<MembershipType.community>;

export const getTargetCapabilitiesForMembershipType = <T extends MembershipType>(
	membershipType: T
): GetTargetCapabilities<T>[] => {
	const capabilities: Capabilities[] = [];

	for (const [capability, { target }] of Object.entries(CAPABILITY_MAPPINGS)) {
		if (target.length === 0 || !target.some((t) => t === membershipType)) {
			continue;
		}
		capabilities.push(capability as Capabilities);
	}

	return capabilities as GetTargetCapabilities<T>[];
};

export const pubTargetCapabilities = getTargetCapabilitiesForMembershipType(MembershipType.pub);
export const stageTargetCapabilities = getTargetCapabilitiesForMembershipType(MembershipType.stage);
export const communityTargetCapabilities = getTargetCapabilitiesForMembershipType(
	MembershipType.community
);

// convert the nested structure back to the flat array format for database operations
export const getCapabilityMappingsArray = (): Array<{
	type: MembershipType;
	role: MemberRole;
	capability: Capabilities;
}> => {
	const mappings: Array<{
		type: MembershipType;
		role: MemberRole;
		capability: Capabilities;
	}> = [];

	for (const [capability, { target, access }] of Object.entries(CAPABILITY_MAPPINGS)) {
		for (const [membershipType, roles] of Object.entries(access)) {
			for (const role of roles) {
				mappings.push({
					type: membershipType as MembershipType,
					role: role as MemberRole,
					capability: capability as Capabilities,
				});
			}
		}
	}

	return mappings;
};

// helper functions to work with the capability mappings
export const getCapabilitiesForRole = (type: MembershipType, role: MemberRole): Capabilities[] => {
	const capabilities: Capabilities[] = [];

	for (const [capability, { target, access }] of Object.entries(CAPABILITY_MAPPINGS)) {
		if (!(type in access)) {
			continue;
		}
		// silly cast necessary because typescript cannot comprehend my plans
		const roles = access[type as keyof typeof access];
		if (roles.some((r) => r === role)) {
			capabilities.push(capability as Capabilities);
		}
	}

	return capabilities;
};

export const hasCapability = (
	type: MembershipType,
	role: MemberRole,
	capability: Capabilities
): boolean => {
	const { access } = CAPABILITY_MAPPINGS[capability];
	if (!(type in access)) {
		return false;
	}
	// silly cast necessary because typescript cannot comprehend my plans
	const roles = access[type as keyof typeof access];
	return roles.some((r) => r === role);
};

// generate the sql insert statements for the capability mappings
export const generateCapabilityInserts = (): string => {
	const mappings = getCapabilityMappingsArray();
	const values = mappings
		.map(
			(mapping) =>
				`    ('${mapping.type}'::"MembershipType", '${mapping.role}'::"MemberRole", '${mapping.capability}'::"Capabilities")`
		)
		.join(",\n");

	return `TRUNCATE TABLE "membership_capabilities";

INSERT INTO "membership_capabilities" (type, role, capability)
VALUES
${values}
;`;
};
