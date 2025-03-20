import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { sql, Table } from "drizzle-orm";
import {
	boolean,
	check,
	customType,
	foreignKey,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";

export const action = pgEnum("Action", [
	"log",
	"pdf",
	"email",
	"pushToV6",
	"http",
	"move",
	"googleDriveImport",
	"datacite",
]);
export const actionRunStatus = pgEnum("ActionRunStatus", ["success", "failure", "scheduled"]);
export const apiAccessScope = pgEnum("ApiAccessScope", [
	"community",
	"pub",
	"stage",
	"member",
	"pubType",
]);
export const apiAccessType = pgEnum("ApiAccessType", ["read", "write", "archive"]);
export const authTokenType = pgEnum("AuthTokenType", [
	"generic",
	"passwordReset",
	"signup",
	"verifyEmail",
]);
export const capabilities = pgEnum("Capabilities", [
	"movePub",
	"createPub",
	"viewPub",
	"deletePub",
	"updatePubValues",
	"createRelatedPub",
	"createPubWithForm",
	"editPubWithForm",
	"createPubField",
	"archivePubField",
	"editPubField",
	"createPubType",
	"editPubType",
	"deletePubType",
	"runAction",
	"viewStage",
	"createStage",
	"manageStage",
	"deleteStage",
	"addPubMember",
	"removePubMember",
	"addStageMember",
	"removeStageMember",
	"addFormMember",
	"removeFormMember",
	"addCommunityMember",
	"removeCommunityMember",
	"manageMemberGroups",
	"addCommunity",
	"editCommunity",
	"createForm",
	"editForm",
	"archiveForm",
	"createApiToken",
	"revokeApiToken",
]);
export const coreSchemaType = pgEnum("CoreSchemaType", [
	"String",
	"Boolean",
	"Vector3",
	"DateTime",
	"Email",
	"URL",
	"MemberId",
	"FileUpload",
	"Null",
	"Number",
	"NumericArray",
	"StringArray",
	"RichText",
]);
export const elementType = pgEnum("ElementType", ["pubfield", "structural", "button"]);
export const event = pgEnum("Event", [
	"pubEnteredStage",
	"pubLeftStage",
	"pubInStageForDuration",
	"actionSucceeded",
	"actionFailed",
]);
export const formAccessType = pgEnum("FormAccessType", ["private", "inviteOnly", "public"]);
export const inputComponent = pgEnum("InputComponent", [
	"textArea",
	"textInput",
	"datePicker",
	"checkbox",
	"fileUpload",
	"memberSelect",
	"confidenceInterval",
	"checkboxGroup",
	"radioGroup",
	"selectDropdown",
	"multivalueInput",
	"richText",
	"relationBlock",
]);
export const memberRole = pgEnum("MemberRole", ["admin", "editor", "contributor"]);
export const membershipType = pgEnum("MembershipType", ["community", "stage", "pub", "form"]);
export const operationType = pgEnum("OperationType", ["insert", "update", "delete"]);
export const structuralFormElement = pgEnum("StructuralFormElement", ["h2", "h3", "p", "hr"]);

const createdAt = timestamp("createdAt", { precision: 3, mode: "string" })
	.default(sql`CURRENT_TIMESTAMP`)
	.notNull();
const updatedAt = timestamp("updatedAt", { precision: 3, mode: "string" })
	.default(sql`CURRENT_TIMESTAMP`)
	.notNull();

export const users = pgTable("users", {
	id: text()
		.default(sql`gen_random_uuid()`)
		.primaryKey()
		.notNull(),
	slug: text().notNull().unique("users_slug_key"),
	email: text().notNull().unique("users_email_key"),
	firstName: text().notNull(),
	avatar: text(),
	createdAt,
	updatedAt,
	lastName: text(),
	orcid: text(),
	isSuperAdmin: boolean().default(false).notNull(),
	passwordHash: text(),
});

export const stages = pgTable(
	"stages",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		createdAt,
		updatedAt,
		name: text().notNull(),
		order: text().notNull(),
		communityId: text()
			.notNull()
			.references(() => communities.id, { onDelete: "restrict", onUpdate: "cascade" }),
	},
	(table) => []
);

export const communities = pgTable("communities", {
	id: text()
		.default(sql`gen_random_uuid()`)
		.primaryKey()
		.notNull(),
	createdAt,
	updatedAt,
	name: text().notNull(),
	avatar: text(),
	slug: text().notNull().unique("communities_slug_key"),
});

