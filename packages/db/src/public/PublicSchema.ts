// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import type { ActionInstancesTable } from "./ActionInstances";
import type { ActionRunsTable } from "./ActionRuns";
import type { ApiAccessLogsTable } from "./ApiAccessLogs";
import type { ApiAccessPermissionsTable } from "./ApiAccessPermissions";
import type { ApiAccessTokensTable } from "./ApiAccessTokens";
import type { AuthTokensTable } from "./AuthTokens";
import type { CommunitiesTable } from "./Communities";
import type { CommunityMembershipsTable } from "./CommunityMemberships";
import type { FormElementsTable } from "./FormElements";
import type { FormMembershipsTable } from "./FormMemberships";
import type { FormsTable } from "./Forms";
import type { MemberGroupsTable } from "./MemberGroups";
import type { MemberGroupToUserTable } from "./MemberGroupToUser";
import type { MembershipCapabilitiesTable } from "./MembershipCapabilities";
import type { MoveConstraintTable } from "./MoveConstraint";
import type { PrismaMigrationsTable } from "./PrismaMigrations";
import type { PubFieldsTable } from "./PubFields";
import type { PubFieldSchemaTable } from "./PubFieldSchema";
import type { PubFieldToPubTypeTable } from "./PubFieldToPubType";
import type { PubMembershipsTable } from "./PubMemberships";
import type { PubsTable } from "./Pubs";
import type { PubsInStagesTable } from "./PubsInStages";
import type { PubTypesTable } from "./PubTypes";
import type { PubValuesTable } from "./PubValues";
import type { PubValuesHistoryTable } from "./PubValuesHistory";
import type { RulesTable } from "./Rules";
import type { SessionsTable } from "./Sessions";
import type { StageMembershipsTable } from "./StageMemberships";
import type { StagesTable } from "./Stages";
import type { UsersTable } from "./Users";

export interface PublicSchema {
	_prisma_migrations: PrismaMigrationsTable;

	users: UsersTable;

	pubs: PubsTable;

	pub_types: PubTypesTable;

	stages: StagesTable;

	member_groups: MemberGroupsTable;

	communities: CommunitiesTable;

	move_constraint: MoveConstraintTable;

	pub_fields: PubFieldsTable;

	pub_values: PubValuesTable;

	_PubFieldToPubType: PubFieldToPubTypeTable;

	_MemberGroupToUser: MemberGroupToUserTable;

	auth_tokens: AuthTokensTable;

	PubFieldSchema: PubFieldSchemaTable;

	action_instances: ActionInstancesTable;

	PubsInStages: PubsInStagesTable;

	rules: RulesTable;

	action_runs: ActionRunsTable;

	forms: FormsTable;

	api_access_tokens: ApiAccessTokensTable;

	api_access_logs: ApiAccessLogsTable;

	api_access_permissions: ApiAccessPermissionsTable;

	form_elements: FormElementsTable;

	sessions: SessionsTable;

	community_memberships: CommunityMembershipsTable;

	pub_memberships: PubMembershipsTable;

	stage_memberships: StageMembershipsTable;

	form_memberships: FormMembershipsTable;

	membership_capabilities: MembershipCapabilitiesTable;

	pub_values_history: PubValuesHistoryTable;
}
