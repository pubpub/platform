-- migration to convert TEXT id columns to native UUID columns
-- this migration preserves all data by:
-- 1. adding new uuid columns
-- 2. copying data from text columns (casting to uuid)
-- 3. updating foreign key references
-- 4. dropping old columns and constraints
-- 5. renaming new columns
-- disable triggers temporarily to speed up the migration
SET session_replication_role = REPLICA;

-- ============================================================================
-- step 1: add new uuid columns to all tables that have text ids
-- ============================================================================
-- users
ALTER TABLE "users"
  ADD COLUMN "id_new" uuid;

UPDATE
  "users"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "users"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "users"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- communities
ALTER TABLE "communities"
  ADD COLUMN "id_new" uuid;

UPDATE
  "communities"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "communities"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "communities"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- pubs
ALTER TABLE "pubs"
  ADD COLUMN "id_new" uuid;

UPDATE
  "pubs"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "pubs"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "pubs"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- pub_types
ALTER TABLE "pub_types"
  ADD COLUMN "id_new" uuid;

UPDATE
  "pub_types"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "pub_types"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "pub_types"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- pub_fields
ALTER TABLE "pub_fields"
  ADD COLUMN "id_new" uuid;

UPDATE
  "pub_fields"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "pub_fields"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "pub_fields"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- pub_values
ALTER TABLE "pub_values"
  ADD COLUMN "id_new" uuid;

UPDATE
  "pub_values"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "pub_values"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "pub_values"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- stages
ALTER TABLE "stages"
  ADD COLUMN "id_new" uuid;

UPDATE
  "stages"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "stages"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "stages"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- forms
ALTER TABLE "forms"
  ADD COLUMN "id_new" uuid;

UPDATE
  "forms"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "forms"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "forms"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- form_elements
ALTER TABLE "form_elements"
  ADD COLUMN "id_new" uuid;

UPDATE
  "form_elements"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "form_elements"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "form_elements"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- sessions
-- auth_tokens
-- action_instances
ALTER TABLE "action_instances"
  ADD COLUMN "id_new" uuid;

UPDATE
  "action_instances"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "action_instances"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "action_instances"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- action_runs
ALTER TABLE "action_runs"
  ADD COLUMN "id_new" uuid;

UPDATE
  "action_runs"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "action_runs"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "action_runs"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- action_config_defaults
ALTER TABLE "action_config_defaults"
  ADD COLUMN "id_new" uuid;

UPDATE
  "action_config_defaults"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "action_config_defaults"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "action_config_defaults"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- automations
ALTER TABLE "automations"
  ADD COLUMN "id_new" uuid;

UPDATE
  "automations"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "automations"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "automations"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- automation_runs
ALTER TABLE "automation_runs"
  ADD COLUMN "id_new" uuid;

UPDATE
  "automation_runs"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "automation_runs"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "automation_runs"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- automation_triggers
ALTER TABLE "automation_triggers"
  ADD COLUMN "id_new" uuid;

UPDATE
  "automation_triggers"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "automation_triggers"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "automation_triggers"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- automation_condition_blocks
ALTER TABLE "automation_condition_blocks"
  ADD COLUMN "id_new" uuid;

UPDATE
  "automation_condition_blocks"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "automation_condition_blocks"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "automation_condition_blocks"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- automation_conditions
ALTER TABLE "automation_conditions"
  ADD COLUMN "id_new" uuid;

UPDATE
  "automation_conditions"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "automation_conditions"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "automation_conditions"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- api_access_tokens
ALTER TABLE "api_access_tokens"
  ADD COLUMN "id_new" uuid;

UPDATE
  "api_access_tokens"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "api_access_tokens"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "api_access_tokens"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- api_access_permissions
ALTER TABLE "api_access_permissions"
  ADD COLUMN "id_new" uuid;

UPDATE
  "api_access_permissions"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "api_access_permissions"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "api_access_permissions"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- api_access_logs
ALTER TABLE "api_access_logs"
  ADD COLUMN "id_new" uuid;

UPDATE
  "api_access_logs"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "api_access_logs"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "api_access_logs"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- invites
ALTER TABLE "invites"
  ADD COLUMN "id_new" uuid;

UPDATE
  "invites"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "invites"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "invites"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- PubFieldSchema
ALTER TABLE "PubFieldSchema"
  ADD COLUMN "id_new" uuid;

UPDATE
  "PubFieldSchema"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "PubFieldSchema"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "PubFieldSchema"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- member_groups
ALTER TABLE "member_groups"
  ADD COLUMN "id_new" uuid;

UPDATE
  "member_groups"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "member_groups"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "member_groups"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- community_memberships
ALTER TABLE "community_memberships"
  ADD COLUMN "id_new" uuid;

UPDATE
  "community_memberships"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "community_memberships"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "community_memberships"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- stage_memberships
ALTER TABLE "stage_memberships"
  ADD COLUMN "id_new" uuid;

UPDATE
  "stage_memberships"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "stage_memberships"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "stage_memberships"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- pub_memberships
ALTER TABLE "pub_memberships"
  ADD COLUMN "id_new" uuid;

UPDATE
  "pub_memberships"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "pub_memberships"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "pub_memberships"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- pub_values_history
ALTER TABLE "pub_values_history"
  ADD COLUMN "id_new" uuid;

UPDATE
  "pub_values_history"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "pub_values_history"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "pub_values_history"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- invites_history
ALTER TABLE "invites_history"
  ADD COLUMN "id_new" uuid;

UPDATE
  "invites_history"
SET
  "id_new" = "id"::uuid;

ALTER TABLE "invites_history"
  ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "invites_history"
  ALTER COLUMN "id_new" SET DEFAULT gen_random_uuid();

-- ============================================================================
-- step 2: add new uuid foreign key columns and populate them
-- ============================================================================
-- sessions.userId
ALTER TABLE "sessions"
  ADD COLUMN "userId_new" uuid;

UPDATE
  "sessions"
SET
  "userId_new" = "userId"::uuid;

ALTER TABLE "sessions"
  ALTER COLUMN "userId_new" SET NOT NULL;

-- auth_tokens.userId
ALTER TABLE "auth_tokens"
  ADD COLUMN "userId_new" uuid;

UPDATE
  "auth_tokens"
SET
  "userId_new" = "userId"::uuid;

ALTER TABLE "auth_tokens"
  ALTER COLUMN "userId_new" SET NOT NULL;

-- pubs.pubTypeId
ALTER TABLE "pubs"
  ADD COLUMN "pubTypeId_new" uuid;

UPDATE
  "pubs"
SET
  "pubTypeId_new" = "pubTypeId"::uuid;

ALTER TABLE "pubs"
  ALTER COLUMN "pubTypeId_new" SET NOT NULL;

-- pubs.communityId
ALTER TABLE "pubs"
  ADD COLUMN "communityId_new" uuid;

UPDATE
  "pubs"
SET
  "communityId_new" = "communityId"::uuid;

ALTER TABLE "pubs"
  ALTER COLUMN "communityId_new" SET NOT NULL;

-- pub_fields.communityId
ALTER TABLE "pub_fields"
  ADD COLUMN "communityId_new" uuid;

UPDATE
  "pub_fields"
SET
  "communityId_new" = "communityId"::uuid;

ALTER TABLE "pub_fields"
  ALTER COLUMN "communityId_new" SET NOT NULL;

-- pub_fields.pubFieldSchemaId
ALTER TABLE "pub_fields"
  ADD COLUMN "pubFieldSchemaId_new" uuid;

UPDATE
  "pub_fields"
SET
  "pubFieldSchemaId_new" = "pubFieldSchemaId"::uuid
WHERE
  "pubFieldSchemaId" IS NOT NULL;

-- pub_values.fieldId
ALTER TABLE "pub_values"
  ADD COLUMN "fieldId_new" uuid;

UPDATE
  "pub_values"
SET
  "fieldId_new" = "fieldId"::uuid;

ALTER TABLE "pub_values"
  ALTER COLUMN "fieldId_new" SET NOT NULL;

-- pub_values.pubId
ALTER TABLE "pub_values"
  ADD COLUMN "pubId_new" uuid;

UPDATE
  "pub_values"
SET
  "pubId_new" = "pubId"::uuid;

ALTER TABLE "pub_values"
  ALTER COLUMN "pubId_new" SET NOT NULL;

-- pub_values.relatedPubId
ALTER TABLE "pub_values"
  ADD COLUMN "relatedPubId_new" uuid;

UPDATE
  "pub_values"
SET
  "relatedPubId_new" = "relatedPubId"::uuid
WHERE
  "relatedPubId" IS NOT NULL;

-- pub_types.communityId
ALTER TABLE "pub_types"
  ADD COLUMN "communityId_new" uuid;

UPDATE
  "pub_types"
SET
  "communityId_new" = "communityId"::uuid;

ALTER TABLE "pub_types"
  ALTER COLUMN "communityId_new" SET NOT NULL;

-- stages.communityId
ALTER TABLE "stages"
  ADD COLUMN "communityId_new" uuid;

UPDATE
  "stages"
SET
  "communityId_new" = "communityId"::uuid;

ALTER TABLE "stages"
  ALTER COLUMN "communityId_new" SET NOT NULL;

-- PubsInStages.pubId and stageId
ALTER TABLE "PubsInStages"
  ADD COLUMN "pubId_new" uuid;

ALTER TABLE "PubsInStages"
  ADD COLUMN "stageId_new" uuid;

UPDATE
  "PubsInStages"
SET
  "pubId_new" = "pubId"::uuid,
  "stageId_new" = "stageId"::uuid;

ALTER TABLE "PubsInStages"
  ALTER COLUMN "pubId_new" SET NOT NULL;

ALTER TABLE "PubsInStages"
  ALTER COLUMN "stageId_new" SET NOT NULL;

-- move_constraint.stageId and destinationId
ALTER TABLE "move_constraint"
  ADD COLUMN "stageId_new" uuid;

ALTER TABLE "move_constraint"
  ADD COLUMN "destinationId_new" uuid;

UPDATE
  "move_constraint"
SET
  "stageId_new" = "stageId"::uuid,
  "destinationId_new" = "destinationId"::uuid;

ALTER TABLE "move_constraint"
  ALTER COLUMN "stageId_new" SET NOT NULL;

ALTER TABLE "move_constraint"
  ALTER COLUMN "destinationId_new" SET NOT NULL;

-- action_instances.automationId
ALTER TABLE "action_instances"
  ADD COLUMN "automationId_new" uuid;

UPDATE
  "action_instances"
SET
  "automationId_new" = "automationId"::uuid;

ALTER TABLE "action_instances"
  ALTER COLUMN "automationId_new" SET NOT NULL;

-- action_runs.actionInstanceId
ALTER TABLE "action_runs"
  ADD COLUMN "actionInstanceId_new" uuid;

UPDATE
  "action_runs"
SET
  "actionInstanceId_new" = "actionInstanceId"::uuid
WHERE
  "actionInstanceId" IS NOT NULL;

-- action_runs.automationRunId
ALTER TABLE "action_runs"
  ADD COLUMN "automationRunId_new" uuid;

UPDATE
  "action_runs"
SET
  "automationRunId_new" = "automationRunId"::uuid
WHERE
  "automationRunId" IS NOT NULL;

-- action_runs.pubId
ALTER TABLE "action_runs"
  ADD COLUMN "pubId_new" uuid;

