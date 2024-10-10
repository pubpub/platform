import type { Static } from "@sinclair/typebox";
import type {
	componentConfigSchemas,
	componentsBySchema,
	InputTypeForCoreSchemaType,
} from "schemas";

import { faker } from "@faker-js/faker";
import { jsonArrayFrom } from "kysely/helpers/postgres";

import type {
	Communities,
	CommunitiesId,
	FormAccessType,
	FormsId,
	NewMembers,
	PubTypes,
	Stages,
	StructuralFormElement,
	Users,
} from "db/public";
import {
	Action as ActionName,
	CoreSchemaType,
	ElementType,
	InputComponent,
	MemberRole,
} from "db/public";
import { logger } from "logger";

import type { PubFieldsInitializer } from "./utils";
import type { actions } from "~/actions/api";
import { createPubRecursive } from "~/app/components/pubs/PubEditor/actions";
import { db } from "~/kysely/database";
import { createPasswordHash } from "~/lib/auth/password";
import { createPubRecursiveNew } from "~/lib/server";
import { slugifyString } from "~/lib/string";
import { createPubFields } from "./utils";

export const arcadiaId = "758ba348-92c7-46ec-9612-7afda81e2d79" as CommunitiesId;

type PubTypeInitializer<PF extends PubFieldsInitializer> = Record<
	string,
	Partial<Record<keyof PF, true>>
>;

/**
 * Map of slug to other stuff.
 * If left empty, it will be filled out by `faker`,
 * except the `role`, which will be set to `MemberRole.editor` by default.
 * Set to `null` if you don't want to add the user as a member
 */
type UsersInitializer = Record<
	string,
	{
		id?: string;
		email?: string;
		/** Plain string, will be hashed */
		password?: string;
		firstName?: string;
		lastName?: string;
		avatar?: string;
		role?: MemberRole | null;
	}
>;

type ActionInstanceInitializer = {
	[K in ActionName]: {
		action: K;
		name?: string;
		config: (typeof actions)[K]["config"]["schema"]["_input"];
	};
}[keyof typeof actions];

/**
 * Map of stagename to list of permissions
 */
type StagesInitializer<U extends UsersInitializer> = Record<
	string,
	{
		members?: (keyof U)[];
		actions?: ActionInstanceInitializer[];
	}
>;

type StageConnectionsInitializer<S extends StagesInitializer<any>> = Partial<
	Record<
		keyof S,
		{
			to?: (keyof S)[];
			from?: (keyof S)[];
		}
	>
>;

type PubInitializer<
	PF extends PubFieldsInitializer,
	PT extends PubTypeInitializer<PF>,
	U extends UsersInitializer,
	S extends StagesInitializer<U>,
	K extends keyof PT = keyof PT,
> = K extends K
	? {
			id?: string;
			assignee?: keyof U;
			pubType: K;
			values: {
				[KK in keyof PT[K] as KK extends keyof PF
					? PF[KK] extends CoreSchemaType
						? KK
						: never
					: never]: KK extends keyof PF
					? PF[KK] extends CoreSchemaType
						? InputTypeForCoreSchemaType<PF[KK]>
						: never
					: never;
			};
			stage?: keyof S;
			members?: (keyof U)[];
			children?: PubInitializer<PF, PT, U, S>[];
		}
	: never;

type FormElementInitializer<
	PF extends PubFieldsInitializer,
	PT extends PubTypeInitializer<PF>,
	PubType extends keyof PT,
> = PT[PubType] extends infer PubFieldsForPubType
	? {
			[FieldName in keyof PubFieldsForPubType]: FieldName extends keyof PF
				? (typeof componentsBySchema)[PF[FieldName]][number] extends infer Component extends
						InputComponent
					? {
							type: ElementType.pubfield;
							field: FieldName;
							component: Component;
							content?: never;
							element?: never;
							config: Static<(typeof componentConfigSchemas)[Component]>;
						}
					: never
				: never;
		}[keyof PubFieldsForPubType]
	: never;

type FormInitializer<
	PF extends PubFieldsInitializer,
	PT extends PubTypeInitializer<PF>,
	U extends UsersInitializer,
	SI extends StagesInitializer<U>,
