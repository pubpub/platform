// This file is generated by generateDbTableNames.ts
// Do not modify manually

export const databaseTableNames = [
	"PubFieldSchema",
	"PubsInStages",
	"_MemberGroupToUser",
	"_PubFieldToPubType",
	"_prisma_migrations",
	"action_instances",
	"action_runs",
	"api_access_logs",
	"api_access_permissions",
	"api_access_tokens",
	"auth_tokens",
	"communities",
	"community_memberships",
	"form_elements",
	"form_memberships",
	"forms",
	"member_groups",
	"membership_capabilities",
	"move_constraint",
	"pub_fields",
	"pub_memberships",
	"pub_types",
	"pub_values",
	"pub_values_history",
	"pubs",
	"rules",
	"sessions",
	"stage_memberships",
	"stages",
	"users",
] as const;

export const databaseTables = [
	{
		name: "PubFieldSchema",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "namespace",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "name",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "schema",
				dataType: "jsonb",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
				comment: "@type(JSONSchemaType<any>, 'ajv', true, false, true)",
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
		],
	},
	{
		name: "PubsInStages",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "pubId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "stageId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "_MemberGroupToUser",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "A",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "B",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "_PubFieldToPubType",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "A",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "B",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "isTitle",
				dataType: "bool",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
		],
	},
	{
		name: "_prisma_migrations",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "varchar",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "checksum",
				dataType: "varchar",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "finished_at",
				dataType: "timestamptz",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "migration_name",
				dataType: "varchar",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "logs",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "rolled_back_at",
				dataType: "timestamptz",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "started_at",
				dataType: "timestamptz",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "applied_steps_count",
				dataType: "int4",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
		],
	},
	{
		name: "action_instances",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "stageId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "config",
				dataType: "jsonb",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "name",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "action",
				dataType: "Action",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "action_runs",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "actionInstanceId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "pubId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "config",
				dataType: "jsonb",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "event",
				dataType: "Event",
				dataTypeSchema: "public",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "params",
				dataType: "jsonb",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "status",
				dataType: "ActionRunStatus",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "userId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "result",
				dataType: "jsonb",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "api_access_logs",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "accessTokenId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "timestamp",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "action",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "api_access_permissions",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "apiAccessTokenId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "scope",
				dataType: "ApiAccessScope",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "accessType",
				dataType: "ApiAccessType",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "constraints",
				dataType: "jsonb",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
				comment: "@type(ApiAccessPermissionConstraints, '../types', true, false, true)",
			},
		],
	},
	{
		name: "api_access_tokens",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "token",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "name",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "description",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "communityId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "expiration",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "issuedById",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "issuedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
		],
	},
	{
		name: "auth_tokens",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "hash",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "expiresAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "isUsed",
				dataType: "bool",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "userId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "type",
				dataType: "AuthTokenType",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
		],
	},
	{
		name: "communities",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "name",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "avatar",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "slug",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "community_memberships",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "role",
				dataType: "MemberRole",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "communityId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "userId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "memberGroupId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
		],
	},
	{
		name: "form_elements",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "type",
				dataType: "ElementType",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "fieldId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "formId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "order",
				dataType: "int4",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "label",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "element",
				dataType: "StructuralFormElement",
				dataTypeSchema: "public",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "content",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "required",
				dataType: "bool",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "stageId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "component",
				dataType: "InputComponent",
				dataTypeSchema: "public",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "config",
				dataType: "jsonb",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "form_memberships",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "formId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "userId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "memberGroupId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "pubId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "forms",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "name",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "pubTypeId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "isArchived",
				dataType: "bool",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "communityId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "slug",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "access",
				dataType: "FormAccessType",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "isDefault",
				dataType: "bool",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
		],
	},
	{
		name: "member_groups",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "communityId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "membership_capabilities",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "role",
				dataType: "MemberRole",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "type",
				dataType: "MembershipType",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "capability",
				dataType: "Capabilities",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "move_constraint",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "stageId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "destinationId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
		],
	},
	{
		name: "pub_fields",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "name",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "pubFieldSchemaId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "slug",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "schemaName",
				dataType: "CoreSchemaType",
				dataTypeSchema: "public",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "isArchived",
				dataType: "bool",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "communityId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "isRelation",
				dataType: "bool",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
		],
	},
	{
		name: "pub_memberships",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "role",
				dataType: "MemberRole",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "pubId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "userId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "memberGroupId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
		],
	},
	{
		name: "pub_types",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "communityId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "name",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "description",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "pub_values",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "fieldId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "value",
				dataType: "jsonb",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "pubId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "relatedPubId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "lastModifiedBy",
				dataType: "modified_by_type",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
				comment: "@type(LastModifiedBy, '../types', true, false, true)",
			},
		],
	},
	{
		name: "pub_values_history",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "operationType",
				dataType: "OperationType",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "oldRowData",
				dataType: "jsonb",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "newRowData",
				dataType: "jsonb",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "pubValueId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "userId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "apiAccessTokenId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "actionRunId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "other",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "pubs",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "pubTypeId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "communityId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "valuesBlob",
				dataType: "jsonb",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "parentId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "assigneeId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "title",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "rules",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "event",
				dataType: "Event",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "actionInstanceId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "config",
				dataType: "jsonb",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "sessions",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "userId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "expiresAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "type",
				dataType: "AuthTokenType",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
				comment:
					"With what type of token is this session created? Used for determining on a page-by-page basis whether to allow a certain session to access it. For instance, a verify email token/session should not allow you to access the password reset page.",
			},
		],
	},
	{
		name: "stage_memberships",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "role",
				dataType: "MemberRole",
				dataTypeSchema: "public",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "stageId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "userId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "memberGroupId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
		],
	},
	{
		name: "stages",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "name",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "order",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "communityId",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
	{
		name: "users",
		isView: false,
		schema: "public",
		columns: [
			{
				name: "id",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "slug",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "email",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "firstName",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "avatar",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "createdAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "updatedAt",
				dataType: "timestamp",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "lastName",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "orcid",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
			{
				name: "isSuperAdmin",
				dataType: "bool",
				dataTypeSchema: "pg_catalog",
				isNullable: false,
				isAutoIncrementing: false,
				hasDefaultValue: true,
			},
			{
				name: "passwordHash",
				dataType: "text",
				dataTypeSchema: "pg_catalog",
				isNullable: true,
				isAutoIncrementing: false,
				hasDefaultValue: false,
			},
		],
	},
];