UPDATE
  "action_runs"
SET
  "pubId_new" = "pubId"::uuid
WHERE
  "pubId" IS NOT NULL;

-- action_runs.userId
ALTER TABLE "action_runs"
  ADD COLUMN "userId_new" uuid;

UPDATE
  "action_runs"
SET
  "userId_new" = "userId"::uuid
WHERE
  "userId" IS NOT NULL;

-- action_config_defaults.communityId
ALTER TABLE "action_config_defaults"
  ADD COLUMN "communityId_new" uuid;

UPDATE
  "action_config_defaults"
SET
  "communityId_new" = "communityId"::uuid;

ALTER TABLE "action_config_defaults"
  ALTER COLUMN "communityId_new" SET NOT NULL;

-- automations.stageId
ALTER TABLE "automations"
  ADD COLUMN "stageId_new" uuid;

UPDATE
  "automations"
SET
  "stageId_new" = "stageId"::uuid
WHERE
  "stageId" IS NOT NULL;

-- automations.communityId
ALTER TABLE "automations"
  ADD COLUMN "communityId_new" uuid;

UPDATE
  "automations"
SET
  "communityId_new" = "communityId"::uuid;

ALTER TABLE "automations"
  ALTER COLUMN "communityId_new" SET NOT NULL;

-- automation_runs.automationId
ALTER TABLE "automation_runs"
  ADD COLUMN "automationId_new" uuid;

UPDATE
  "automation_runs"
SET
  "automationId_new" = "automationId"::uuid;

ALTER TABLE "automation_runs"
  ALTER COLUMN "automationId_new" SET NOT NULL;

-- automation_runs.sourceUserId
ALTER TABLE "automation_runs"
  ADD COLUMN "sourceUserId_new" uuid;

UPDATE
  "automation_runs"
SET
  "sourceUserId_new" = "sourceUserId"::uuid
WHERE
  "sourceUserId" IS NOT NULL;

-- automation_runs.inputPubId
ALTER TABLE "automation_runs"
  ADD COLUMN "inputPubId_new" uuid;

UPDATE
  "automation_runs"
SET
  "inputPubId_new" = "inputPubId"::uuid
WHERE
  "inputPubId" IS NOT NULL;

-- automation_runs.sourceAutomationRunId
ALTER TABLE "automation_runs"
  ADD COLUMN "sourceAutomationRunId_new" uuid;

UPDATE
  "automation_runs"
SET
  "sourceAutomationRunId_new" = "sourceAutomationRunId"::uuid
WHERE
  "sourceAutomationRunId" IS NOT NULL;

-- automation_triggers.automationId
ALTER TABLE "automation_triggers"
  ADD COLUMN "automationId_new" uuid;

UPDATE
  "automation_triggers"
SET
  "automationId_new" = "automationId"::uuid;

ALTER TABLE "automation_triggers"
  ALTER COLUMN "automationId_new" SET NOT NULL;

-- automation_triggers.sourceAutomationId
ALTER TABLE "automation_triggers"
  ADD COLUMN "sourceAutomationId_new" uuid;

UPDATE
  "automation_triggers"
SET
  "sourceAutomationId_new" = "sourceAutomationId"::uuid
WHERE
  "sourceAutomationId" IS NOT NULL;

-- automation_condition_blocks.automationConditionBlockId
ALTER TABLE "automation_condition_blocks"
  ADD COLUMN "automationConditionBlockId_new" uuid;

UPDATE
  "automation_condition_blocks"
SET
  "automationConditionBlockId_new" = "automationConditionBlockId"::uuid
WHERE
  "automationConditionBlockId" IS NOT NULL;

-- automation_condition_blocks.automationId
ALTER TABLE "automation_condition_blocks"
  ADD COLUMN "automationId_new" uuid;

UPDATE
  "automation_condition_blocks"
SET
  "automationId_new" = "automationId"::uuid;

ALTER TABLE "automation_condition_blocks"
  ALTER COLUMN "automationId_new" SET NOT NULL;

-- automation_conditions.automationConditionBlockId
ALTER TABLE "automation_conditions"
  ADD COLUMN "automationConditionBlockId_new" uuid;

UPDATE
  "automation_conditions"
SET
  "automationConditionBlockId_new" = "automationConditionBlockId"::uuid;

ALTER TABLE "automation_conditions"
  ALTER COLUMN "automationConditionBlockId_new" SET NOT NULL;

-- forms.communityId
ALTER TABLE "forms"
  ADD COLUMN "communityId_new" uuid;

UPDATE
  "forms"
SET
  "communityId_new" = "communityId"::uuid;

ALTER TABLE "forms"
  ALTER COLUMN "communityId_new" SET NOT NULL;

-- forms.pubTypeId
ALTER TABLE "forms"
  ADD COLUMN "pubTypeId_new" uuid;

UPDATE
  "forms"
SET
  "pubTypeId_new" = "pubTypeId"::uuid;

ALTER TABLE "forms"
  ALTER COLUMN "pubTypeId_new" SET NOT NULL;

-- form_elements.fieldId
ALTER TABLE "form_elements"
  ADD COLUMN "fieldId_new" uuid;

UPDATE
  "form_elements"
SET
  "fieldId_new" = "fieldId"::uuid
WHERE
  "fieldId" IS NOT NULL;

-- form_elements.formId
ALTER TABLE "form_elements"
  ADD COLUMN "formId_new" uuid;

UPDATE
  "form_elements"
SET
  "formId_new" = "formId"::uuid;

ALTER TABLE "form_elements"
  ALTER COLUMN "formId_new" SET NOT NULL;

-- form_elements.stageId
ALTER TABLE "form_elements"
  ADD COLUMN "stageId_new" uuid;

UPDATE
  "form_elements"
SET
  "stageId_new" = "stageId"::uuid
WHERE
  "stageId" IS NOT NULL;

-- api_access_tokens.communityId
ALTER TABLE "api_access_tokens"
  ADD COLUMN "communityId_new" uuid;

UPDATE
  "api_access_tokens"
SET
  "communityId_new" = "communityId"::uuid;

ALTER TABLE "api_access_tokens"
  ALTER COLUMN "communityId_new" SET NOT NULL;

-- api_access_tokens.issuedById
ALTER TABLE "api_access_tokens"
  ADD COLUMN "issuedById_new" uuid;

UPDATE
  "api_access_tokens"
SET
  "issuedById_new" = "issuedById"::uuid
WHERE
  "issuedById" IS NOT NULL;

-- api_access_permissions.apiAccessTokenId
ALTER TABLE "api_access_permissions"
  ADD COLUMN "apiAccessTokenId_new" uuid;

UPDATE
  "api_access_permissions"
SET
  "apiAccessTokenId_new" = "apiAccessTokenId"::uuid;

ALTER TABLE "api_access_permissions"
  ALTER COLUMN "apiAccessTokenId_new" SET NOT NULL;

-- api_access_logs.accessTokenId
ALTER TABLE "api_access_logs"
  ADD COLUMN "accessTokenId_new" uuid;

UPDATE
  "api_access_logs"
SET
  "accessTokenId_new" = "accessTokenId"::uuid
WHERE
  "accessTokenId" IS NOT NULL;

-- invites.userId
ALTER TABLE "invites"
  ADD COLUMN "userId_new" uuid;

UPDATE
  "invites"
SET
  "userId_new" = "userId"::uuid;

ALTER TABLE "invites"
  ALTER COLUMN "userId_new" SET NOT NULL;

-- invites.communityId
ALTER TABLE "invites"
  ADD COLUMN "communityId_new" uuid;

UPDATE
  "invites"
SET
  "communityId_new" = "communityId"::uuid;

ALTER TABLE "invites"
  ALTER COLUMN "communityId_new" SET NOT NULL;

-- invites.pubId
ALTER TABLE "invites"
  ADD COLUMN "pubId_new" uuid;

UPDATE
  "invites"
SET
  "pubId_new" = "pubId"::uuid
WHERE
  "pubId" IS NOT NULL;

-- invites.stageId
ALTER TABLE "invites"
  ADD COLUMN "stageId_new" uuid;

UPDATE
  "invites"
SET
  "stageId_new" = "stageId"::uuid
WHERE
  "stageId" IS NOT NULL;

-- invites.invitedByUserId
ALTER TABLE "invites"
  ADD COLUMN "invitedByUserId_new" uuid;

UPDATE
  "invites"
SET
  "invitedByUserId_new" = "invitedByUserId"::uuid
WHERE
  "invitedByUserId" IS NOT NULL;

-- invites.invitedByActionRunId
ALTER TABLE "invites"
  ADD COLUMN "invitedByActionRunId_new" uuid;

UPDATE
  "invites"
SET
  "invitedByActionRunId_new" = "invitedByActionRunId"::uuid
WHERE
  "invitedByActionRunId" IS NOT NULL;

-- invite_forms.inviteId
ALTER TABLE "invite_forms"
  ADD COLUMN "inviteId_new" uuid;

UPDATE
  "invite_forms"
SET
  "inviteId_new" = "inviteId"::uuid;

ALTER TABLE "invite_forms"
  ALTER COLUMN "inviteId_new" SET NOT NULL;

-- invite_forms.formId
ALTER TABLE "invite_forms"
  ADD COLUMN "formId_new" uuid;

UPDATE
  "invite_forms"
SET
  "formId_new" = "formId"::uuid;

ALTER TABLE "invite_forms"
  ALTER COLUMN "formId_new" SET NOT NULL;

-- member_groups.communityId
ALTER TABLE "member_groups"
  ADD COLUMN "communityId_new" uuid;

UPDATE
  "member_groups"
SET
  "communityId_new" = "communityId"::uuid;

ALTER TABLE "member_groups"
  ALTER COLUMN "communityId_new" SET NOT NULL;

-- _MemberGroupToUser.A and B
ALTER TABLE "_MemberGroupToUser"
  ADD COLUMN "A_new" uuid;

ALTER TABLE "_MemberGroupToUser"
  ADD COLUMN "B_new" uuid;

UPDATE
  "_MemberGroupToUser"
SET
  "A_new" = "A"::uuid,
  "B_new" = "B"::uuid;

ALTER TABLE "_MemberGroupToUser"
  ALTER COLUMN "A_new" SET NOT NULL;

ALTER TABLE "_MemberGroupToUser"
  ALTER COLUMN "B_new" SET NOT NULL;

-- _PubFieldToPubType.A and B
ALTER TABLE "_PubFieldToPubType"
  ADD COLUMN "A_new" uuid;

ALTER TABLE "_PubFieldToPubType"
  ADD COLUMN "B_new" uuid;

UPDATE
  "_PubFieldToPubType"
SET
  "A_new" = "A"::uuid,
  "B_new" = "B"::uuid;

ALTER TABLE "_PubFieldToPubType"
  ALTER COLUMN "A_new" SET NOT NULL;

ALTER TABLE "_PubFieldToPubType"
  ALTER COLUMN "B_new" SET NOT NULL;

-- _FormElementToPubType.A and B
ALTER TABLE "_FormElementToPubType"
  ADD COLUMN "A_new" uuid;

ALTER TABLE "_FormElementToPubType"
  ADD COLUMN "B_new" uuid;

UPDATE
  "_FormElementToPubType"
SET
  "A_new" = "A"::uuid,
  "B_new" = "B"::uuid;

ALTER TABLE "_FormElementToPubType"
  ALTER COLUMN "A_new" SET NOT NULL;