> = {
	[FormTitle in string]: {
		[PubType in keyof PT]: {
			/**
			 * @default randomUUID
			 */
			id?: FormsId;
			access?: FormAccessType;
			/**
			 * @default false
			 */
			isArchived?: boolean;
			slug?: string;
			pubType: PubType;
			members?: (keyof U)[];
			elements: (
				| FormElementInitializer<PF, PT, PubType>
				| {
						type: ElementType.structural;
						element: StructuralFormElement;
						content: string;
						component?: never;
						label?: never;
						config?: never;
				  }
				| {
						type: ElementType.button;
						element?: never;
						component?: never;

						label: string;
						content: string;
						stage: keyof SI;
						config?: never;
				  }
			)[];
		};
	}[keyof PT];
};
type CreatePubRecursiveInput = Parameters<typeof createPubRecursive>[0];

const makePubInitializerMatchCreatePubRecursiveInput = <
	// PFI extends PubFieldsInitializer,
	// PTI extends PubTypeInitializer<PFI>,
	// UI extends UsersInitializer,
	// SI extends StagesInitializer<UI>,
	PI extends PubInitializer<any, any, any, any>,
>({
	//	pubFields
	pubTypes,
	users,
	stages,
	pub,
	community,
	trx,
}: {
	//	pubFields: PubFields[];
	pubTypes: PubTypes[];
	users: Users[];
	stages: Stages[];
	pub: PI;
	community: Communities;
	trx?: typeof db;
}): CreatePubRecursiveInput => {
	const pubType = pubTypes.find((pubType) => pubType.name === pub.pubType);
	if (!pubType) {
		throw new Error(
			`Pub type ${pub.pubType as string} not found in the output of the created pub types.`
		);
	}
	const assigneeId = users.find((user) => user.slug === pub.assignee)?.id;
	if (pub.assignee && !assigneeId) {
		throw new Error(
			`Assignee ${pub.assignee as string} not found in the output of the created users.`
		);
	}

	const stageId = stages.find((stage) => stage.name === pub.stage)?.id;

	if (pub.stage && !stageId) {
		throw new Error(
			`Stage ${pub.stage as string} not found in the output of the created stages.`
		);
	}

	const values = Object.fromEntries(
		Object.entries(pub.values).map(([valueTitle, info]) => [
			`${community.slug}:${slugifyString(valueTitle)}`,
			info,
		])
	);

	const input = {
		communityId: community.id,
		trx,
		body: {
			id: pub?.id,
			pubTypeId: pubType.id,
			assigneeId: assigneeId,
			stageId: stageId,
			values,
			children: pub.children?.map(
				(pub) =>
					makePubInitializerMatchCreatePubRecursiveInput({
						pubTypes,
						users,
						stages,
						community,
						pub,
						trx,
					}).body
			),
		},
	} satisfies CreatePubRecursiveInput;

	return input;
};

export const seedCommunity = async <
	const PF extends PubFieldsInitializer,
	const PT extends PubTypeInitializer<PF>,
	const U extends UsersInitializer,
	const S extends StagesInitializer<U>,
	const SC extends StageConnectionsInitializer<S>,
	const PI extends PubInitializer<PF, PT, U, S>[],
	const F extends FormInitializer<PF, PT, U, S>,