export const memberGroups = pgTable(
	"member_groups",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		createdAt,
		updatedAt,
		communityId: text()
			.notNull()
			.references(() => communities.id, { onDelete: "cascade", onUpdate: "cascade" }),
	},
	(table) => []
);

export const pubTypes = pgTable(
	"pub_types",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		createdAt,
		updatedAt,
		communityId: text()
			.notNull()
			.references(() => communities.id, { onDelete: "restrict", onUpdate: "cascade" }),
		name: text().notNull(),
		description: text(),
	},
	(table) => [
		uniqueIndex("pub_types_name_communityId_key").using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
			table.communityId.asc().nullsLast().op("text_ops")
		),
	]
);

const tsVector = customType<{ data: string }>({
	dataType() {
		return "tsvector";
	},
});

export const pubs = pgTable(
	"pubs",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		createdAt,
		updatedAt,
		pubTypeId: text()
			.notNull()
			.references(() => pubTypes.id, { onDelete: "restrict", onUpdate: "cascade" }),
		communityId: text()
			.notNull()
			.references(() => communities.id, { onDelete: "restrict", onUpdate: "cascade" }),
		valuesBlob: jsonb(),
		assigneeId: text().references(() => users.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		title: text(),
		searchVector: tsVector("searchVector"),
	},
	(table) => [
		index("pubs_searchVector_idx").using(
			"gin",
			table.searchVector.asc().nullsLast().op("tsvector_ops")
		),
	]
);

const modifiedByType = customType<{ data: string }>({
	dataType() {
		return "modified_by_type";
	},
});

const lastModifiedByCheck = (tablename: string) =>
	check(
		`${tablename}_lastModifiedBy_check`,
		sql`"lastModifiedBy" ~ '^(user|action-run|api-access-token):[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\|\d+$|^(unknown|system)\|\d+$'`
	);

export const pubValues = pgTable(
	"pub_values",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		fieldId: text()
			.notNull()
			.references(() => pubFields.id, { onDelete: "restrict", onUpdate: "cascade" }),
		value: jsonb(),
		pubId: text()
			.notNull()
			.references(() => pubs.id, { onDelete: "cascade", onUpdate: "cascade" }),
		createdAt,
		updatedAt,
		relatedPubId: text("relatedPubId").references(() => pubs.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		lastModifiedBy: text("lastModifiedBy").notNull(),
		rank: text(),
	},
	(table) => [
		uniqueIndex("pub_values_pubId_fieldId_key")
			.using(
				"btree",
				table.pubId.asc().nullsLast().op("text_ops"),
				table.fieldId.asc().nullsLast().op("text_ops")
			)
			.where(sql`("relatedPubId" IS NULL)`),
		uniqueIndex("pub_values_pubId_relatedPubId_fieldId_key")
			.using(
				"btree",
				table.pubId.asc().nullsLast().op("text_ops"),
				table.relatedPubId.asc().nullsLast().op("text_ops"),
				table.fieldId.asc().nullsLast().op("text_ops")
			)
			.where(sql`("relatedPubId" IS NOT NULL)`),

		lastModifiedByCheck("pub_values"),
	]
);

export const pubFields = pgTable("pub_fields", {
	id: text()
		.default(sql`gen_random_uuid()`)
		.primaryKey()
		.notNull(),
	name: text().notNull(),
	createdAt,
	updatedAt,
	pubFieldSchemaId: text().references(() => pubFieldSchema.id, {
		onDelete: "set null",
		onUpdate: "cascade",
	}),
	slug: text().notNull().unique("pub_fields_slug_key"),
	schemaName: coreSchemaType(),
	isArchived: boolean().default(false).notNull(),
	communityId: text()
		.notNull()
		.references(() => communities.id, { onDelete: "restrict", onUpdate: "cascade" }),
	isRelation: boolean().default(false).notNull(),
});

export const pubFieldToPubType = pgTable(
	"_PubFieldToPubType",
	{
		a: text("A")
			.notNull()
			.references(() => pubFields.id, { onDelete: "cascade", onUpdate: "cascade" }),
		b: text("B")
			.notNull()
			.references(() => pubTypes.id, { onDelete: "cascade", onUpdate: "cascade" }),
		isTitle: boolean().default(false).notNull(),
		createdAt,
		updatedAt,
	},
	(table) => [
		uniqueIndex("_PubFieldToPubType_A_B_key").using(
			"btree",
			table.a.asc().nullsLast().op("text_ops"),
			table.b.asc().nullsLast().op("text_ops")
		),
		index().using("btree", table.b.asc().nullsLast().op("text_ops")),
		uniqueIndex("unique_pubtype_istitle")
			.using("btree", table.b.asc().nullsLast().op("text_ops"))
			.where(sql`("isTitle" IS TRUE)`),
	]
);