ALTER TABLE "_FormElementToPubType"
  ALTER COLUMN "B_new" SET NOT NULL;

-- community_memberships.userId (nullable - either userId or memberGroupId is set)
ALTER TABLE "community_memberships"
  ADD COLUMN "userId_new" uuid;

UPDATE
  "community_memberships"
SET
  "userId_new" = "userId"::uuid
WHERE
  "userId" IS NOT NULL;

-- community_memberships.communityId
ALTER TABLE "community_memberships"
  ADD COLUMN "communityId_new" uuid;

UPDATE
  "community_memberships"
SET
  "communityId_new" = "communityId"::uuid;

ALTER TABLE "community_memberships"
  ALTER COLUMN "communityId_new" SET NOT NULL;

-- community_memberships.memberGroupId
ALTER TABLE "community_memberships"
  ADD COLUMN "memberGroupId_new" uuid;

UPDATE
  "community_memberships"
SET
  "memberGroupId_new" = "memberGroupId"::uuid
WHERE
  "memberGroupId" IS NOT NULL;

-- community_memberships.formId
ALTER TABLE "community_memberships"
  ADD COLUMN "formId_new" uuid;

UPDATE
  "community_memberships"
SET
  "formId_new" = "formId"::uuid
WHERE
  "formId" IS NOT NULL;

-- stage_memberships.userId (nullable - either userId or memberGroupId is set)
ALTER TABLE "stage_memberships"
  ADD COLUMN "userId_new" uuid;

UPDATE
  "stage_memberships"
SET
  "userId_new" = "userId"::uuid
WHERE
  "userId" IS NOT NULL;

-- stage_memberships.stageId
ALTER TABLE "stage_memberships"
  ADD COLUMN "stageId_new" uuid;

UPDATE
  "stage_memberships"
SET
  "stageId_new" = "stageId"::uuid;

ALTER TABLE "stage_memberships"
  ALTER COLUMN "stageId_new" SET NOT NULL;

-- stage_memberships.memberGroupId
ALTER TABLE "stage_memberships"
  ADD COLUMN "memberGroupId_new" uuid;

UPDATE
  "stage_memberships"
SET
  "memberGroupId_new" = "memberGroupId"::uuid
WHERE
  "memberGroupId" IS NOT NULL;

-- stage_memberships.formId
ALTER TABLE "stage_memberships"
  ADD COLUMN "formId_new" uuid;

UPDATE
  "stage_memberships"
SET
  "formId_new" = "formId"::uuid
WHERE
  "formId" IS NOT NULL;

-- pub_memberships.userId (nullable - either userId or memberGroupId is set)
ALTER TABLE "pub_memberships"
  ADD COLUMN "userId_new" uuid;

UPDATE
  "pub_memberships"
SET
  "userId_new" = "userId"::uuid
WHERE
  "userId" IS NOT NULL;

-- pub_memberships.pubId
ALTER TABLE "pub_memberships"
  ADD COLUMN "pubId_new" uuid;

UPDATE
  "pub_memberships"
SET
  "pubId_new" = "pubId"::uuid;

ALTER TABLE "pub_memberships"
  ALTER COLUMN "pubId_new" SET NOT NULL;

-- pub_memberships.memberGroupId
ALTER TABLE "pub_memberships"
  ADD COLUMN "memberGroupId_new" uuid;

UPDATE
  "pub_memberships"
SET
  "memberGroupId_new" = "memberGroupId"::uuid
WHERE
  "memberGroupId" IS NOT NULL;

-- pub_memberships.formId
ALTER TABLE "pub_memberships"
  ADD COLUMN "formId_new" uuid;

UPDATE
  "pub_memberships"
SET
  "formId_new" = "formId"::uuid
WHERE
  "formId" IS NOT NULL;

-- pub_values_history foreign keys (pubValueId is not a FK, just stores the id)
ALTER TABLE "pub_values_history"
  ADD COLUMN "pubValueId_new" uuid;

ALTER TABLE "pub_values_history"
  ADD COLUMN "userId_new" uuid;

ALTER TABLE "pub_values_history"
  ADD COLUMN "apiAccessTokenId_new" uuid;

ALTER TABLE "pub_values_history"
  ADD COLUMN "actionRunId_new" uuid;

UPDATE
  "pub_values_history"
SET
  "pubValueId_new" = "pubValueId"::uuid
WHERE
  "pubValueId" IS NOT NULL;

UPDATE
  "pub_values_history"
SET
  "userId_new" = "userId"::uuid
WHERE
  "userId" IS NOT NULL;

UPDATE
  "pub_values_history"
SET
  "apiAccessTokenId_new" = "apiAccessTokenId"::uuid
WHERE
  "apiAccessTokenId" IS NOT NULL;

UPDATE
  "pub_values_history"
SET
  "actionRunId_new" = "actionRunId"::uuid
WHERE
  "actionRunId" IS NOT NULL;

-- invites_history foreign keys (inviteId is not a FK, just stores the id)
ALTER TABLE "invites_history"
  ADD COLUMN "inviteId_new" uuid;

ALTER TABLE "invites_history"
  ADD COLUMN "userId_new" uuid;

ALTER TABLE "invites_history"
  ADD COLUMN "apiAccessTokenId_new" uuid;

ALTER TABLE "invites_history"
  ADD COLUMN "actionRunId_new" uuid;

UPDATE
  "invites_history"
SET
  "inviteId_new" = "inviteId"::uuid
WHERE
  "inviteId" IS NOT NULL;

UPDATE
  "invites_history"
SET
  "userId_new" = "userId"::uuid
WHERE
  "userId" IS NOT NULL;

UPDATE
  "invites_history"
SET
  "apiAccessTokenId_new" = "apiAccessTokenId"::uuid
WHERE
  "apiAccessTokenId" IS NOT NULL;

UPDATE
  "invites_history"
SET
  "actionRunId_new" = "actionRunId"::uuid
WHERE
  "actionRunId" IS NOT NULL;

-- ============================================================================
-- step 3: drop all foreign key constraints
-- ============================================================================
ALTER TABLE "sessions"
  DROP CONSTRAINT IF EXISTS "sessions_userId_fkey";

ALTER TABLE "auth_tokens"
  DROP CONSTRAINT IF EXISTS "auth_tokens_userId_fkey";

ALTER TABLE "pubs"
  DROP CONSTRAINT IF EXISTS "pubs_pubTypeId_fkey";

ALTER TABLE "pubs"
  DROP CONSTRAINT IF EXISTS "pubs_communityId_fkey";

ALTER TABLE "pub_fields"
  DROP CONSTRAINT IF EXISTS "pub_fields_communityId_fkey";

ALTER TABLE "pub_fields"
  DROP CONSTRAINT IF EXISTS "pub_fields_pubFieldSchemaId_fkey";

ALTER TABLE "pub_values"
  DROP CONSTRAINT IF EXISTS "pub_values_fieldId_fkey";

ALTER TABLE "pub_values"
  DROP CONSTRAINT IF EXISTS "pub_values_pubId_fkey";

ALTER TABLE "pub_values"
  DROP CONSTRAINT IF EXISTS "pub_values_relatedPubId_fkey";

ALTER TABLE "pub_types"
  DROP CONSTRAINT IF EXISTS "pub_types_communityId_fkey";

ALTER TABLE "stages"
  DROP CONSTRAINT IF EXISTS "stages_communityId_fkey";

ALTER TABLE "PubsInStages"
  DROP CONSTRAINT IF EXISTS "PubsInStages_pubId_fkey";

ALTER TABLE "PubsInStages"
  DROP CONSTRAINT IF EXISTS "PubsInStages_stageId_fkey";

ALTER TABLE "move_constraint"
  DROP CONSTRAINT IF EXISTS "move_constraint_stageId_fkey";

ALTER TABLE "move_constraint"
  DROP CONSTRAINT IF EXISTS "move_constraint_destinationId_fkey";

ALTER TABLE "action_instances"
  DROP CONSTRAINT IF EXISTS "action_instances_automationId_fkey";

ALTER TABLE "action_runs"
  DROP CONSTRAINT IF EXISTS "action_runs_actionInstanceId_fkey";

ALTER TABLE "action_runs"
  DROP CONSTRAINT IF EXISTS "action_runs_automationRunId_fkey";

ALTER TABLE "action_runs"
  DROP CONSTRAINT IF EXISTS "action_runs_pubId_fkey";

ALTER TABLE "action_runs"
  DROP CONSTRAINT IF EXISTS "action_runs_userId_fkey";

ALTER TABLE "action_config_defaults"
  DROP CONSTRAINT IF EXISTS "action_config_defaults_communityId_fkey";

ALTER TABLE "automations"
  DROP CONSTRAINT IF EXISTS "automations_stageId_fkey";

ALTER TABLE "automations"
  DROP CONSTRAINT IF EXISTS "automations_communityId_fkey";

ALTER TABLE "automation_runs"
  DROP CONSTRAINT IF EXISTS "automation_runs_automationId_fkey";

ALTER TABLE "automation_runs"
  DROP CONSTRAINT IF EXISTS "automation_runs_sourceUserId_fkey";

ALTER TABLE "automation_runs"
  DROP CONSTRAINT IF EXISTS "automation_runs_inputPubId_fkey";

ALTER TABLE "automation_runs"
  DROP CONSTRAINT IF EXISTS "automation_runs_sourceAutomationRunId_fkey";

ALTER TABLE "automation_triggers"
  DROP CONSTRAINT IF EXISTS "automation_triggers_automationId_fkey";

ALTER TABLE "automation_triggers"
  DROP CONSTRAINT IF EXISTS "automation_triggers_sourceAutomationId_fkey";

ALTER TABLE "automation_condition_blocks"
  DROP CONSTRAINT IF EXISTS "automation_condition_blocks_automationConditionBlockId_fkey";

ALTER TABLE "automation_condition_blocks"
  DROP CONSTRAINT IF EXISTS "automation_condition_blocks_automationId_fkey";

ALTER TABLE "automation_conditions"
  DROP CONSTRAINT IF EXISTS "automation_conditions_automationConditionBlockId_fkey";

ALTER TABLE "forms"
  DROP CONSTRAINT IF EXISTS "forms_communityId_fkey";

ALTER TABLE "forms"
  DROP CONSTRAINT IF EXISTS "forms_pubTypeId_fkey";

ALTER TABLE "form_elements"
  DROP CONSTRAINT IF EXISTS "form_elements_fieldId_fkey";

ALTER TABLE "form_elements"
  DROP CONSTRAINT IF EXISTS "form_elements_formId_fkey";

ALTER TABLE "form_elements"
  DROP CONSTRAINT IF EXISTS "form_elements_stageId_fkey";

ALTER TABLE "api_access_tokens"
  DROP CONSTRAINT IF EXISTS "api_access_tokens_communityId_fkey";

ALTER TABLE "api_access_tokens"
  DROP CONSTRAINT IF EXISTS "api_access_tokens_issuedById_fkey";

ALTER TABLE "api_access_permissions"
  DROP CONSTRAINT IF EXISTS "api_access_permissions_apiAccessTokenId_fkey";

ALTER TABLE "api_access_logs"
  DROP CONSTRAINT IF EXISTS "api_access_logs_accessTokenId_fkey";

ALTER TABLE "invites"
  DROP CONSTRAINT IF EXISTS "invites_userId_fkey";

