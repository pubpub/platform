import type { Static } from "@sinclair/typebox";
import type {
	componentConfigSchemas,
	componentsBySchema,
	InputTypeForCoreSchemaType,
} from "schemas";

import { faker } from "@faker-js/faker";
import { jsonArrayFrom } from "kysely/helpers/postgres";

import type { ProcessedPub } from "contracts";
import type {
	ActionInstancesId,
	ApiAccessTokensId,
	Communities,
	CommunitiesId,
	FormAccessType,
	FormElements,
	Forms,
	FormsId,
	NewCommunityMemberships,
	PubFields,
	PubsId,
	PubTypes,
	Stages,
	StagesId,
	Users,
	UsersId,
} from "db/public";
import {
	Action as ActionName,
	CoreSchemaType,
	ElementType,
	InputComponent,
	MemberRole,
	StructuralFormElement,
} from "db/public";
import { logger } from "logger";
import { expect } from "utils";

import type { actions } from "~/actions/api";
import { db } from "~/kysely/database";
import { createPasswordHash } from "~/lib/authentication/password";
import { createPubRecursiveNew } from "~/lib/server";
import { allPermissions, createApiAccessToken } from "~/lib/server/apiAccessTokens";
import { insertForm } from "~/lib/server/form";
import { slugifyString } from "~/lib/string";

export type PubFieldsInitializer = Record<
	string,
	{
		relation?: true;
		schemaName: CoreSchemaType;
	}
>;

type PubTypeInitializer<PF extends PubFieldsInitializer> = Record<
	string,
	Partial<Record<keyof PF, { isTitle: boolean }>>
>;

/**
 * If left empty, it will be filled out by `faker`,
 * except the `role`, which will be set to `MemberRole.editor` by default.
 * Set to `null` if you don't want to add the user as a member
 */
type UsersInitializer = Record<
	string,
	{
		/**
		 * @default randomUUID
		 */
		id?: UsersId;
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
		/**
		 * @default randomUUID
		 */
		id?: ActionInstancesId;
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
		id?: StagesId;
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
> = {
	[PubTypeName in keyof PT]: {
		/**
		 * @default randomUUID
		 */
		id?: PubsId;
		/**
		 * Assignee of the pub.
		 *
		 * Users are referenced by their keys in the users object.
		 */
		assignee?: keyof U;
		/**
		 * Parent of the pub.
		 *
		 * If you set `alsoAsChild` when creating a relatedPub,
		 * this will automatically set the parentId of the current pub.
		 */
		parentId?: PubsId;
		/**
		 * The name of the pubType you specified in the pubTypes object.
		 */
		pubType: PubTypeName;
		/**
		 * Values can be a simple object of `FieldName: value`
		 * Or they can directly specify a relation by setting `value` and `relatedPubId`
		 */
		values: {
			[FieldName in keyof PT[PubTypeName] as FieldName extends keyof PF
				? FieldName
				: never]?: FieldName extends keyof PF
				? PF[FieldName]["schemaName"] extends CoreSchemaType
					?
							| InputTypeForCoreSchemaType<PF[FieldName]["schemaName"]>
							| {
									value: InputTypeForCoreSchemaType<PF[FieldName]["schemaName"]>;
									/**
									 * Note: this PubId reference a pub at least one level higher than the current pub, or it must be created before this pub.
									 */
									relatedPubId: PubsId;
							  }[]
					: never
				: never;
		};
		/**
		 * The stages this pub is in.
		 */
		stage?: keyof S;
		/**
		 * The members of the pub.
		 * Users are referenced by their keys in the users object.
		 */
		members?: (keyof U)[];
		children?: PubInitializer<PF, PT, U, S>[];
		/**
		 * Relations can be specified inline
		 *
		 * @example
		 * ```ts
		 * {
		 * 	relatedPubs: {
		 * 		// relatedPubs are specified slightly differently than children
		 * 		// as they need to be mapped to a certain field
		 * 		Contributors: [{
		 * 			value: 0,
		 * 			// this will also add the same pub as a child
		 * 			alsoAsChild: true,
		 * 			pub: {
		 * 				pubType: "Author",
		 * 				values: {
		 * 					Name: "John Doe",
		 * 				}
		 * 			}
		 * 		}]
		 * 	}
		 * }
		 * ```
		 */
		relatedPubs?: {
			[FieldName in keyof PT[PubTypeName] as FieldName extends keyof PF
				? FieldName
				: never]?: FieldName extends keyof PF
				? PF[FieldName]["schemaName"] extends CoreSchemaType
					? PF[FieldName]["relation"] extends true
						? {
								/**
								 * Also add this pub as a child of the current pub.
								 * Experimental, will probably be removed in the future, currently
								 * useful because we cannot fetch related pubs in the frontend.
								 */
								alsoAsChild?: boolean;
								/**
								 * Acts as relation metadata
								 */
								value?: InputTypeForCoreSchemaType<PF[FieldName]["schemaName"]>;
								pub: PubInitializer<PF, PT, U, S>;
							}[]
						: never
					: never
				: never;
		};
	};
}[keyof PT & string];

type FormElementInitializer<
	PF extends PubFieldsInitializer,
	PT extends PubTypeInitializer<PF>,
	PubType extends keyof PT,
> = PT[PubType] extends infer PubFieldsForPubType
	? {
			[FieldName in keyof PubFieldsForPubType]: FieldName extends keyof PF
				? (typeof componentsBySchema)[PF[FieldName]["schemaName"]][number] extends infer Component extends
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
						field?: never;
				  }
				| {
						type: ElementType.button;
						element?: never;
						component?: never;
						label: string;
						content: string;
						stage: keyof SI;
						config?: never;
						field?: never;
				  }
			)[];
		};
	}[keyof PT];
};
type CreatePubRecursiveInput = Parameters<typeof createPubRecursiveNew>[0];

