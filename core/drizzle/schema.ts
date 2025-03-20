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

export const users = pgTable(
	"users",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		slug: text().notNull(),
		email: text().notNull(),
		firstName: text().notNull(),
		avatar: text(),
		createdAt,
		updatedAt,
		lastName: text(),
		orcid: text(),
		isSuperAdmin: boolean().default(false).notNull(),
		passwordHash: text(),
	},
	(table) => [
		uniqueIndex("users_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
		uniqueIndex("users_slug_key").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	]
);

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
		communityId: text().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "stages_communityId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
	]
);

export const communities = pgTable(
	"communities",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		createdAt,
		updatedAt,
		name: text().notNull(),
		avatar: text(),
		slug: text().notNull(),
	},
	(table) => [
		uniqueIndex("communities_slug_key").using(
			"btree",
			table.slug.asc().nullsLast().op("text_ops")
		),
	]
);

export const memberGroups = pgTable(
	"member_groups",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		createdAt,
		updatedAt,
		communityId: text().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "member_groups_communityId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	]
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
		communityId: text().notNull(),
		name: text().notNull(),
		description: text(),
	},
	(table) => [
		uniqueIndex("pub_types_name_communityId_key").using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
			table.communityId.asc().nullsLast().op("text_ops")
		),
		foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "pub_types_communityId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
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
		pubTypeId: text().notNull(),
		communityId: text().notNull(),
		valuesBlob: jsonb(),
		assigneeId: text(),
		title: text(),
		searchVector: tsVector("searchVector"),
	},
	(table) => [
		index("pubs_searchVector_idx").using(
			"gin",
			table.searchVector.asc().nullsLast().op("tsvector_ops")
		),
		foreignKey({
			columns: [table.pubTypeId],
			foreignColumns: [pubTypes.id],
			name: "pubs_pubTypeId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
		foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "pubs_communityId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
		foreignKey({
			columns: [table.assigneeId],
			foreignColumns: [users.id],
			name: "pubs_assigneeId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
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
		fieldId: text().notNull(),
		value: jsonb(),
		pubId: text().notNull(),
		createdAt,
		updatedAt,
		relatedPubId: text("relatedPubId"),
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
		foreignKey({
			columns: [table.fieldId],
			foreignColumns: [pubFields.id],
			name: "pub_values_fieldId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
		foreignKey({
			columns: [table.pubId],
			foreignColumns: [pubs.id],
			name: "pub_values_pubId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.relatedPubId],
			foreignColumns: [pubs.id],
			name: "pub_values_relatedPubId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		lastModifiedByCheck("pub_values"),
	]
);

export const pubFields = pgTable(
	"pub_fields",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		name: text().notNull(),
		createdAt,
		updatedAt,
		pubFieldSchemaId: text(),
		slug: text().notNull(),
		schemaName: coreSchemaType(),
		isArchived: boolean().default(false).notNull(),
		communityId: text().notNull(),
		isRelation: boolean().default(false).notNull(),
	},
	(table) => [
		uniqueIndex("pub_fields_slug_key").using(
			"btree",
			table.slug.asc().nullsLast().op("text_ops")
		),
		foreignKey({
			columns: [table.pubFieldSchemaId],
			foreignColumns: [pubFieldSchema.id],
			name: "pub_fields_pubFieldSchemaId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "pub_fields_communityId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
	]
);

export const pubFieldToPubType = pgTable(
	"_PubFieldToPubType",
	{
		a: text("A").notNull(),
		b: text("B").notNull(),
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
		foreignKey({
			columns: [table.a],
			foreignColumns: [pubFields.id],
			name: "_PubFieldToPubType_A_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.b],
			foreignColumns: [pubTypes.id],
			name: "_PubFieldToPubType_B_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
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
		userId: text().notNull(),
		type: authTokenType().default("generic").notNull(),
		updatedAt,
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "auth_tokens_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
	]
);

export const memberGroupToUser = pgTable(
	"_MemberGroupToUser",
	{
		a: text("A").notNull(),
		b: text("B").notNull(),
	},
	(table) => [
		uniqueIndex("_MemberGroupToUser_AB_unique").using(
			"btree",
			table.a.asc().nullsLast().op("text_ops"),
			table.b.asc().nullsLast().op("text_ops")
		),
		index().using("btree", table.b.asc().nullsLast().op("text_ops")),
		foreignKey({
			columns: [table.a],
			foreignColumns: [memberGroups.id],
			name: "_MemberGroupToUser_A_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.b],
			foreignColumns: [users.id],
			name: "_MemberGroupToUser_B_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
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

export const actionInstances = pgTable(
	"action_instances",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		stageId: text().notNull(),
		createdAt,
		updatedAt,
		config: jsonb(),
		name: text().default("").notNull(),
		action: action().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.stageId],
			foreignColumns: [stages.id],
			name: "action_instances_stageId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	]
);

export const rules = pgTable(
	"rules",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		event: event().notNull(),
		actionInstanceId: text().notNull(),
		config: jsonb(),
		createdAt,
		updatedAt,
		sourceActionInstanceId: text(),
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
		foreignKey({
			columns: [table.actionInstanceId],
			foreignColumns: [actionInstances.id],
			name: "rules_actionInstanceId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.sourceActionInstanceId],
			foreignColumns: [actionInstances.id],
			name: "rules_sourceActionInstanceId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
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
		pubTypeId: text().notNull(),
		isArchived: boolean().default(false).notNull(),
		communityId: text().notNull(),
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
		foreignKey({
			columns: [table.pubTypeId],
			foreignColumns: [pubTypes.id],
			name: "forms_pubTypeId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
		foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "forms_communityId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	]
);

export const actionRuns = pgTable(
	"action_runs",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		actionInstanceId: text(),
		pubId: text(),
		config: jsonb(),
		event: event(),
		params: jsonb(),
		status: actionRunStatus().notNull(),
		userId: text(),
		createdAt,
		updatedAt,
		result: jsonb().notNull(),
		sourceActionRunId: text(),
	},
	(table) => [
		foreignKey({
			columns: [table.actionInstanceId],
			foreignColumns: [actionInstances.id],
			name: "action_runs_actionInstanceId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.pubId],
			foreignColumns: [pubs.id],
			name: "action_runs_pubId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "action_runs_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.sourceActionRunId],
			foreignColumns: [table.id],
			name: "action_runs_sourceActionRunId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	]
);

export const apiAccessLogs = pgTable(
	"api_access_logs",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		accessTokenId: text(),
		timestamp: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		action: text().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.accessTokenId],
			foreignColumns: [apiAccessTokens.id],
			name: "api_access_logs_accessTokenId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	]
);

export const apiAccessTokens = pgTable(
	"api_access_tokens",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		token: text().notNull(),
		name: text().notNull(),
		description: text(),
		communityId: text().notNull(),
		expiration: timestamp({ precision: 3, mode: "string" }).notNull(),
		issuedById: text(),
		issuedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt,
	},
	(table) => [
		uniqueIndex("api_access_tokens_token_key").using(
			"btree",
			table.token.asc().nullsLast().op("text_ops")
		),
		index("token_idx").using("btree", table.token.asc().nullsLast().op("text_ops")),
		foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "api_access_tokens_communityId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.issuedById],
			foreignColumns: [users.id],
			name: "api_access_tokens_issuedById_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	]
);

export const sessions = pgTable(
	"sessions",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		userId: text().notNull(),
		expiresAt: timestamp({ precision: 3, mode: "string" }).notNull(),
		createdAt,
		updatedAt,
		type: authTokenType().default("generic").notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
	]
);

export const apiAccessPermissions = pgTable(
	"api_access_permissions",
	{
		id: text()
			.default(sql`gen_random_uuid()`)
			.primaryKey()
			.notNull(),
		apiAccessTokenId: text().notNull(),
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
		foreignKey({
			columns: [table.apiAccessTokenId],
			foreignColumns: [apiAccessTokens.id],
			name: "api_access_permissions_apiAccessTokenId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
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
		fieldId: text(),
		formId: text().notNull(),
		label: text(),
		element: structuralFormElement(),
		content: text(),
		required: boolean(),
		stageId: text(),
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
		foreignKey({
			columns: [table.stageId],
			foreignColumns: [stages.id],
			name: "form_elements_stageId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.fieldId],
			foreignColumns: [pubFields.id],
			name: "form_elements_fieldId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.formId],
			foreignColumns: [forms.id],
			name: "form_elements_formId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
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
		communityId: text().notNull(),
		userId: text(),
		memberGroupId: text(),
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
		foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "community_memberships_communityId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "community_memberships_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.memberGroupId],
			foreignColumns: [memberGroups.id],
			name: "community_memberships_memberGroupId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
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
		pubId: text().notNull(),
		userId: text(),
		memberGroupId: text(),
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
		foreignKey({
			columns: [table.pubId],
			foreignColumns: [pubs.id],
			name: "pub_memberships_pubId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "pub_memberships_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.memberGroupId],
			foreignColumns: [memberGroups.id],
			name: "pub_memberships_memberGroupId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
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
		stageId: text().notNull(),
		userId: text(),
		memberGroupId: text(),
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
		foreignKey({
			columns: [table.stageId],
			foreignColumns: [stages.id],
			name: "stage_memberships_stageId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "stage_memberships_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.memberGroupId],
			foreignColumns: [memberGroups.id],
			name: "stage_memberships_memberGroupId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
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
		userId: text(),
		apiAccessTokenId: text(),
		actionRunId: text(),
		other: text(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "pub_values_history_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.apiAccessTokenId],
			foreignColumns: [apiAccessTokens.id],
			name: "pub_values_history_apiAccessTokenId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.actionRunId],
			foreignColumns: [actionRuns.id],
			name: "pub_values_history_actionRunId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
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
		formId: text().notNull(),
		userId: text(),
		memberGroupId: text(),
		createdAt: createdAt,
		updatedAt,
		pubId: text(),
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
		foreignKey({
			columns: [table.formId],
			foreignColumns: [forms.id],
			name: "form_memberships_formId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "form_memberships_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.memberGroupId],
			foreignColumns: [memberGroups.id],
			name: "form_memberships_memberGroupId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.pubId],
			foreignColumns: [pubs.id],
			name: "form_memberships_pubId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
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
		stageId: text().notNull(),
		destinationId: text().notNull(),
		createdAt,
		updatedAt,
	},
	(table) => [
		foreignKey({
			columns: [table.stageId],
			foreignColumns: [stages.id],
			name: "move_constraint_stageId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.destinationId],
			foreignColumns: [stages.id],
			name: "move_constraint_destinationId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		primaryKey({ columns: [table.stageId, table.destinationId], name: "move_constraint_pkey" }),
	]
);

export const pubsInStages = pgTable(
	"PubsInStages",
	{
		pubId: text().notNull(),
		stageId: text().notNull(),
		createdAt,
		updatedAt,
	},
	(table) => [
		foreignKey({
			columns: [table.pubId],
			foreignColumns: [pubs.id],
			name: "PubsInStages_pubId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.stageId],
			foreignColumns: [stages.id],
			name: "PubsInStages_stageId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		primaryKey({ columns: [table.pubId, table.stageId], name: "PubsInStages_pkey" }),
	]
);