export const authTokens = pgTable(
	"auth_tokens",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		hash: text().notNull(),
		createdAt,
		expiresAt: timestamp({ precision: 3, mode: "string" }).notNull(),
		isUsed: boolean().default(false).notNull(),
		userId: text()
			.notNull()
			.references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),
		type: authTokenType().default("generic").notNull(),
		updatedAt,
	},
	(table) => []
);

export const memberGroupToUser = pgTable(
	"_MemberGroupToUser",
	{
		a: text("A")
			.notNull()
			.references(() => memberGroups.id, { onDelete: "cascade", onUpdate: "cascade" }),
		b: text("B")
			.notNull()
			.references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
	},
	(table) => [
		uniqueIndex("_MemberGroupToUser_AB_unique").using(
			"btree",
			table.a.asc().nullsLast().op("text_ops"),
			table.b.asc().nullsLast().op("text_ops")
		),
		index().using("btree", table.b.asc().nullsLast().op("text_ops")),
	]
);

export const pubFieldSchema = pgTable(
	"PubFieldSchema",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		namespace: text().notNull(),
		name: text().notNull(),
		schema: jsonb().notNull(),
		createdAt,
		updatedAt,
	},
	(table) => [
		uniqueIndex("PubFieldSchema_name_namespace_key").using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
			table.namespace.asc().nullsLast().op("text_ops")
		),
	]
);

export const actionInstances = pgTable("action_instances", {
	id: text()
		.default(sql`gen_random_uuid()`)
		.primaryKey()
		.notNull(),
	stageId: text()
		.notNull()
		.references(() => stages.id, { onDelete: "cascade", onUpdate: "cascade" }),
	createdAt,
	updatedAt,
	config: jsonb(),
	name: text().default("").notNull(),
	action: action().notNull(),
});

export const rules = pgTable(
	"rules",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		event: event().notNull(),
		actionInstanceId: text()
			.notNull()
			.references(() => actionInstances.id, { onDelete: "cascade", onUpdate: "cascade" }),
		config: jsonb(),
		createdAt,
		updatedAt,
		sourceActionInstanceId: text().references(() => actionInstances.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(table) => [
		uniqueIndex("unique_action_chaining_events")
			.using(
				"btree",
				table.actionInstanceId.asc().nullsLast().op("text_ops"),
				table.event.asc().nullsLast().op("text_ops"),
				table.sourceActionInstanceId.asc().nullsLast().op("text_ops")
			)
			.where(sql`("sourceActionInstanceId" IS NOT NULL)`),
		uniqueIndex("unique_regular_events")
			.using(
				"btree",
				table.actionInstanceId.asc().nullsLast().op("text_ops"),
				table.event.asc().nullsLast().op("text_ops")
			)
			.where(sql`("sourceActionInstanceId" IS NULL)`),
	]
);

export const forms = pgTable(
	"forms",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		name: text().notNull(),
		pubTypeId: text()
			.notNull()
			.references(() => pubTypes.id, { onDelete: "restrict", onUpdate: "cascade" }),
		isArchived: boolean().default(false).notNull(),
		communityId: text()
			.notNull()
			.references(() => communities.id, { onDelete: "cascade", onUpdate: "cascade" }),
		slug: text().notNull(),
		access: formAccessType().default("private").notNull(),
		isDefault: boolean().default(false).notNull(),
		createdAt,
		updatedAt,
	},
	(table) => [
		uniqueIndex("forms_name_communityId_key").using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
			table.communityId.asc().nullsLast().op("text_ops")
		),
		uniqueIndex("forms_slug_communityId_key").using(
			"btree",
			table.slug.asc().nullsLast().op("text_ops"),
			table.communityId.asc().nullsLast().op("text_ops")
		),
	]
);