const makePubInitializerMatchCreatePubRecursiveInput = <
	PI extends PubInitializer<any, any, any, any>,
>({
	community,
	pubTypes,
	users,
	stages,
	pubs,
	trx,
}: {
	community: Communities;
	pubTypes: PubTypes[];
	users: Users[];
	stages: Stages[];
	pubs: PI[];
	trx?: typeof db;
}): CreatePubRecursiveInput[] => {
	const result = pubs.map((pub) => {
		const pubType = pubTypes.find((pubType) => pubType.name === pub.pubType);
		if (!pubType) {
			throw new Error(
				`Pub type ${pub.pubType as string} not found in the output of the created pub types.`
			);
		}
		const assigneeId = findBySlug(users, pub.assignee as string)?.id;
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

		const rootPubId = pub.id ?? (crypto.randomUUID() as PubsId);

		const relatedPubs = pub.relatedPubs
			? Object.fromEntries(
					Object.entries(pub.relatedPubs)
						.filter(([, info]) => !!info)
						.map(([valueTitle, info]) => [
							`${community.slug}:${slugifyString(valueTitle)}`,
							expect(
								info,
								`Got unexpected empty related pub definition for ${valueTitle}`
							).map((info) => ({
								value: info.value,
								pub: makePubInitializerMatchCreatePubRecursiveInput({
									pubTypes,
									users,
									stages,
									community,
									pubs: [
										{
											// this order means that parentId will get overridden if
											// it's actually set
											...(info.alsoAsChild ? { parentId: rootPubId } : {}),
											...info.pub,
										},
									],
									trx,
								})[0].body,
							})),
						])
				)
			: undefined;

		const input = {
			communityId: community.id,
			trx,
			body: {
				id: rootPubId,
				pubTypeId: pubType.id,
				assigneeId: assigneeId,
				stageId: stageId,
				values,
				parentId: pub.parentId,
				children:
					pub.children &&
					makePubInitializerMatchCreatePubRecursiveInput({
						pubTypes,
						users,
						stages,
						community,
						pubs: pub.children,
						trx,
					}).map((child) => child.body),

				relatedPubs: relatedPubs,
			},
			lastModifiedBy: "system",
		} satisfies CreatePubRecursiveInput;

		return input as CreatePubRecursiveInput;
	});

	return result;
};