ALTER TABLE "invites"
  DROP CONSTRAINT IF EXISTS "invites_communityId_fkey";

ALTER TABLE "invites"
  DROP CONSTRAINT IF EXISTS "invites_pubId_fkey";

ALTER TABLE "invites"
  DROP CONSTRAINT IF EXISTS "invites_stageId_fkey";

ALTER TABLE "invites"
  DROP CONSTRAINT IF EXISTS "invites_invitedByUserId_fkey";

ALTER TABLE "invites"
  DROP CONSTRAINT IF EXISTS "invites_invitedByActionRunId_fkey";

ALTER TABLE "invite_forms"
  DROP CONSTRAINT IF EXISTS "invite_forms_inviteId_fkey";

ALTER TABLE "invite_forms"
  DROP CONSTRAINT IF EXISTS "invite_forms_formId_fkey";

ALTER TABLE "member_groups"
  DROP CONSTRAINT IF EXISTS "member_groups_communityId_fkey";

ALTER TABLE "_MemberGroupToUser"
  DROP CONSTRAINT IF EXISTS "_MemberGroupToUser_A_fkey";

ALTER TABLE "_MemberGroupToUser"
  DROP CONSTRAINT IF EXISTS "_MemberGroupToUser_B_fkey";

ALTER TABLE "_PubFieldToPubType"
  DROP CONSTRAINT IF EXISTS "_PubFieldToPubType_A_fkey";

ALTER TABLE "_PubFieldToPubType"
  DROP CONSTRAINT IF EXISTS "_PubFieldToPubType_B_fkey";

ALTER TABLE "_FormElementToPubType"
  DROP CONSTRAINT IF EXISTS "_FormElementToPubType_A_fkey";

ALTER TABLE "_FormElementToPubType"
  DROP CONSTRAINT IF EXISTS "_FormElementToPubType_B_fkey";

ALTER TABLE "community_memberships"
  DROP CONSTRAINT IF EXISTS "community_memberships_userId_fkey";

ALTER TABLE "community_memberships"
  DROP CONSTRAINT IF EXISTS "community_memberships_communityId_fkey";

ALTER TABLE "community_memberships"
  DROP CONSTRAINT IF EXISTS "community_memberships_memberGroupId_fkey";

ALTER TABLE "community_memberships"
  DROP CONSTRAINT IF EXISTS "community_memberships_formId_fkey";

ALTER TABLE "stage_memberships"
  DROP CONSTRAINT IF EXISTS "stage_memberships_userId_fkey";

ALTER TABLE "stage_memberships"
  DROP CONSTRAINT IF EXISTS "stage_memberships_stageId_fkey";

ALTER TABLE "stage_memberships"
  DROP CONSTRAINT IF EXISTS "stage_memberships_memberGroupId_fkey";

ALTER TABLE "stage_memberships"
  DROP CONSTRAINT IF EXISTS "stage_memberships_formId_fkey";

ALTER TABLE "pub_memberships"
  DROP CONSTRAINT IF EXISTS "pub_memberships_userId_fkey";

ALTER TABLE "pub_memberships"
  DROP CONSTRAINT IF EXISTS "pub_memberships_pubId_fkey";

ALTER TABLE "pub_memberships"
  DROP CONSTRAINT IF EXISTS "pub_memberships_memberGroupId_fkey";

ALTER TABLE "pub_memberships"
  DROP CONSTRAINT IF EXISTS "pub_memberships_formId_fkey";

ALTER TABLE "pub_values_history"
  DROP CONSTRAINT IF EXISTS "pub_values_history_userId_fkey";

ALTER TABLE "pub_values_history"
  DROP CONSTRAINT IF EXISTS "pub_values_history_apiAccessTokenId_fkey";

ALTER TABLE "pub_values_history"
  DROP CONSTRAINT IF EXISTS "pub_values_history_actionRunId_fkey";

ALTER TABLE "invites_history"
  DROP CONSTRAINT IF EXISTS "invites_history_userId_fkey";

ALTER TABLE "invites_history"
  DROP CONSTRAINT IF EXISTS "invites_history_apiAccessTokenId_fkey";

ALTER TABLE "invites_history"
  DROP CONSTRAINT IF EXISTS "invites_history_actionRunId_fkey";

-- ============================================================================
-- step 4: drop primary key constraints
-- ============================================================================
ALTER TABLE "users"
  DROP CONSTRAINT "users_pkey";

ALTER TABLE "communities"
  DROP CONSTRAINT "communities_pkey";

ALTER TABLE "pubs"
  DROP CONSTRAINT "pubs_pkey";

ALTER TABLE "pub_types"
  DROP CONSTRAINT "pub_types_pkey";

ALTER TABLE "pub_fields"
  DROP CONSTRAINT "pub_fields_pkey";

ALTER TABLE "pub_values"
  DROP CONSTRAINT "pub_values_pkey";

ALTER TABLE "stages"
  DROP CONSTRAINT "stages_pkey";

ALTER TABLE "forms"
  DROP CONSTRAINT "forms_pkey";

ALTER TABLE "form_elements"
  DROP CONSTRAINT "form_elements_pkey";

ALTER TABLE "action_instances"
  DROP CONSTRAINT "action_instances_pkey";

ALTER TABLE "action_runs"
  DROP CONSTRAINT "action_runs_pkey";

ALTER TABLE "action_config_defaults"
  DROP CONSTRAINT "action_config_defaults_pkey";

ALTER TABLE "automations"
  DROP CONSTRAINT "automations_pkey";

ALTER TABLE "automation_runs"
  DROP CONSTRAINT "automation_runs_pkey";

ALTER TABLE "automation_triggers"
  DROP CONSTRAINT "automation_triggers_pkey";

ALTER TABLE "automation_condition_blocks"
  DROP CONSTRAINT "automation_condition_blocks_pkey";

ALTER TABLE "automation_conditions"
  DROP CONSTRAINT "automation_conditions_pkey";

ALTER TABLE "api_access_tokens"
  DROP CONSTRAINT "api_access_tokens_pkey";

ALTER TABLE "api_access_permissions"
  DROP CONSTRAINT "api_access_permissions_pkey";

ALTER TABLE "api_access_logs"
  DROP CONSTRAINT "api_access_logs_pkey";

ALTER TABLE "invites"
  DROP CONSTRAINT "invites_pkey";

ALTER TABLE "PubFieldSchema"
  DROP CONSTRAINT "PubFieldSchema_pkey";

ALTER TABLE "member_groups"
  DROP CONSTRAINT "member_groups_pkey";

ALTER TABLE "community_memberships"
  DROP CONSTRAINT "community_memberships_pkey";

ALTER TABLE "stage_memberships"
  DROP CONSTRAINT "stage_memberships_pkey";

ALTER TABLE "pub_memberships"
  DROP CONSTRAINT "pub_memberships_pkey";

ALTER TABLE "pub_values_history"
  DROP CONSTRAINT "pub_values_history_pkey";

ALTER TABLE "invites_history"
  DROP CONSTRAINT "invites_history_pkey";

-- drop composite primary keys
ALTER TABLE "PubsInStages"
  DROP CONSTRAINT "PubsInStages_pkey";

ALTER TABLE "move_constraint"
  DROP CONSTRAINT "move_constraint_pkey";

ALTER TABLE "invite_forms"
  DROP CONSTRAINT "invite_forms_pkey";

-- drop unique constraints on join tables
DROP INDEX IF EXISTS "_MemberGroupToUser_AB_unique";

DROP INDEX IF EXISTS "_MemberGroupToUser_B_index";

DROP INDEX IF EXISTS "_PubFieldToPubType_AB_unique";

DROP INDEX IF EXISTS "_PubFieldToPubType_B_index";

DROP INDEX IF EXISTS "_FormElementToPubType_AB_unique";

DROP INDEX IF EXISTS "_FormElementToPubType_B_index";

-- drop unique constraints that reference old columns
DROP INDEX IF EXISTS "form_elements_type_label_formId_key";

DROP INDEX IF EXISTS "form_elements_fieldId_formId_key";

DROP INDEX IF EXISTS "invite_forms_inviteId_formId_type_key";

DROP INDEX IF EXISTS "community_memberships_userId_communityId_key";

DROP INDEX IF EXISTS "stage_memberships_userId_stageId_key";

DROP INDEX IF EXISTS "pub_memberships_userId_pubId_key";

-- ============================================================================
-- step 5: drop old columns
-- ============================================================================
-- primary key columns
ALTER TABLE "users"
  DROP COLUMN "id";

ALTER TABLE "communities"
  DROP COLUMN "id";

ALTER TABLE "pubs"
  DROP COLUMN "id";

ALTER TABLE "pub_types"
  DROP COLUMN "id";

ALTER TABLE "pub_fields"
  DROP COLUMN "id";

ALTER TABLE "pub_values"
  DROP COLUMN "id";

ALTER TABLE "stages"
  DROP COLUMN "id";

ALTER TABLE "forms"
  DROP COLUMN "id";

ALTER TABLE "form_elements"
  DROP COLUMN "id";

ALTER TABLE "action_instances"
  DROP COLUMN "id";

ALTER TABLE "action_runs"
  DROP COLUMN "id";

ALTER TABLE "action_config_defaults"
  DROP COLUMN "id";

ALTER TABLE "automations"
  DROP COLUMN "id";

ALTER TABLE "automation_runs"
  DROP COLUMN "id";

ALTER TABLE "automation_triggers"
  DROP COLUMN "id";

ALTER TABLE "automation_condition_blocks"
  DROP COLUMN "id";

ALTER TABLE "automation_conditions"
  DROP COLUMN "id";

ALTER TABLE "api_access_tokens"
  DROP COLUMN "id";

ALTER TABLE "api_access_permissions"
  DROP COLUMN "id";

ALTER TABLE "api_access_logs"
  DROP COLUMN "id";

ALTER TABLE "invites"
  DROP COLUMN "id";

ALTER TABLE "PubFieldSchema"
  DROP COLUMN "id";

ALTER TABLE "member_groups"
  DROP COLUMN "id";

ALTER TABLE "community_memberships"
  DROP COLUMN "id";

ALTER TABLE "stage_memberships"
  DROP COLUMN "id";

ALTER TABLE "pub_memberships"
  DROP COLUMN "id";

ALTER TABLE "pub_values_history"
  DROP COLUMN "id";

ALTER TABLE "invites_history"
  DROP COLUMN "id";

-- foreign key columns
ALTER TABLE "sessions"
  DROP COLUMN "userId";

ALTER TABLE "auth_tokens"
  DROP COLUMN "userId";

ALTER TABLE "pubs"
  DROP COLUMN "pubTypeId";

ALTER TABLE "pubs"
  DROP COLUMN "communityId";

ALTER TABLE "pub_fields"
  DROP COLUMN "communityId";

ALTER TABLE "pub_fields"
  DROP COLUMN "pubFieldSchemaId";

ALTER TABLE "pub_values"
  DROP COLUMN "fieldId";

ALTER TABLE "pub_values"
  DROP COLUMN "pubId";

ALTER TABLE "pub_values"
  DROP COLUMN "relatedPubId";

ALTER TABLE "pub_types"
  DROP COLUMN "communityId";

ALTER TABLE "stages"
  DROP COLUMN "communityId";

ALTER TABLE "PubsInStages"
  DROP COLUMN "pubId";

ALTER TABLE "PubsInStages"
  DROP COLUMN "stageId";