export const actionRuns = pgTable(
	"action_runs",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		actionInstanceId: text().references(() => actionInstances.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		pubId: text().references(() => pubs.id, { onDelete: "set null", onUpdate: "cascade" }),
		config: jsonb(),
		event: event(),
		params: jsonb(),
		status: actionRunStatus().notNull(),
		userId: text().references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
		createdAt,
		updatedAt,
		result: jsonb().notNull(),
		sourceActionRunId: text().references((): AnyPgColumn => actionRuns.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(table) => []
);

export const apiAccessLogs = pgTable(
	"api_access_logs",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		accessTokenId: text().references(() => apiAccessTokens.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		timestamp: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		action: text().notNull(),
	},
	(table) => []
);

export const apiAccessTokens = pgTable(
	"api_access_tokens",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		token: text().notNull().unique("api_access_tokens_token_key"),
		name: text().notNull(),
		description: text(),
		communityId: text()
			.notNull()
			.references(() => communities.id, { onDelete: "cascade", onUpdate: "cascade" }),
		expiration: timestamp({ precision: 3, mode: "string" }).notNull(),
		issuedById: text().references(() => users.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		issuedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt,
	},
	(table) => [index("token_idx").using("btree", table.token.asc().nullsLast().op("text_ops"))]
);

export const sessions = pgTable(
	"sessions",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		userId: text()
			.notNull()
			.references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),
		expiresAt: timestamp({ precision: 3, mode: "string" }).notNull(),
		createdAt,
		updatedAt,
		type: authTokenType().default("generic").notNull(),
	},
	(table) => []
);

export const apiAccessPermissions = pgTable(
	"api_access_permissions",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		apiAccessTokenId: text()
			.notNull()
			.references(() => apiAccessTokens.id, { onDelete: "cascade", onUpdate: "cascade" }),
		scope: apiAccessScope().notNull(),
		accessType: apiAccessType().notNull(),
		constraints: jsonb(),
		createdAt,
		updatedAt,
	},
	(table) => [
		index("api_access_permissions_idx").using(
			"btree",
			table.apiAccessTokenId.asc().nullsLast().op("enum_ops"),
			table.scope.asc().nullsLast().op("text_ops"),
			table.accessType.asc().nullsLast().op("enum_ops")
		),
	]
);

export const formElements = pgTable(
	"form_elements",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		type: elementType().notNull(),
		fieldId: text().references(() => pubFields.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		formId: text()
			.notNull()
			.references(() => forms.id, { onDelete: "cascade", onUpdate: "cascade" }),
		label: text(),
		element: structuralFormElement(),
		content: text(),
		required: boolean(),
		stageId: text().references(() => stages.id, { onDelete: "set null", onUpdate: "cascade" }),
		component: inputComponent(),
		config: jsonb(),
		createdAt,
		updatedAt,
		rank: text().notNull(),
	},
	(table) => [
		uniqueIndex("form_elements_fieldId_formId_key").using(
			"btree",
			table.fieldId.asc().nullsLast().op("text_ops"),
			table.formId.asc().nullsLast().op("text_ops")
		),
		uniqueIndex("form_elements_type_label_formId_key").using(
			"btree",
			table.type.asc().nullsLast().op("enum_ops"),
			table.label.asc().nullsLast().op("text_ops"),
			table.formId.asc().nullsLast().op("text_ops")
		),
	]
);

export const communityMemberships = pgTable(
	"community_memberships",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		role: memberRole().notNull(),
		communityId: text()
			.notNull()
			.references(() => communities.id, { onDelete: "cascade", onUpdate: "cascade" }),
		userId: text().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
		memberGroupId: text().references(() => memberGroups.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		createdAt,
		updatedAt,
	},
	(table) => [
		uniqueIndex("community_memberships_communityId_memberGroupId_key").using(
			"btree",
			table.communityId.asc().nullsLast().op("text_ops"),
			table.memberGroupId.asc().nullsLast().op("text_ops")
		),
		uniqueIndex("community_memberships_communityId_userId_key").using(
			"btree",
			table.communityId.asc().nullsLast().op("text_ops"),
			table.userId.asc().nullsLast().op("text_ops")
		),

		check("community_memberships_check", sql`num_nonnulls("userId", "memberGroupId") = 1`),
	]
);

export const pubMemberships = pgTable(
	"pub_memberships",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		role: memberRole().notNull(),
		pubId: text()
			.notNull()
			.references(() => pubs.id, { onDelete: "cascade", onUpdate: "cascade" }),
		userId: text().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
		memberGroupId: text().references(() => memberGroups.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		createdAt,
		updatedAt,
	},
	(table) => [
		uniqueIndex("pub_memberships_pubId_memberGroupId_key").using(
			"btree",
			table.pubId.asc().nullsLast().op("text_ops"),
			table.memberGroupId.asc().nullsLast().op("text_ops")
		),
		uniqueIndex("pub_memberships_pubId_userId_key").using(
			"btree",
			table.pubId.asc().nullsLast().op("text_ops"),
			table.userId.asc().nullsLast().op("text_ops")
		),

		check("pub_memberships_check", sql`num_nonnulls("userId", "memberGroupId") = 1`),
	]
);