const findBySlug = <T extends { slug: string }>(props: T[], slug: string) =>
	props.find((prop) => new RegExp(`^${slug}`).test(prop.slug));

type CommunitySeedInput = {
	id?: CommunitiesId;
	name: string;
	slug: string;
	avatar?: string;
};

// ========
// These are helper types to make the output of the seeding functions match the input more closely.
type PubFieldsByName<PF> = {
	[K in keyof PF]: PF[K] & Omit<PubFields, "name"> & { name: K } & { isTitle?: boolean };
};

type PubTypesByName<PT, PF> = {
	[K in keyof PT]: Omit<PubTypes, "name"> & { name: K } & { pubFields: PubFieldsByName<PF> };
};

type UsersBySlug<U> = {
	[K in keyof U]: U[K] & Users;
};

type StagesWithPermissionsByName<S, StagePermissions> = {
	[K in keyof S]: Omit<Stages, "name"> & { name: K } & {
		permissions: StagePermissions;
	};
};

type FormsByName<F extends FormInitializer<any, any, any, any>> = {
	[K in keyof F]: Omit<Forms, "name" | "pubType" | ""> & { name: K } & {
		elements: {
			[KK in keyof F[K]["elements"]]: F[K]["elements"][KK] & FormElements;
		};
	};
};
// ===================================

/**
 * Create a community in a typesafe way
 *
 */
export async function seedCommunity<
	const PF extends PubFieldsInitializer,
	const PT extends PubTypeInitializer<PF>,
	const U extends UsersInitializer,
	const S extends StagesInitializer<U>,
	const SC extends StageConnectionsInitializer<S>,
	const PI extends PubInitializer<PF, PT, U, S>[],
	const F extends FormInitializer<PF, PT, U, S>,
	WithApiToken extends boolean | `${string}.${string}` | undefined = undefined,