ALTER TABLE "move_constraint"
  DROP COLUMN "stageId";

ALTER TABLE "move_constraint"
  DROP COLUMN "destinationId";

ALTER TABLE "action_instances"
  DROP COLUMN "automationId";

ALTER TABLE "action_runs"
  DROP COLUMN "actionInstanceId";

ALTER TABLE "action_runs"
  DROP COLUMN "automationRunId";

ALTER TABLE "action_runs"
  DROP COLUMN "pubId";

ALTER TABLE "action_runs"
  DROP COLUMN "userId";

ALTER TABLE "action_config_defaults"
  DROP COLUMN "communityId";

ALTER TABLE "automations"
  DROP COLUMN "stageId";

ALTER TABLE "automations"
  DROP COLUMN "communityId";

ALTER TABLE "automation_runs"
  DROP COLUMN "automationId";

ALTER TABLE "automation_runs"
  DROP COLUMN "sourceUserId";

ALTER TABLE "automation_runs"
  DROP COLUMN "inputPubId";

ALTER TABLE "automation_runs"
  DROP COLUMN "sourceAutomationRunId";

ALTER TABLE "automation_triggers"
  DROP COLUMN "automationId";

ALTER TABLE "automation_triggers"
  DROP COLUMN "sourceAutomationId";

ALTER TABLE "automation_condition_blocks"
  DROP COLUMN "automationConditionBlockId";

ALTER TABLE "automation_condition_blocks"
  DROP COLUMN "automationId";

ALTER TABLE "automation_conditions"
  DROP COLUMN "automationConditionBlockId";

ALTER TABLE "forms"
  DROP COLUMN "communityId";

ALTER TABLE "forms"
  DROP COLUMN "pubTypeId";

ALTER TABLE "form_elements"
  DROP COLUMN "fieldId";

ALTER TABLE "form_elements"
  DROP COLUMN "formId";

ALTER TABLE "form_elements"
  DROP COLUMN "stageId";

ALTER TABLE "api_access_tokens"
  DROP COLUMN "communityId";

ALTER TABLE "api_access_tokens"
  DROP COLUMN "issuedById";

ALTER TABLE "api_access_permissions"
  DROP COLUMN "apiAccessTokenId";

ALTER TABLE "api_access_logs"
  DROP COLUMN "accessTokenId";

ALTER TABLE "invites"
  DROP COLUMN "userId";

ALTER TABLE "invites"
  DROP COLUMN "communityId";

ALTER TABLE "invites"
  DROP COLUMN "pubId";

ALTER TABLE "invites"
  DROP COLUMN "stageId";

ALTER TABLE "invites"
  DROP COLUMN "invitedByUserId";

ALTER TABLE "invites"
  DROP COLUMN "invitedByActionRunId";

ALTER TABLE "invite_forms"
  DROP COLUMN "inviteId";

ALTER TABLE "invite_forms"
  DROP COLUMN "formId";

ALTER TABLE "member_groups"
  DROP COLUMN "communityId";

ALTER TABLE "_MemberGroupToUser"
  DROP COLUMN "A";

ALTER TABLE "_MemberGroupToUser"
  DROP COLUMN "B";

ALTER TABLE "_PubFieldToPubType"
  DROP COLUMN "A";

ALTER TABLE "_PubFieldToPubType"
  DROP COLUMN "B";

ALTER TABLE "_FormElementToPubType"
  DROP COLUMN "A";

ALTER TABLE "_FormElementToPubType"
  DROP COLUMN "B";

ALTER TABLE "community_memberships"
  DROP COLUMN "userId";

ALTER TABLE "community_memberships"
  DROP COLUMN "communityId";

ALTER TABLE "community_memberships"
  DROP COLUMN "memberGroupId";

ALTER TABLE "community_memberships"
  DROP COLUMN "formId";

ALTER TABLE "stage_memberships"
  DROP COLUMN "userId";

ALTER TABLE "stage_memberships"
  DROP COLUMN "stageId";

ALTER TABLE "stage_memberships"
  DROP COLUMN "memberGroupId";

ALTER TABLE "stage_memberships"
  DROP COLUMN "formId";

ALTER TABLE "pub_memberships"
  DROP COLUMN "userId";

ALTER TABLE "pub_memberships"
  DROP COLUMN "pubId";

ALTER TABLE "pub_memberships"
  DROP COLUMN "memberGroupId";

ALTER TABLE "pub_memberships"
  DROP COLUMN "formId";

ALTER TABLE "pub_values_history"
  DROP COLUMN "pubValueId";

ALTER TABLE "pub_values_history"
  DROP COLUMN "userId";

ALTER TABLE "pub_values_history"
  DROP COLUMN "apiAccessTokenId";

ALTER TABLE "pub_values_history"
  DROP COLUMN "actionRunId";

ALTER TABLE "invites_history"
  DROP COLUMN "inviteId";

ALTER TABLE "invites_history"
  DROP COLUMN "userId";

ALTER TABLE "invites_history"
  DROP COLUMN "apiAccessTokenId";

ALTER TABLE "invites_history"
  DROP COLUMN "actionRunId";

-- ============================================================================
-- step 6: rename new columns to original names
-- ============================================================================
-- primary key columns
ALTER TABLE "users" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "communities" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "pubs" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "pub_types" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "pub_fields" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "pub_values" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "stages" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "forms" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "form_elements" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "action_instances" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "action_runs" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "action_config_defaults" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "automations" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "automation_runs" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "automation_triggers" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "automation_condition_blocks" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "automation_conditions" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "api_access_tokens" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "api_access_permissions" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "api_access_logs" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "invites" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "PubFieldSchema" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "member_groups" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "community_memberships" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "stage_memberships" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "pub_memberships" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "pub_values_history" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "invites_history" RENAME COLUMN "id_new" TO "id";

-- foreign key columns
ALTER TABLE "sessions" RENAME COLUMN "userId_new" TO "userId";

ALTER TABLE "auth_tokens" RENAME COLUMN "userId_new" TO "userId";

ALTER TABLE "pubs" RENAME COLUMN "pubTypeId_new" TO "pubTypeId";

ALTER TABLE "pubs" RENAME COLUMN "communityId_new" TO "communityId";

ALTER TABLE "pub_fields" RENAME COLUMN "communityId_new" TO "communityId";

ALTER TABLE "pub_fields" RENAME COLUMN "pubFieldSchemaId_new" TO "pubFieldSchemaId";

ALTER TABLE "pub_values" RENAME COLUMN "fieldId_new" TO "fieldId";

ALTER TABLE "pub_values" RENAME COLUMN "pubId_new" TO "pubId";

ALTER TABLE "pub_values" RENAME COLUMN "relatedPubId_new" TO "relatedPubId";

ALTER TABLE "pub_types" RENAME COLUMN "communityId_new" TO "communityId";

ALTER TABLE "stages" RENAME COLUMN "communityId_new" TO "communityId";

ALTER TABLE "PubsInStages" RENAME COLUMN "pubId_new" TO "pubId";

ALTER TABLE "PubsInStages" RENAME COLUMN "stageId_new" TO "stageId";

ALTER TABLE "move_constraint" RENAME COLUMN "stageId_new" TO "stageId";

ALTER TABLE "move_constraint" RENAME COLUMN "destinationId_new" TO "destinationId";

ALTER TABLE "action_instances" RENAME COLUMN "automationId_new" TO "automationId";

ALTER TABLE "action_runs" RENAME COLUMN "actionInstanceId_new" TO "actionInstanceId";

ALTER TABLE "action_runs" RENAME COLUMN "automationRunId_new" TO "automationRunId";

ALTER TABLE "action_runs" RENAME COLUMN "pubId_new" TO "pubId";

ALTER TABLE "action_runs" RENAME COLUMN "userId_new" TO "userId";

ALTER TABLE "action_config_defaults" RENAME COLUMN "communityId_new" TO "communityId";

ALTER TABLE "automations" RENAME COLUMN "stageId_new" TO "stageId";

ALTER TABLE "automations" RENAME COLUMN "communityId_new" TO "communityId";

ALTER TABLE "automation_runs" RENAME COLUMN "automationId_new" TO "automationId";

ALTER TABLE "automation_runs" RENAME COLUMN "sourceUserId_new" TO "sourceUserId";

ALTER TABLE "automation_runs" RENAME COLUMN "inputPubId_new" TO "inputPubId";

ALTER TABLE "automation_runs" RENAME COLUMN "sourceAutomationRunId_new" TO "sourceAutomationRunId";

ALTER TABLE "automation_triggers" RENAME COLUMN "automationId_new" TO "automationId";

ALTER TABLE "automation_triggers" RENAME COLUMN "sourceAutomationId_new" TO "sourceAutomationId";

ALTER TABLE "automation_condition_blocks" RENAME COLUMN "automationConditionBlockId_new" TO "automationConditionBlockId";

ALTER TABLE "automation_condition_blocks" RENAME COLUMN "automationId_new" TO "automationId";

ALTER TABLE "automation_conditions" RENAME COLUMN "automationConditionBlockId_new" TO "automationConditionBlockId";

ALTER TABLE "forms" RENAME COLUMN "communityId_new" TO "communityId";

ALTER TABLE "forms" RENAME COLUMN "pubTypeId_new" TO "pubTypeId";

ALTER TABLE "form_elements" RENAME COLUMN "fieldId_new" TO "fieldId";

ALTER TABLE "form_elements" RENAME COLUMN "formId_new" TO "formId";

ALTER TABLE "form_elements" RENAME COLUMN "stageId_new" TO "stageId";

ALTER TABLE "api_access_tokens" RENAME COLUMN "communityId_new" TO "communityId";

ALTER TABLE "api_access_tokens" RENAME COLUMN "issuedById_new" TO "issuedById";

ALTER TABLE "api_access_permissions" RENAME COLUMN "apiAccessTokenId_new" TO "apiAccessTokenId";

ALTER TABLE "api_access_logs" RENAME COLUMN "accessTokenId_new" TO "accessTokenId";

ALTER TABLE "invites" RENAME COLUMN "userId_new" TO "userId";

ALTER TABLE "invites" RENAME COLUMN "communityId_new" TO "communityId";

ALTER TABLE "invites" RENAME COLUMN "pubId_new" TO "pubId";

ALTER TABLE "invites" RENAME COLUMN "stageId_new" TO "stageId";

ALTER TABLE "invites" RENAME COLUMN "invitedByUserId_new" TO "invitedByUserId";

ALTER TABLE "invites" RENAME COLUMN "invitedByActionRunId_new" TO "invitedByActionRunId";

ALTER TABLE "invite_forms" RENAME COLUMN "inviteId_new" TO "inviteId";

ALTER TABLE "invite_forms" RENAME COLUMN "formId_new" TO "formId";

ALTER TABLE "member_groups" RENAME COLUMN "communityId_new" TO "communityId";

ALTER TABLE "_MemberGroupToUser" RENAME COLUMN "A_new" TO "A";

ALTER TABLE "_MemberGroupToUser" RENAME COLUMN "B_new" TO "B";

ALTER TABLE "_PubFieldToPubType" RENAME COLUMN "A_new" TO "A";

ALTER TABLE "_PubFieldToPubType" RENAME COLUMN "B_new" TO "B";

ALTER TABLE "_FormElementToPubType" RENAME COLUMN "A_new" TO "A";