export const stageMemberships = pgTable(
	"stage_memberships",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		role: memberRole().notNull(),
		stageId: text()
			.notNull()
			.references(() => stages.id, { onDelete: "cascade", onUpdate: "cascade" }),
		userId: text().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
		memberGroupId: text().references(() => memberGroups.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		createdAt,
		updatedAt,
	},
	(table) => [
		uniqueIndex("stage_memberships_stageId_memberGroupId_key").using(
			"btree",
			table.stageId.asc().nullsLast().op("text_ops"),
			table.memberGroupId.asc().nullsLast().op("text_ops")
		),
		uniqueIndex("stage_memberships_stageId_userId_key").using(
			"btree",
			table.stageId.asc().nullsLast().op("text_ops"),
			table.userId.asc().nullsLast().op("text_ops")
		),

		check("stage_memberships_check", sql`num_nonnulls("userId", "memberGroupId") = 1`),
	]
);

export const pubValuesHistory = pgTable(
	"pub_values_history",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		createdAt,
		operationType: operationType().notNull(),
		oldRowData: jsonb(),
		newRowData: jsonb(),
		pubValueId: text(),
		userId: text().references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
		apiAccessTokenId: text().references(() => apiAccessTokens.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		actionRunId: text().references(() => actionRuns.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		other: text(),
	},
	(table) => [
		check(
			"chk_pub_values_history_crudtype_rowdata",
			sql`(("operationType" = 'insert'::"OperationType") AND ("oldRowData" IS NULL) AND ("newRowData" IS NOT NULL)) OR (("operationType" = 'update'::"OperationType") AND ("oldRowData" IS NOT NULL) AND ("newRowData" IS NOT NULL)) OR (("operationType" = 'delete'::"OperationType") AND ("oldRowData" IS NOT NULL) AND ("newRowData" IS NULL))`
		),
	]
);

export const formMemberships = pgTable(
	"form_memberships",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		formId: text()
			.notNull()
			.references(() => forms.id, { onDelete: "cascade", onUpdate: "cascade" }),
		userId: text().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
		memberGroupId: text().references(() => memberGroups.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		createdAt: createdAt,
		updatedAt,
		pubId: text().references(() => pubs.id, { onDelete: "cascade", onUpdate: "cascade" }),
	},
	(table) => [
		uniqueIndex("form_memberships_formId_memberGroupId_pubId_key").using(
			"btree",
			table.formId.asc().nullsLast().op("text_ops"),
			table.memberGroupId.asc().nullsLast().op("text_ops"),
			table.pubId.asc().nullsLast().op("text_ops")
		),
		uniqueIndex("form_memberships_formId_userId_pubId_key").using(
			"btree",
			table.formId.asc().nullsLast().op("text_ops"),
			table.userId.asc().nullsLast().op("text_ops"),
			table.pubId.asc().nullsLast().op("text_ops")
		),

		check("form_memberships_check", sql`num_nonnulls("userId", "memberGroupId") = 1`),
	]
);

export const membershipCapabilities = pgTable(
	"membership_capabilities",
	{
		role: memberRole().notNull(),
		type: membershipType().notNull(),
		capability: capabilities().notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.role, table.type, table.capability],
			name: "membership_capabilities_pkey",
		}),
	]
);

export const moveConstraint = pgTable(
	"move_constraint",
	{
		stageId: text()
			.notNull()
			.references(() => stages.id, { onDelete: "cascade", onUpdate: "cascade" }),
		destinationId: text()
			.notNull()
			.references(() => stages.id, { onDelete: "cascade", onUpdate: "cascade" }),
		createdAt,
		updatedAt,
	},
	(table) => [
		primaryKey({ columns: [table.stageId, table.destinationId], name: "move_constraint_pkey" }),
	]
);

export const pubsInStages = pgTable(
	"PubsInStages",
	{
		pubId: text()
			.notNull()
			.references(() => pubs.id, { onDelete: "cascade", onUpdate: "cascade" }),
		stageId: text()
			.notNull()
			.references(() => stages.id, { onDelete: "cascade", onUpdate: "cascade" }),
		createdAt,
		updatedAt,
	},
	(table) => [primaryKey({ columns: [table.pubId, table.stageId], name: "PubsInStages_pkey" })]
);