>(
	props: {
		/**
		 * The community to create
		 *
		 * If `options.randomSlug` is not `false`, the current date will be added to the end
		 * of the slug to prevent some collisions during testing.
		 *
		 * @example
		 * ```ts
		 * community: {
		 * 	name: "My Community",
		 * 	slug: "my-community",
		 * }
		 * ```
		 */
		community: CommunitySeedInput;
		/**
		 * The pub fields of the community
		 *
		 * The keys of the object are the names of the pub fields.
		 * They are slugified and prefixed with the community slug automatically.
		 *
		 * @example
		 * ```ts
		 * {
		 * 		pubFields: {
		 * 			Name: { schemaName: CoreSchemaType.String },
		 * 		// Specify a relation by setting `relation` to `true`
		 * 		// The schema name will then be the schema of the relation metadata
		 * 			Contributors: { schemaName: CoreSchemaType.StringArray, relation: true },
		 * 	}
		 * }
		 * ```
		 */
		pubFields?: PF;
		/**
		 * The pub types of the community
		 * Cannot be specified without `pubFields`
		 *
		 * @example
		 * ```ts
		 * {
		 * 	pubFields: {
		 * 		Title: { schemaName: CoreSchemaType.String },
		 * 	},
		 * 	pubTypes: {
		 * 		Article: {
		 * 			Title: { isTitle: true },
		 * 		}
		 * }
		 * ```
		 */
		pubTypes?: PT;
		/**
		 * An object where the keys are the slugs of the users and the values are the user objects.
		 *
		 * Will also automatically create members for these users if `role` is specified
		 * Non-filled out fields will be auto-generated.
		 *
		 * If `options.randomSlug` is not `false`, the current date will be added to the end
		 * of the slug to prevent some collisions during testing.
		 *
		 * Example
		 *
		 * ```ts
		 * {
		 * 	users: {
		 * 		john: {
		 * 			firstName: "John",
		 * 			role: MemberRole.Admin,
		 * 			password: "john-password",
		 * 			email: "john@example.com",
		 * 		}
		 * 	}
		 * }
		 * ```
		 * This will output
		 * ```ts
		 * {
		 * 	john: {
		 * 		slug: "john",
		 * 		firstName: "John",
		 * 		lastName: "Some random lastName",
		 * 		avatar: "https://example.com/avatar.png",
		 * 		passwordHash: "hashed-password",
		 * 		email: "john@example.com",
		 * 		member: {
		 * 			id: "123",
		 * 			role: MemberRole.Admin,
		 * 		}
		 * 	}
		 * ```
		 */
		users?: U;
		/**
		 * The stages of the community.
		 * You need to have defined users to be able to create stages.
		 *
		 *
		 * You can specify both members and actions for stages.
		 * The options for members are the keys of the users object.
		 *
		 * You can reference e.g. ids like so
		 *
		 * @example
		 * ```ts
		 * const testUserId = crypto.randomUUID() as UsersId;
		 * {
		 * 	users: {
		 * 		john: {
		 * 			id: testUserId,
		 * 		}
		 * 	},
		 * 	stages: {
		 * 		Idea: {
		 * 			members: ["john"],
		 * 			actions: [
		 * 				{
		 * 					action: Action.email,
		 * 					config: {
		 * 						body: "hello world",
		 * 						subject: "hello",
		 * 						recipient: testUserId,
		 * 					},
		 * 				},
		 * 			],
		 * 		}
		 * 	}
		 * }
		 */
		stages?: S;
		/**
		 * The stage connections of the community.
		 *
		 * ```ts
		 * {
		 * 	stages: {
		 * 		Submitted: {},
		 * 		Review: {},
		 * 	},
		 * 	stageConnections: {
		 * 		Submitted: {
		 * 			to: ["Review"],
		 * 		}
		 * 	}
		 * }
		 */
		stageConnections?: SC;
		/**
		 * The pubs of the community.
		 * One of the few configuration options that is an array instead of an object,
		 * because Pubs do not have a name or a slug which could act as keys.
		 * 
		 * All Pubs are created sequentially, so if you give earlier pubs a specific ID, you
		 * can reference them later

		 * Example
		 * ```ts
		 * 	const authorId= crypto.randomUUID() as PubsId;
		 * {
		 * 	pubs: [
		 * 		{
		 * 			id: authorId,
		 * 			pubType: "Author",
		 * 			values: {
		 * 				Name: "John Doe",
		 * 			}
		 * 		},
		 * 		{
		 * 			id: articlePubId,
		 * 			pubType: "Article",
		 * 			values: {
		 * 				Title: "A Great Article",
		 * 				// relations can be specified directly by Id as a value
		 * 				// the referenced pub needs to be created beforehand
		 * 				Contributors: {
		 * 					value: "Editing",
		 * 					relatedPubId: authorId,
		 * 				}
		 * 			},
		 * 			// children are defined the same way as pubs
		 * 			children: [
		 * 				{
		 * 					pubType: "Author",
		 * 					values: {
		 * 						Name: "John Doe",
		 * 					}
		 * 				}
		 * 			],
		 * 			// or relations can be specified by a nested pub
		 * 			relatedPubs: {
		 * 				// relatedPubs are specified slightly differently than children
		 * 				// as they need to be mapped to a certain field
		 * 				Contributors: [{
		 * 					value: "Draft preparation",
		 * 					// this will also add the same pub as a child
		 * 					alsoAsChild: true,
		 * 					pub: {
		 * 						pubType: "Author",
		 * 						values: {
		 * 							Name: "John Doe",
		 * 						}
		 * 					}
		 * 				}]
		 * 			}
		 * 		},
		 * 	]
		 * }
		 * ```
		 */
		pubs?: PI;
		forms?: F;
	},
	options?: {
		/**
		 * Whether or not to create an API token for the community.
		 * If a string is provided, it will be used as the id part of the token.
		 * @default false
		 */
		withApiToken?: WithApiToken;
		/**
		 * Whether or not to add a random number to the end of slugs, helps prevent errors during testing.
		 * @default true
		 */
		randomSlug?: boolean;
		/**
		 * Whether or not to create pubs in parallel.
		 * It's set to `false` by default as it allows you to reference related pubs, so only use this if you aren't creating interlinked references between pubs.
		 *
		 * @default false
		 */
		parallelPubs?: boolean;
	},
	trx = db
) {
	const { community } = props;

	logger.info(`Starting seed for ${community.name}`);

	const createdCommunity = await trx
		.insertInto("communities")
		.values({
			...community,
			slug:
				options?.randomSlug === false
					? community.slug
					: `${community.slug}-${new Date().toISOString()}`,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const { id: communityId, slug: communitySlug } = createdCommunity;

	const pubFieldsList = Object.entries(props.pubFields ?? {});

	const createdPubFields = pubFieldsList.length
		? await trx
				.insertInto("pub_fields")
				.values(
					pubFieldsList.map(([name, info]) => {
						const slug = slugifyString(name);
						return {
							name: name,
							slug: `${communitySlug}:${slug}`,
							communityId: communityId,
							schemaName: info.schemaName,
							isRelation: info.relation,
						};
					})
				)
				.returning(["id", "slug", "name", "schemaName", "isRelation"])
				.execute()
		: [];

	const pubFieldsByName = Object.fromEntries(
		createdPubFields.map((pubField) => [
			pubFieldsList.find(([name]) => name === pubField.name)?.[0],
			pubField,
		])
	) as PubFieldsByName<PF>;

	const pubTypesList = Object.entries(props.pubTypes ?? {});
	const createdPubTypes = pubTypesList.length
		? await trx
				.insertInto("pub_types")
				.values(
					pubTypesList.map(([pubTypeName, fields]) => ({
						name: pubTypeName,
						communityId: communityId,
					}))
				)
				.returningAll()
				.execute()
		: [];

	const createdPubFieldToPubTypes =
		pubTypesList.length && pubFieldsList.length
			? await trx
					.insertInto("_PubFieldToPubType")
					.values(
						pubTypesList.flatMap(([pubTypeName, fields], idx) =>
							Object.entries(fields).flatMap(([field, meta]) => {
								const isTitle = meta?.isTitle ?? false;
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
										isTitle,
									},
								];
							})
						)
					)
					.returningAll()
					.execute()
			: [];

	await Promise.all(
		createdPubTypes.map((type) =>
			insertForm(
				type.id,
				`${type.name} Editor (Default)`,
				`${slugifyString(type.name)}-default-editor`,
				communityId,
				true,
				trx
			).execute()
		)
	);

	const pubTypesWithPubFieldsByName = Object.fromEntries(
		createdPubTypes.map((pubType) => [
			pubType.name,
			{
				...pubType,
				pubFields: Object.fromEntries(
					createdPubFieldToPubTypes
						.filter((pubFieldToPubType) => pubFieldToPubType.B === pubType.id)
						.map((pubFieldToPubType) => {
							const pubField = createdPubFields.find(
								(pubField) => pubField.id === pubFieldToPubType.A
							)!;

							return [
								pubField.name,
								{ ...pubField, isTitle: pubFieldToPubType.isTitle },
							] as const;
						})
				),
			},
		])
	) as PubTypesByName<PT, PF>;

	const userValues = await Promise.all(
		Object.entries(props.users ?? {}).map(async ([slug, userInfo]) => ({
			slug: options?.randomSlug === false ? slug : `${slug}-${new Date().toISOString()}`,
			email: userInfo?.email ?? faker.internet.email(),
			firstName: userInfo?.firstName ?? faker.person.firstName(),
			lastName: userInfo?.lastName ?? faker.person.lastName(),
			avatar: userInfo?.avatar ?? faker.image.avatar(),
			passwordHash: await createPasswordHash(userInfo?.password ?? faker.internet.password()),
		}))
	);

	const createdUsers = userValues.length
		? await trx.insertInto("users").values(userValues).returningAll().execute()
		: [];

	const usersBySlug = Object.fromEntries(
		createdUsers.map((user) => [
			user.slug.replace(new RegExp(`-${new Date().getUTCFullYear()}.*`), ""),
			user,
		])
	) as UsersBySlug<U>;

	const possibleMembers = Object.entries(props.users ?? {})
		.filter(([slug, userInfo]) => !!userInfo.role)
		.flatMap(([slug, userWithRole]) => {
			// const createdUser = createdUsers.find((createdUser) => createdUser.slug === slug);
			const createdUser = findBySlug(createdUsers, slug);
			if (!createdUser) {
				return [];
			}

			return [
				{
					userId: createdUser.id,
					communityId,
					role: userWithRole.role!,
				} satisfies NewCommunityMemberships,
			];
		});

	const createdMembers = possibleMembers?.length
		? await trx
				.insertInto("community_memberships")
				.values(possibleMembers)
				.returningAll()
				.execute()
		: [];

	const usersWithMemberShips = createdUsers.map((user) => ({
		...user,
		member: createdMembers.find((member) => member.userId === user.id),
	}));

	const stageList = Object.entries(props.stages ?? {});

	const createdStages = stageList.length
		? await trx
				.insertInto("stages")
				.values(
					stageList.map(([stageName, stageInfo], idx) => ({
						id: stageInfo.id,
						communityId,
						name: stageName,
						order: `${(idx + 10).toString(36)}${(idx + 10).toString(36)}`,
					}))
				)
				.returningAll()
				.execute()
		: [];

	const consolidatedStages = createdStages.map((stage, idx) => ({
		...stageList[idx][1],
		...stage,
	}));

	const stageMembers = consolidatedStages
		.flatMap(
			(stage, idx) =>
				stage.members?.map((member) => ({
					stage,
					user: findBySlug(usersWithMemberShips, member as string)!,
				})) ?? []
		)
		.filter((stageMember) => stageMember.user.member != undefined);

	const stageMemberships =
		stageMembers.length > 0
			? await trx
					.insertInto("stage_memberships")
					.values((eb) =>
						stageMembers.map((stageMember) => ({
							role: stageMember.user.member?.role ?? MemberRole.editor,
							stageId: stageMember.stage.id,
							userId: stageMember.user.id,
						}))
					)
					.returningAll()
					.execute()
			: [];

	const stagesWithPermissionsByName = Object.fromEntries(
		consolidatedStages.map((stage) => [
			stage.name,
			{
				...stage,
				permissions: stageMemberships.filter(
					(permission) => permission.stageId === stage.id
				),
			},
		])
	) as StagesWithPermissionsByName<S, typeof stageMemberships>;

	const stageConnectionsList = props.stageConnections
		? await db
				.insertInto("move_constraint")
				.values(
					Object.entries(props.stageConnections).flatMap(([stage, destinations]) => {
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
								destinationId: consolidatedStages.find(
									(stage) => stage.name === dest
								)!.id,
							})) ?? [];

						const froms =
							from?.map((dest) => ({
								stageId: consolidatedStages.find((stage) => stage.name === dest)!
									.id,
								destinationId: currentStageId,
							})) ?? [];

						return [...tos, ...froms];
					})
				)
				.returningAll()
				.execute()
		: [];

	const createPubRecursiveInput = props.pubs
		? makePubInitializerMatchCreatePubRecursiveInput({
				pubTypes: createdPubTypes,
				users: createdUsers,
				stages: createdStages,
				community: createdCommunity,
				pubs: props.pubs,
				trx,
			})
		: [];

	// TODO: this can be simplified a lot by first creating the pubs and children
	// and then creating their related pubs

	let createdPubs: ProcessedPub[] = [];

	logger.info(
		`${createdCommunity.name}: ${options?.parallelPubs ? "Parallelly" : "Sequentially"} - Creating ${createPubRecursiveInput.length} pubs`
	);
	if (options?.parallelPubs) {
		const input = createPubRecursiveInput.map((input) => createPubRecursiveNew({ ...input }));

		setInterval(() => {
			logger.info(`${createdCommunity.name}: Creating Pubs...`);
		}, 1000);

		createdPubs = await Promise.all(input);
	} else {
		// we do this one at a time because we allow pubs to be able to reference each other in the relatedPubs field
		for (const input of createPubRecursiveInput) {
			const pub = await createPubRecursiveNew(input);
			createdPubs.push(pub);
		}
	}

	logger.info(`${createdCommunity.name}: Successfully created pubs`);

	const formList = props.forms ? Object.entries(props.forms) : [];
	const createdForms =
		formList.length > 0
			? await trx
					.with("form", (eb) =>
						eb
							.insertInto("forms")
							.values(
								formList.map(([formTitle, formInput]) => ({
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
					.with("form-elements", (db) =>
						db
							.insertInto("form_elements")
							.values((eb) =>
								formList.flatMap(([formTitle, formInput], idx) =>
									formInput.elements.map((elementInput, elementIndex) => ({
										formId: eb
											.selectFrom("form")
											.select("form.id")
											.limit(1)
											.offset(idx)
											.where("form.name", "=", formTitle),

										type: elementInput.type,
										fieldId: createdPubFields.find(
											(pubField) => pubField.name === elementInput.field
										)?.id,
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
								.selectFrom("form-elements")
								.selectAll("form-elements")
								.whereRef("form-elements.formId", "=", "form.id")
						).as("elements")
					)
					.execute()
			: [];

	const formsByName = Object.fromEntries(
		createdForms.map((form) => [form.name, form])
	) as FormsByName<F>;

	// actions last because they can reference form and pub id's
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

	logger.info(`${createdCommunity.name}: Successfully created ${createdActions.length} actions`);

	let apiToken: string | undefined = undefined;

	if (options?.withApiToken) {
		const [tokenId, tokenString] =
			typeof options.withApiToken === "string"
				? options.withApiToken.split(".")
				: [crypto.randomUUID(), undefined];

		const issuedById = createdMembers.find(
			(member) => member.role === MemberRole.admin
		)?.userId;

		if (!issuedById) {
			throw new Error(
				"Attempting to create an API token without an admin member. You should create an admin member in the seed if you intend to be able to use the API."
			);
		}

		const { token } = await createApiAccessToken({
			token: {
				name: "seed token",
				communityId,
				expiration: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 12),
				description: "Default seed token. Should not be used in production.",
				issuedAt: new Date(),
				id: tokenId as ApiAccessTokensId,
				issuedById,
				// @ts-expect-error - this is a predefined token
				token: tokenString,
			},
			permissions: allPermissions,
		}).executeTakeFirstOrThrow();

		apiToken = token;

		logger.info(`${createdCommunity.name}: Successfully created API token`);
	}
	logger.info(`${createdCommunity.name}: Successfully seeded community`);

	return {
		community: createdCommunity,
		pubFields: pubFieldsByName,
		pubTypes: pubTypesWithPubFieldsByName,
		users: usersBySlug,
		members: createdMembers,
		stages: stagesWithPermissionsByName,
		stageConnections: stageConnectionsList,
		pubs: createdPubs,
		actions: createdActions,
		forms: formsByName,
		apiToken: apiToken as WithApiToken extends string
			? `${string}.${WithApiToken}`
			: WithApiToken extends boolean
				? string
				: undefined,
	};
}

/**
 * Convenience method in case you want to define the input of `seedCommunity` before actually calling it
 */
export const createSeed = <
	const PF extends PubFieldsInitializer,
	const PT extends PubTypeInitializer<PF>,
	const U extends UsersInitializer,
	const S extends StagesInitializer<U>,
	const SC extends StageConnectionsInitializer<S>,
	const PI extends PubInitializer<PF, PT, U, S>[],
	const F extends FormInitializer<PF, PT, U, S>,
>(props: {
	community: {
		id?: CommunitiesId;
		name: string;
		slug: string;
		avatar?: string;
	};
	pubFields?: PF;
	pubTypes?: PT;
	users?: U;
	stages?: S;
	stageConnections?: SC;
	pubs?: PI;
	forms?: F;
}) => props;