ALTER TABLE "_FormElementToPubType" RENAME COLUMN "B_new" TO "B";

ALTER TABLE "community_memberships" RENAME COLUMN "userId_new" TO "userId";

ALTER TABLE "community_memberships" RENAME COLUMN "communityId_new" TO "communityId";

ALTER TABLE "community_memberships" RENAME COLUMN "memberGroupId_new" TO "memberGroupId";

ALTER TABLE "community_memberships" RENAME COLUMN "formId_new" TO "formId";

ALTER TABLE "stage_memberships" RENAME COLUMN "userId_new" TO "userId";

ALTER TABLE "stage_memberships" RENAME COLUMN "stageId_new" TO "stageId";

ALTER TABLE "stage_memberships" RENAME COLUMN "memberGroupId_new" TO "memberGroupId";

ALTER TABLE "stage_memberships" RENAME COLUMN "formId_new" TO "formId";

ALTER TABLE "pub_memberships" RENAME COLUMN "userId_new" TO "userId";

ALTER TABLE "pub_memberships" RENAME COLUMN "pubId_new" TO "pubId";

ALTER TABLE "pub_memberships" RENAME COLUMN "memberGroupId_new" TO "memberGroupId";

ALTER TABLE "pub_memberships" RENAME COLUMN "formId_new" TO "formId";

ALTER TABLE "pub_values_history" RENAME COLUMN "pubValueId_new" TO "pubValueId";

ALTER TABLE "pub_values_history" RENAME COLUMN "userId_new" TO "userId";

ALTER TABLE "pub_values_history" RENAME COLUMN "apiAccessTokenId_new" TO "apiAccessTokenId";

ALTER TABLE "pub_values_history" RENAME COLUMN "actionRunId_new" TO "actionRunId";

ALTER TABLE "invites_history" RENAME COLUMN "inviteId_new" TO "inviteId";

ALTER TABLE "invites_history" RENAME COLUMN "userId_new" TO "userId";

ALTER TABLE "invites_history" RENAME COLUMN "apiAccessTokenId_new" TO "apiAccessTokenId";

ALTER TABLE "invites_history" RENAME COLUMN "actionRunId_new" TO "actionRunId";

-- ============================================================================
-- step 7: add primary key constraints
-- ============================================================================
ALTER TABLE "users"
  ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

ALTER TABLE "communities"
  ADD CONSTRAINT "communities_pkey" PRIMARY KEY ("id");

ALTER TABLE "pubs"
  ADD CONSTRAINT "pubs_pkey" PRIMARY KEY ("id");

ALTER TABLE "pub_types"
  ADD CONSTRAINT "pub_types_pkey" PRIMARY KEY ("id");

ALTER TABLE "pub_fields"
  ADD CONSTRAINT "pub_fields_pkey" PRIMARY KEY ("id");

ALTER TABLE "pub_values"
  ADD CONSTRAINT "pub_values_pkey" PRIMARY KEY ("id");

ALTER TABLE "stages"
  ADD CONSTRAINT "stages_pkey" PRIMARY KEY ("id");

ALTER TABLE "forms"
  ADD CONSTRAINT "forms_pkey" PRIMARY KEY ("id");

ALTER TABLE "form_elements"
  ADD CONSTRAINT "form_elements_pkey" PRIMARY KEY ("id");

ALTER TABLE "action_instances"
  ADD CONSTRAINT "action_instances_pkey" PRIMARY KEY ("id");

ALTER TABLE "action_runs"
  ADD CONSTRAINT "action_runs_pkey" PRIMARY KEY ("id");

ALTER TABLE "action_config_defaults"
  ADD CONSTRAINT "action_config_defaults_pkey" PRIMARY KEY ("id");

ALTER TABLE "automations"
  ADD CONSTRAINT "automations_pkey" PRIMARY KEY ("id");

ALTER TABLE "automation_runs"
  ADD CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id");

ALTER TABLE "automation_triggers"
  ADD CONSTRAINT "automation_triggers_pkey" PRIMARY KEY ("id");

ALTER TABLE "automation_condition_blocks"
  ADD CONSTRAINT "automation_condition_blocks_pkey" PRIMARY KEY ("id");

ALTER TABLE "automation_conditions"
  ADD CONSTRAINT "automation_conditions_pkey" PRIMARY KEY ("id");

ALTER TABLE "api_access_tokens"
  ADD CONSTRAINT "api_access_tokens_pkey" PRIMARY KEY ("id");

ALTER TABLE "api_access_permissions"
  ADD CONSTRAINT "api_access_permissions_pkey" PRIMARY KEY ("id");

ALTER TABLE "api_access_logs"
  ADD CONSTRAINT "api_access_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE "invites"
  ADD CONSTRAINT "invites_pkey" PRIMARY KEY ("id");

ALTER TABLE "PubFieldSchema"
  ADD CONSTRAINT "PubFieldSchema_pkey" PRIMARY KEY ("id");

ALTER TABLE "member_groups"
  ADD CONSTRAINT "member_groups_pkey" PRIMARY KEY ("id");

ALTER TABLE "community_memberships"
  ADD CONSTRAINT "community_memberships_pkey" PRIMARY KEY ("id");

ALTER TABLE "stage_memberships"
  ADD CONSTRAINT "stage_memberships_pkey" PRIMARY KEY ("id");

ALTER TABLE "pub_memberships"
  ADD CONSTRAINT "pub_memberships_pkey" PRIMARY KEY ("id");

ALTER TABLE "pub_values_history"
  ADD CONSTRAINT "pub_values_history_pkey" PRIMARY KEY ("id");

ALTER TABLE "invites_history"
  ADD CONSTRAINT "invites_history_pkey" PRIMARY KEY ("id");

-- composite primary keys
ALTER TABLE "PubsInStages"
  ADD CONSTRAINT "PubsInStages_pkey" PRIMARY KEY ("pubId", "stageId");

ALTER TABLE "move_constraint"
  ADD CONSTRAINT "move_constraint_pkey" PRIMARY KEY ("stageId", "destinationId");

ALTER TABLE "invite_forms"
  ADD CONSTRAINT "invite_forms_pkey" PRIMARY KEY ("inviteId", "formId", "type");