>(
	props: {
		community: {
			id?: CommunitiesId;
			name: string;
			slug: string;
			avatar?: string;
		};
		pubFields: PF;
		pubTypes: PT;
		users: U;
		stages: S;
		stageConnections: SC;
		pubs: PI;
		forms: F;
	},
	trx = db
) => {
	const { community } = props;
	logger.info(`Starting seed for ${community.name}`);

	const createdCommunity = await trx
		.insertInto("communities")
		.values(community)
		.returningAll()
		.executeTakeFirstOrThrow();
	logger.info(`Successfully created community ${community.name}`);

	const { id: communityId, slug: communitySlug } = createdCommunity;

	const createdPubFields = await createPubFields({
		pubFields: props.pubFields,
		communityId,
		communitySlug,
	});

	const createdPubTypes = await trx
		.insertInto("pub_types")
		.values(
			Object.entries(props.pubTypes).map(([pubTypeName, fields]) => ({
				name: pubTypeName,
				communityId: communityId,
			}))
		)
		.returningAll()
		.execute();

	const thing = Object.entries(props.pubTypes).flatMap(([pubTypeName, fields], idx) =>
		Object.keys(fields).flatMap((field) => {
			const fieldId = createdPubFields.find(
				(createdField) => createdField.name === field
			)?.id;
			const pubTypeId = createdPubTypes.find((pubType) => pubType.name === pubTypeName)?.id;
			if (!pubTypeId || !fieldId) {
				return [];
			}

			return [
				{
					A: fieldId,
					B: pubTypeId,
				},
			];
		})
	);

	// console.log(thing, props.pubTypes);
	const createdPubFieldToPubTypes = await trx
		.insertInto("_PubFieldToPubType")
		.values(
			Object.entries(props.pubTypes).flatMap(([pubTypeName, fields], idx) =>
				Object.keys(fields).flatMap((field) => {
					const fieldId = createdPubFields.find(
						(createdField) => createdField.name === field
					)?.id;
					const pubTypeId = createdPubTypes.find(
						(pubType) => pubType.name === pubTypeName
					)?.id;
					if (!pubTypeId || !fieldId) {
						return [];
					}

					return [
						{
							A: fieldId,
							B: pubTypeId,
						},
					];
				})
			)
		)
		.returningAll()
		.execute();

	const userValues = await Promise.all(
		Object.entries(props.users).map(async ([slug, userInfo]) => ({
			slug,
			email: userInfo?.email ?? faker.internet.email(),
			firstName: userInfo?.firstName ?? faker.person.firstName(),
			lastName: userInfo?.lastName ?? faker.person.lastName(),
			avatar: userInfo?.avatar ?? faker.image.avatar(),
			passwordHash: await createPasswordHash(userInfo?.password ?? faker.internet.password()),
		}))
	);

	const createdUsers = await trx.insertInto("users").values(userValues).returningAll().execute();

	const possibleMembers = Object.entries(props.users)
		.filter(([slug, userInfo]) => !!userInfo.role)
		.flatMap(([slug, userWithRole]) => {
			const createdUser = createdUsers.find((createdUser) => createdUser.slug === slug);
			if (!createdUser) {
				return [];
			}

			return [
				{
					userId: createdUser.id,
					communityId,
					role: userWithRole.role!,
				} satisfies NewMembers,
			];
		});

	const createdMembers = possibleMembers?.length
		? await trx.insertInto("members").values(possibleMembers).returningAll().execute()
		: [];

	const usersWithMemberShips = createdUsers.map((user) => ({
		...user,
		membersShips: createdMembers.filter((member) => member.userId === user.id),
	}));

	// // const memberGroup = await db
	// // 	.with("new_member_group", (db) =>
	// // 		db
	// // 			.insertInto("member_groups")
	// // 			.values({
	// // 				role: MemberRole.editor,
	// // 				communityId: communityUUID,
	// // 			})
	// // 			.returning("id")
	// // 	)
	// // 	.insertInto("_MemberGroupToUser")
	// // 	.values((eb) => ({
	// // 		A: eb.selectFrom("new_member_group").select("id"),
	// // 		B: users[1].id,
	// // 	}))
	// // 	.returning("A")
	// // 	.executeTakeFirst();

	const stageList = Object.entries(props.stages);
	const createdStages = await trx
		.insertInto("stages")
		.values(
			stageList.map(([stageName, stageInfo], idx) => ({
				communityId,
				name: stageName,
				order: `${(idx + 10).toString(36)}${(idx + 10).toString(36)}`,
			}))
		)
		.returningAll()
		.execute();

	const consolidatedStages = createdStages.map((stage, idx) => ({
		...stageList[idx][1],
		...stage,
	}));

	const stageMembers = consolidatedStages.flatMap(
		(stage, idx) =>
			stage.members?.map((member) => ({
				stage,
				member: usersWithMemberShips.find((user) => user.slug === member)!,
			})) ?? []
	);

	const stagePermissions = await trx
		.with("new_permissions", (db) =>
			db
				.insertInto("permissions")
				.values((eb) =>
					stageMembers.map(({ member }) => ({
						memberId: member.membersShips[0].id,
					}))
				)
				.returningAll()
		)
		.insertInto("_PermissionToStage")
		.values((eb) =>
			consolidatedStages.flatMap(
				(stage) =>
					stage.members?.map((member, idx) => ({
						A: eb.selectFrom("new_permissions").select("id").limit(1).offset(idx),
						B: stage.id,
					})) ?? []
			)
		)
		.returningAll()
		.execute();

	const stageConnectionsList = Object.entries(props.stageConnections).flatMap(
		([stage, destinations]) => {
			if (!destinations) {
				return [];
			}

			const currentStageId = consolidatedStages.find(
				(consolidatedStage) => consolidatedStage.name === stage
			)?.id;

			if (!currentStageId) {
				throw new Error(
					`Something went wrong during the creation of stage connections. Stage ${stage} not found in the output of the created stages.`
				);
			}

			const { to, from } = destinations;

			const tos =
				to?.map((dest) => ({
					stageId: currentStageId,
					destinationId: consolidatedStages.find((stage) => stage.name === dest)!.id,
				})) ?? [];

			const froms =
				from?.map((dest) => ({
					stageId: consolidatedStages.find((stage) => stage.name === dest)!.id,
					destinationId: currentStageId,
				})) ?? [];

			return [...tos, ...froms];
		}
	);

	const createPubRecursiveInput = props.pubs.map((pub) =>
		makePubInitializerMatchCreatePubRecursiveInput({
			pubTypes: createdPubTypes,
			users: createdUsers,
			stages: createdStages,
			community: createdCommunity,
			pub,
			trx,
		})
	);

	const pubs = await Promise.all(createPubRecursiveInput.map(createPubRecursiveNew));

	const createdForms = await trx
		.with("form", (eb) =>
			eb
				.insertInto("forms")
				.values(
					Object.entries(props.forms).map(([formTitle, formInput]) => ({
						id: formInput.id,
						access: formInput.access,
						isArchived: formInput.isArchived,
						name: formTitle,
						slug: formInput.slug ?? slugifyString(formTitle),
						communityId: communityId,
						pubTypeId: createdPubTypes.find(
							(pubType) => pubType.name === formInput.pubType
						)!.id,
					}))
				)
				.returningAll()
		)
		.with("form_elements", (db) =>
			db
				.insertInto("form_elements")
				.values((eb) =>
					Object.entries(props.forms).flatMap(([formTitle, formInput], idx) =>
						formInput.elements.map((elementInput, elementIndex) => ({
							formId: eb
								.selectFrom("form")
								.select("form.id")
								.limit(1)
								.offset(idx)
								.where("form.name", "=", formTitle),
							type: elementInput.type,
							content: elementInput.content,
							label: elementInput.label,
							element: elementInput.element,
							component: elementInput.component,
							order: elementIndex,
							config: elementInput.config,
						}))
					)
				)
				.returningAll()
		)
		.selectFrom("form")
		.selectAll("form")
		.select((eb) =>
			jsonArrayFrom(
				eb
					.selectFrom("form_elements")
					.selectAll("form_elements")
					.whereRef("form_elements.formId", "=", "form.id")
			).as("elements")
		)
		.execute();

	const possibleActions = consolidatedStages.flatMap(
		(stage, idx) =>
			stage.actions?.map((action) => ({
				stageId: stage.id,
				action: action.action,
				name: action.name,
				config: JSON.stringify(action.config),
			})) ?? []
	);
	const createdActions = possibleActions.length
		? await trx.insertInto("action_instances").values(possibleActions).returningAll().execute()
		: [];

	return {
		community: createdCommunity,
		pubFields: createdPubFields,
		pubTypes: createdPubTypes,
		pubfieldMaps: createdPubFieldToPubTypes,
		users: createdUsers,
		members: createdMembers,
		stages: consolidatedStages,
		stagePermissions,
		stageConnections: stageConnectionsList,
		pubs: pubs,
		actions: createdActions,
		forms: createdForms,
	};
};