-- ============================================================================
-- step 8: add foreign key constraints
-- ============================================================================
ALTER TABLE "sessions"
  ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "auth_tokens"
  ADD CONSTRAINT "auth_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pubs"
  ADD CONSTRAINT "pubs_pubTypeId_fkey" FOREIGN KEY ("pubTypeId") REFERENCES "pub_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pubs"
  ADD CONSTRAINT "pubs_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pub_fields"
  ADD CONSTRAINT "pub_fields_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pub_fields"
  ADD CONSTRAINT "pub_fields_pubFieldSchemaId_fkey" FOREIGN KEY ("pubFieldSchemaId") REFERENCES "PubFieldSchema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pub_values"
  ADD CONSTRAINT "pub_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "pub_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pub_values"
  ADD CONSTRAINT "pub_values_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pub_values"
  ADD CONSTRAINT "pub_values_relatedPubId_fkey" FOREIGN KEY ("relatedPubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pub_types"
  ADD CONSTRAINT "pub_types_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stages"
  ADD CONSTRAINT "stages_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PubsInStages"
  ADD CONSTRAINT "PubsInStages_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PubsInStages"
  ADD CONSTRAINT "PubsInStages_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "move_constraint"
  ADD CONSTRAINT "move_constraint_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "move_constraint"
  ADD CONSTRAINT "move_constraint_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "action_instances"
  ADD CONSTRAINT "action_instances_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "action_runs"
  ADD CONSTRAINT "action_runs_actionInstanceId_fkey" FOREIGN KEY ("actionInstanceId") REFERENCES "action_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "action_runs"
  ADD CONSTRAINT "action_runs_automationRunId_fkey" FOREIGN KEY ("automationRunId") REFERENCES "automation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "action_runs"
  ADD CONSTRAINT "action_runs_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "action_runs"
  ADD CONSTRAINT "action_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "action_config_defaults"
  ADD CONSTRAINT "action_config_defaults_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automations"
  ADD CONSTRAINT "automations_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automations"
  ADD CONSTRAINT "automations_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_runs"
  ADD CONSTRAINT "automation_runs_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_runs"
  ADD CONSTRAINT "automation_runs_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_runs"
  ADD CONSTRAINT "automation_runs_inputPubId_fkey" FOREIGN KEY ("inputPubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_runs"
  ADD CONSTRAINT "automation_runs_sourceAutomationRunId_fkey" FOREIGN KEY ("sourceAutomationRunId") REFERENCES "automation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "automation_triggers"
  ADD CONSTRAINT "automation_triggers_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_triggers"
  ADD CONSTRAINT "automation_triggers_sourceAutomationId_fkey" FOREIGN KEY ("sourceAutomationId") REFERENCES "automations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "automation_condition_blocks"
  ADD CONSTRAINT "automation_condition_blocks_automationConditionBlockId_fkey" FOREIGN KEY ("automationConditionBlockId") REFERENCES "automation_condition_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_condition_blocks"
  ADD CONSTRAINT "automation_condition_blocks_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_conditions"
  ADD CONSTRAINT "automation_conditions_automationConditionBlockId_fkey" FOREIGN KEY ("automationConditionBlockId") REFERENCES "automation_condition_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "forms"
  ADD CONSTRAINT "forms_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "forms"
  ADD CONSTRAINT "forms_pubTypeId_fkey" FOREIGN KEY ("pubTypeId") REFERENCES "pub_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "form_elements"
  ADD CONSTRAINT "form_elements_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "pub_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_elements"
  ADD CONSTRAINT "form_elements_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_elements"
  ADD CONSTRAINT "form_elements_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "api_access_tokens"
  ADD CONSTRAINT "api_access_tokens_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "api_access_tokens"
  ADD CONSTRAINT "api_access_tokens_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "api_access_permissions"
  ADD CONSTRAINT "api_access_permissions_apiAccessTokenId_fkey" FOREIGN KEY ("apiAccessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "api_access_logs"
  ADD CONSTRAINT "api_access_logs_accessTokenId_fkey" FOREIGN KEY ("accessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invites"
  ADD CONSTRAINT "invites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invites"
  ADD CONSTRAINT "invites_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invites"
  ADD CONSTRAINT "invites_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invites"
  ADD CONSTRAINT "invites_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invites"
  ADD CONSTRAINT "invites_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invites"
  ADD CONSTRAINT "invites_invitedByActionRunId_fkey" FOREIGN KEY ("invitedByActionRunId") REFERENCES "action_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invite_forms"
  ADD CONSTRAINT "invite_forms_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invite_forms"
  ADD CONSTRAINT "invite_forms_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "member_groups"
  ADD CONSTRAINT "member_groups_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_MemberGroupToUser"
  ADD CONSTRAINT "_MemberGroupToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_MemberGroupToUser"
  ADD CONSTRAINT "_MemberGroupToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_PubFieldToPubType"
  ADD CONSTRAINT "_PubFieldToPubType_A_fkey" FOREIGN KEY ("A") REFERENCES "pub_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_PubFieldToPubType"
  ADD CONSTRAINT "_PubFieldToPubType_B_fkey" FOREIGN KEY ("B") REFERENCES "pub_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_FormElementToPubType"
  ADD CONSTRAINT "_FormElementToPubType_A_fkey" FOREIGN KEY ("A") REFERENCES "form_elements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_FormElementToPubType"
  ADD CONSTRAINT "_FormElementToPubType_B_fkey" FOREIGN KEY ("B") REFERENCES "pub_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_memberships"
  ADD CONSTRAINT "community_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_memberships"
  ADD CONSTRAINT "community_memberships_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_memberships"
  ADD CONSTRAINT "community_memberships_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_memberships"
  ADD CONSTRAINT "community_memberships_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stage_memberships"
  ADD CONSTRAINT "stage_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stage_memberships"
  ADD CONSTRAINT "stage_memberships_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stage_memberships"
  ADD CONSTRAINT "stage_memberships_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stage_memberships"
  ADD CONSTRAINT "stage_memberships_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pub_memberships"
  ADD CONSTRAINT "pub_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pub_memberships"
  ADD CONSTRAINT "pub_memberships_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pub_memberships"
  ADD CONSTRAINT "pub_memberships_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pub_memberships"
  ADD CONSTRAINT "pub_memberships_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pub_values_history"
  ADD CONSTRAINT "pub_values_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pub_values_history"
  ADD CONSTRAINT "pub_values_history_apiAccessTokenId_fkey" FOREIGN KEY ("apiAccessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pub_values_history"
  ADD CONSTRAINT "pub_values_history_actionRunId_fkey" FOREIGN KEY ("actionRunId") REFERENCES "action_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invites_history"
  ADD CONSTRAINT "invites_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invites_history"
  ADD CONSTRAINT "invites_history_apiAccessTokenId_fkey" FOREIGN KEY ("apiAccessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invites_history"
  ADD CONSTRAINT "invites_history_actionRunId_fkey" FOREIGN KEY ("actionRunId") REFERENCES "action_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- step 9: recreate unique constraints and indexes
-- ============================================================================
CREATE UNIQUE INDEX "_MemberGroupToUser_AB_unique" ON "_MemberGroupToUser"("A", "B");

CREATE INDEX "_MemberGroupToUser_B_index" ON "_MemberGroupToUser"("B");

CREATE UNIQUE INDEX "_PubFieldToPubType_A_B_key" ON "_PubFieldToPubType"("A", "B");

CREATE INDEX "_PubFieldToPubType_B_index" ON "_PubFieldToPubType"("B");

CREATE UNIQUE INDEX "_FormElementToPubType_AB_unique" ON "_FormElementToPubType"("A", "B");

CREATE INDEX "_FormElementToPubType_B_index" ON "_FormElementToPubType"("B");

CREATE UNIQUE INDEX "form_elements_type_label_formId_key" ON "form_elements"("type", "label", "formId");

CREATE UNIQUE INDEX "form_elements_fieldId_formId_key" ON "form_elements"("fieldId", "formId");

CREATE UNIQUE INDEX "invite_forms_inviteId_formId_type_key" ON "invite_forms"("inviteId", "formId", "type");

CREATE UNIQUE INDEX "action_config_defaults_communityId_action_key" ON "action_config_defaults"("communityId", "action");

CREATE INDEX "api_access_permissions_idx" ON "api_access_permissions"("apiAccessTokenId", "scope", "accessType");

CREATE UNIQUE INDEX "forms_name_communityId_key" ON "forms"("name", "communityId");

CREATE UNIQUE INDEX "forms_slug_communityId_key" ON "forms"("slug", "communityId");

CREATE UNIQUE INDEX "pub_types_name_communityId_key" ON "pub_types"("name", "communityId");

-- pub_values partial unique indexes (critical for on conflict queries)
CREATE UNIQUE INDEX "pub_values_pubId_relatedPubId_fieldId_key" ON "pub_values"("pubId", "relatedPubId", "fieldId")
WHERE
  "relatedPubId" IS NOT NULL;

CREATE UNIQUE INDEX "pub_values_pubId_fieldId_key" ON "pub_values"("pubId", "fieldId")
WHERE
  "relatedPubId" IS NULL;

-- _PubFieldToPubType partial unique index for isTitle
CREATE UNIQUE INDEX "unique_pubType_isTitle" ON "_PubFieldToPubType"("B")
WHERE
  "isTitle" IS TRUE;

-- automations partial unique index
CREATE UNIQUE INDEX "automations_null_stageId_per_community" ON "automations"("communityId")
WHERE
  "stageId" IS NULL;

-- api_access_tokens partial unique index for site builder
CREATE UNIQUE INDEX "api_access_tokens_is_site_builder_token_idx" ON "api_access_tokens"("isSiteBuilderToken", "communityId")
WHERE
  "isSiteBuilderToken" = TRUE;

-- forms partial unique index for isDefault
CREATE UNIQUE INDEX "forms_isDefault_pubTypeId_key" ON "forms"("isDefault", "pubTypeId")
WHERE
  "isDefault" IS TRUE;

-- community_memberships unique indexes
CREATE UNIQUE INDEX "community_memberships_communityId_userId_formId_key" ON "community_memberships"("communityId", "userId", "formId")
WHERE
  "userId" IS NOT NULL AND "formId" IS NOT NULL;

CREATE UNIQUE INDEX "community_memberships_communityId_userId_key" ON "community_memberships"("communityId", "userId")
WHERE
  "userId" IS NOT NULL AND "formId" IS NULL;

CREATE UNIQUE INDEX "community_memberships_communityId_memberGroupId_formId_key" ON "community_memberships"("communityId", "memberGroupId", "formId")
WHERE
  "memberGroupId" IS NOT NULL AND "formId" IS NOT NULL;

CREATE UNIQUE INDEX "community_memberships_communityId_memberGroupId_key" ON "community_memberships"("communityId", "memberGroupId")
WHERE
  "memberGroupId" IS NOT NULL AND "formId" IS NULL;

-- pub_memberships unique indexes
CREATE UNIQUE INDEX "pub_memberships_pubId_userId_formId_key" ON "pub_memberships"("pubId", "userId", "formId")
WHERE
  "userId" IS NOT NULL AND "formId" IS NOT NULL;

CREATE UNIQUE INDEX "pub_memberships_pubId_userId_key" ON "pub_memberships"("pubId", "userId")
WHERE
  "userId" IS NOT NULL AND "formId" IS NULL;

CREATE UNIQUE INDEX "pub_memberships_pubId_memberGroupId_formId_key" ON "pub_memberships"("pubId", "memberGroupId", "formId")
WHERE
  "memberGroupId" IS NOT NULL AND "formId" IS NOT NULL;

CREATE UNIQUE INDEX "pub_memberships_pubId_memberGroupId_key" ON "pub_memberships"("pubId", "memberGroupId")
WHERE
  "memberGroupId" IS NOT NULL AND "formId" IS NULL;

-- stage_memberships unique indexes
CREATE UNIQUE INDEX "stage_memberships_stageId_userId_formId_key" ON "stage_memberships"("stageId", "userId", "formId")
WHERE
  "userId" IS NOT NULL AND "formId" IS NOT NULL;

CREATE UNIQUE INDEX "stage_memberships_stageId_userId_key" ON "stage_memberships"("stageId", "userId")
WHERE
  "userId" IS NOT NULL AND "formId" IS NULL;

CREATE UNIQUE INDEX "stage_memberships_stageId_memberGroupId_formId_key" ON "stage_memberships"("stageId", "memberGroupId", "formId")
WHERE
  "memberGroupId" IS NOT NULL AND "formId" IS NOT NULL;

CREATE UNIQUE INDEX "stage_memberships_stageId_memberGroupId_key" ON "stage_memberships"("stageId", "memberGroupId")
WHERE
  "memberGroupId" IS NOT NULL AND "formId" IS NULL;

-- convert the chopped up ids to uuids
CREATE OR REPLACE FUNCTION f_generic_history()
  RETURNS TRIGGER
  AS $$
DECLARE
  v_primary_key_column_name text := TG_ARGV[0];
  vc_insert_sql constant text := 'insert into ' || TG_TABLE_NAME || '_history ( "operationType", "oldRowData", "newRowData",  "' || v_primary_key_column_name || '", "userId", "apiAccessTokenId", "actionRunId", "other" ) values ( $1, $2, $3, $4, $5, $6, $7, $8 )';
  v_message text;
  v_detail text;
  v_hint text;
  v_last_modified_by_minus_timestamp text;
  v_type text;
  v_id text;
  v_userId uuid;
  v_apiAccessTokenId uuid;
  v_actionRunId uuid;
  v_other text;
  v_oldRowData json;
  v_operationType "OperationType";
  v_timestamp_new text;
  v_timestamp_old text;
BEGIN
  v_last_modified_by_minus_timestamp := split_part(NEW."lastModifiedBy", '|', 1);
  v_type := split_part(v_last_modified_by_minus_timestamp, ':', 1);
  v_id := split_part(v_last_modified_by_minus_timestamp, ':', 2);
  v_timestamp_new := split_part(NEW."lastModifiedBy", '|', 2);
  v_timestamp_old := split_part(OLD."lastModifiedBy", '|', 2);
  CASE v_type
  WHEN 'user' THEN
    v_userId := v_id::uuid;
  WHEN 'api-access-token' THEN
    v_apiAccessTokenId := v_id::uuid;
  WHEN 'action-run' THEN
    v_actionRunId := v_id::uuid;
  ELSE
    IF v_last_modified_by_minus_timestamp = 'system' THEN
        v_other := 'system';
  ELSIF v_last_modified_by_minus_timestamp = 'unknown' THEN
        v_other := NULL;
  ELSE
    RAISE EXCEPTION 'Invalid lastModifiedBy: %', NEW."lastModifiedBy";
      END IF;
  END CASE;
  IF TG_OP = 'INSERT' THEN
    EXECUTE vc_insert_sql
    USING 'insert'::"OperationType", NULL::json, row_to_json(NEW), NEW."id"::uuid, v_userId, v_apiAccessTokenId, v_actionRunId, v_other;
  ELSIF (TG_OP = 'UPDATE'
      AND OLD IS DISTINCT FROM NEW) THEN
    -- check if the timestamp is the same (indicating no explicit lastModifiedBy was set)
    IF v_timestamp_new = v_timestamp_old THEN
      -- check if this is an automated update (foreign key cascade set null)
      -- by looking for id columns that changed from not-null to null
      IF EXISTS (
        SELECT
          1
        FROM
          json_each_text(row_to_json(OLD)) old_vals
          JOIN json_each_text(row_to_json(NEW)) new_vals ON old_vals.key = new_vals.key
        WHERE
          old_vals.key LIKE '%Id'
          AND old_vals.value IS NOT NULL
          AND new_vals.value IS NULL) THEN
      -- this is an automated update, set to system, all the other values are the old values
      v_userId := NULL;
      v_apiAccessTokenId := NULL;
      v_actionRunId := NULL;
      v_other := 'system';
    ELSE
      -- this is a missing lastModifiedBy, throw error
      RAISE EXCEPTION 'lastModifiedBy must be explicitly set in UPDATE';
    END IF;
  END IF;
    EXECUTE vc_insert_sql
    USING 'update'::"OperationType", row_to_json(OLD), row_to_json(NEW), NEW."id"::uuid, v_userId, v_apiAccessTokenId, v_actionRunId, v_other;
  END IF;
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

-- set arg to id
CREATE OR REPLACE FUNCTION update_pub_for_value_changes()
  RETURNS TRIGGER
  AS $$
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS tmp_affected_pubs(
    "pubId" uuid PRIMARY KEY,
    "value" text
  ) ON COMMIT DROP;
  WITH tf AS(
    SELECT DISTINCT ON(inserted_updated_deleted_rows."pubId"::uuid)
      inserted_updated_deleted_rows."pubId"::uuid,
      inserted_updated_deleted_rows."value",
      CASE WHEN inserted_updated_deleted_rows."value" IS NULL THEN
        TRUE
      ELSE
        FALSE
      END AS is_null_value
    FROM
      inserted_updated_deleted_rows
      JOIN "pubs" p ON inserted_updated_deleted_rows."pubId"::uuid = p."id"::uuid
      JOIN "_PubFieldToPubType" pft ON pft."A" = inserted_updated_deleted_rows."fieldId"
        AND pft."B" = p."pubTypeId"
        AND pft."isTitle" = TRUE)
  INSERT INTO tmp_affected_pubs("pubId", "value")
  SELECT DISTINCT
    "pubId"::uuid,
    CASE WHEN is_null_value THEN
      NULL
    ELSE
("value" #>> '{}')
    END
  FROM
    tf
    -- this is to handle edge cases which mostly happen during "UPDATE"s in transactions
  ON CONFLICT("pubId")
    DO UPDATE SET
      "value" = CASE WHEN EXCLUDED."value" IS NULL THEN
        NULL
      ELSE
        EXCLUDED."value"
      END;
  -- this is to handle
  -- - the actual update of the title
  -- - the actual update of the searchVector
  -- - to ensure that the updatedAt is updated
  -- we first do this CTE to get the new title, bc we want to use it in the searchVector as well
  WITH updates AS(
    SELECT
      affected."pubId",
      CASE WHEN tmp."pubId" IS NULL THEN
        pubs."title"
      WHEN TG_OP = 'DELETE'
        OR tmp."value" IS NULL THEN
        NULL
      ELSE
        tmp."value"
      END AS new_title
    FROM( SELECT DISTINCT
        "pubId"
      FROM
        inserted_updated_deleted_rows) AS affected
    LEFT JOIN tmp_affected_pubs tmp ON tmp."pubId" = affected."pubId"
    JOIN pubs ON pubs.id = affected."pubId")
UPDATE
  "pubs"
SET
  "updatedAt" = CURRENT_TIMESTAMP,
  "title" = updates.new_title,
  -- we weight the searchVector based on the title and its values
  "searchVector" =(
    SELECT
      generate_pub_search_vector(updates.new_title, updates."pubId"))
FROM
  updates
WHERE
  "pubs"."id" = updates."pubId";
  RETURN NULL;
END;
$$
LANGUAGE plpgsql;

-- function to recursively build nested condition blocks with their items
CREATE OR REPLACE FUNCTION get_condition_block_items(_block_id uuid)
  RETURNS jsonb
  LANGUAGE sql
  STABLE PARALLEL SAFE
  AS $func$
  SELECT
    COALESCE(jsonb_agg(sub ORDER BY(sub ->> 'rank')
        COLLATE "C"), '[]'::jsonb)
  FROM(
    -- get conditions
    SELECT
      to_jsonb(ac.*) || jsonb_build_object('kind', 'condition') AS sub
    FROM
      automation_conditions ac
    WHERE
      ac."automationConditionBlockId" = _block_id
    UNION ALL
    -- get nested blocks with their items recursively
    SELECT
      to_jsonb(acb.*) || jsonb_build_object('kind', 'block', 'items', get_condition_block_items(acb.id)) AS sub
    FROM
      automation_condition_blocks acb
    WHERE
      acb."automationConditionBlockId" = _block_id) items
$func$;

CREATE OR REPLACE FUNCTION build_automation_run_stack(run_id uuid)
  RETURNS uuid[]
  AS $$
DECLARE
  path uuid[];
  current_run_id uuid := run_id;
  source_run_id uuid;
BEGIN
  WITH RECURSIVE automation_run_stack AS (
    SELECT
      source_ar.id,
      source_ar."sourceAutomationRunId",
      ARRAY[source_ar.id] AS "path",
      0 AS "depth"
    FROM
      automation_runs ar
      INNER JOIN automation_runs source_ar ON source_ar.id = ar."sourceAutomationRunId"
    WHERE
      ar.id = run_id
    UNION ALL
    SELECT
      ar.id,
      ar."sourceAutomationRunId",
      ARRAY[ar.id] || "automation_run_stack"."path" AS "path",
      "automation_run_stack"."depth" + 1 AS "depth"
    FROM
      automation_runs ar
      INNER JOIN automation_run_stack ON ar."id" = "automation_run_stack"."sourceAutomationRunId"
    WHERE
      "automation_run_stack"."depth" < 20
      AND NOT ar."id" = ANY ("automation_run_stack"."path"))
  SELECT
    automation_run_stack."path" INTO path
  FROM
    automation_run_stack
  ORDER BY
    automation_run_stack."depth" DESC
  LIMIT 1;
  IF path IS NULL THEN
    path := ARRAY[]::uuid[];
  END IF;
  RETURN path;
END;
$$
LANGUAGE plpgsql
STABLE;

CREATE OR REPLACE FUNCTION check_invite_has_pub_or_stage(type "MembershipType", invite_id uuid)
  RETURNS boolean
  AS $$
BEGIN
  RETURN CASE WHEN "type" = 'pub'::"MembershipType" THEN
    EXISTS(
      SELECT
        1
      FROM
        "invites"
      WHERE
        "invites"."id" = invite_id
        AND "invites"."pubId" IS NOT NULL)
  WHEN "type" = 'stage'::"MembershipType" THEN
    EXISTS(
      SELECT
        1
      FROM
        "invites"
      WHERE
        "invites"."id" = invite_id
        AND "invites"."stageId" IS NOT NULL)
  ELSE
    TRUE
  END;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_pub_search_vector(new_title text, pub_id uuid)
  RETURNS tsvector
  AS $$
BEGIN
  RETURN setweight(to_tsvector('english', COALESCE(new_title, '')), 'A') || setweight(to_tsvector('english', COALESCE(get_pub_values_text(pub_id), '')), 'B');
END;
$$
LANGUAGE plpgsql
STABLE;

CREATE OR REPLACE FUNCTION get_pub_values_text(pub_id uuid)
  RETURNS text
  AS $$
  SELECT
    string_agg(
      CASE
      -- When the field is RichText, strip HTML tags
      WHEN pf."schemaName" = 'RichText'::"CoreSchemaType" THEN
        strip_html_tags(CAST(pv.value #>> '{}' AS text))
        -- For all other fields, just get the raw value
      ELSE
        CAST(pv.value #>> '{}' AS text)
      END, ' ')
  FROM
    pub_values pv
    JOIN pub_fields pf ON pv."fieldId" = pf.id
  WHERE
    pv."pubId" = pub_id;
$$
LANGUAGE sql
STABLE;

DROP TRIGGER IF EXISTS action_runs_change_trigger ON action_runs;

DROP FUNCTION IF EXISTS notify_change_action_runs();

CREATE OR REPLACE FUNCTION notify_change_automation_runs()
  RETURNS TRIGGER
  AS $$
DECLARE
  correct_row jsonb;
  community_id uuid;
BEGIN
  SELECT
    INTO community_id "automations"."communityId"
  FROM
    "automation_runs"
    INNER JOIN "automations" ON "automation_runs"."automationId" = "automations"."id"
  WHERE
    "automation_runs"."id" = NEW."id";
  PERFORM
    notify_change(correct_row, community_id, TG_TABLE_NAME, TG_OP);
  RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_change(correct_row jsonb, community_id uuid, table_name text, operation text)
  RETURNS void
  AS $$
DECLARE
  channel_name text;
BEGIN
  -- Changed to concat to avoid errors if commmunity_id or table_name are null
  channel_name = CONCAT('change', '_', community_id, '_', table_name);
  -- construct the notification payload
  PERFORM
    pg_notify(channel_name, json_build_object('table', table_name, 'operation', operation, 'row', correct_row)::text);
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION compute_automation_run_status()
  RETURNS TRIGGER
  AS $$
DECLARE
  new_status "ActionRunStatus";
  old_status "ActionRunStatus";
  target_event "AutomationEvent";
  community RECORD;
  action_stack text[];
  source_automation_id uuid;
  source_automation_run_id uuid := NULL;
  watched_automation RECORD;
BEGIN
  -- early returns: skip if no automation run or status unchanged
  IF NEW."automationRunId" IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  -- get current status before update
  SELECT
    status INTO old_status
  FROM
    automation_runs
  WHERE
    id = NEW."automationRunId";
  -- compute new status from all action_runs
  SELECT
    CASE WHEN COUNT(*) FILTER (WHERE status = 'failure') > 0 THEN
      'failure'::"ActionRunStatus"
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE status = 'success') THEN
      'success'::"ActionRunStatus"
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE status = 'scheduled') THEN
      'scheduled'::"ActionRunStatus"
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE status = 'pending') THEN
      'pending'::"ActionRunStatus"
    ELSE
      'pending'::"ActionRunStatus"
    END INTO new_status
  FROM
    action_runs
  WHERE
    "automationRunId" = NEW."automationRunId";
  -- if no action runs exist, leave status as null
  IF new_status IS NULL THEN
    RETURN NEW;
  END IF;
  -- update automation_run status
  UPDATE
    automation_runs
  SET
    status = new_status
  WHERE
    id = NEW."automationRunId";
  -- emit sequential automation events on terminal status
  IF new_status IN ('success', 'failure') AND (old_status IS NULL OR old_status != new_status) THEN
    -- determine event type
    target_event := CASE WHEN new_status = 'success' THEN
      'automationSucceeded'
    ELSE
      'automationFailed'
    END;
    SELECT
      ar."sourceAutomationRunId" INTO source_automation_run_id
    FROM
      automation_runs ar
    WHERE
      ar.id = NEW."automationRunId";
    -- get automation and community info
    SELECT
      "automationId" INTO source_automation_id
    FROM
      automation_runs
    WHERE
      id = NEW."automationRunId";
    IF source_automation_id IS NULL THEN
      RETURN NEW;
    END IF;
    SELECT
      c.id,
      c.slug INTO community
    FROM
      automations a
      JOIN communities c ON a."communityId" = c.id
    WHERE
      a.id = source_automation_id;
    -- build stack recursively from sourceAutomationRunId chain
    action_stack := build_automation_run_stack(NEW."automationRunId");
    -- emit event for each watching automation
    FOR watched_automation IN SELECT DISTINCT
      a.id AS "automationId",
      a."stageId"
    FROM
      automations a
      INNER JOIN automation_triggers at ON at."automationId" = a.id
    WHERE
      at."sourceAutomationId" = source_automation_id
      AND at.event = target_event LOOP
        PERFORM
          graphile_worker.add_job('emitEvent', json_build_object('type', 'RunAutomation', 'automationId', watched_automation."automationId", 'sourceAutomationRunId', source_automation_run_id, 'automationRunId', NEW."automationRunId", 'pubId', NEW."pubId", 'stageId', watched_automation."stageId", 'trigger', json_build_object('event', target_event, 'config', NULL), 'community', community, 'stack', action_stack || ARRAY[NEW."automationRunId"]));
      END LOOP;
  END IF;
  RETURN NEW;
END;
$$
LANGUAGE plpgsql
VOLATILE;

-- re-enable triggers
SET session_replication_role = DEFAULT;

