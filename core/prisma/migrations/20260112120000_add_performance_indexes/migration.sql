-- Performance optimization indices
-- action_runs: optimize queries by automationRunId, pubId, userId, actionInstanceId, and status
CREATE INDEX "action_runs_automationRunId_idx" ON "action_runs"("automationRunId");

CREATE INDEX "action_runs_pubId_idx" ON "action_runs"("pubId");

CREATE INDEX "action_runs_userId_idx" ON "action_runs"("userId");

CREATE INDEX "action_runs_actionInstanceId_idx" ON "action_runs"("actionInstanceId");

CREATE INDEX "action_runs_status_idx" ON "action_runs"("status");

-- automation_runs: optimize queries by automationId, inputPubId, sourceUserId, sourceAutomationRunId, and status
CREATE INDEX "automation_runs_automationId_idx" ON "automation_runs"("automationId");

CREATE INDEX "automation_runs_inputPubId_idx" ON "automation_runs"("inputPubId");

CREATE INDEX "automation_runs_sourceUserId_idx" ON "automation_runs"("sourceUserId");

CREATE INDEX "automation_runs_sourceAutomationRunId_idx" ON "automation_runs"("sourceAutomationRunId");

CREATE INDEX "automation_runs_status_idx" ON "automation_runs"("status");

-- composite index for queries filtering by automation and sorted by creation time
CREATE INDEX "automation_runs_automationId_createdAt_idx" ON "automation_runs"("automationId", "createdAt" DESC);

-- automations: optimize queries by communityId and stageId
CREATE INDEX "automations_communityId_idx" ON "automations"("communityId");

CREATE INDEX "automations_stageId_idx" ON "automations"("stageId");

-- automation_triggers: optimize queries by event and automationId
CREATE INDEX "automation_triggers_automationId_idx" ON "automation_triggers"("automationId");

CREATE INDEX "automation_triggers_event_idx" ON "automation_triggers"("event");

CREATE INDEX "automation_triggers_sourceAutomationId_idx" ON "automation_triggers"("sourceAutomationId");

-- action_instances: optimize queries by automationId
CREATE INDEX "action_instances_automationId_idx" ON "action_instances"("automationId");

-- automation_condition_blocks: optimize queries by automationId
CREATE INDEX "automation_condition_blocks_automationId_idx" ON "automation_condition_blocks"("automationId");

CREATE INDEX "automation_condition_blocks_automationConditionBlockId_idx" ON "automation_condition_blocks"("automationConditionBlockId");

-- automation_conditions: optimize queries by automationConditionBlockId
CREATE INDEX "automation_conditions_automationConditionBlockId_idx" ON "automation_conditions"("automationConditionBlockId");

-- pub_values: optimize queries by pubId, fieldId, and relatedPubId
-- note: partial unique indexes exist on (pubId, fieldId) and (pubId, relatedPubId, fieldId)
-- but we need a non-partial index on pubId for general lookups
CREATE INDEX "pub_values_pubId_idx" ON "pub_values"("pubId");

CREATE INDEX "pub_values_fieldId_idx" ON "pub_values"("fieldId");

CREATE INDEX "pub_values_relatedPubId_idx" ON "pub_values"("relatedPubId");

-- pubs: optimize queries by communityId and pubTypeId
CREATE INDEX "pubs_communityId_idx" ON "pubs"("communityId");

CREATE INDEX "pubs_pubTypeId_idx" ON "pubs"("pubTypeId");

CREATE INDEX "pubs_communityId_pubTypeId_idx" ON "pubs"("communityId", "pubTypeId");

-- pub_types: optimize queries by communityId
CREATE INDEX "pub_types_communityId_idx" ON "pub_types"("communityId");

-- pub_fields: optimize queries by communityId
CREATE INDEX "pub_fields_communityId_idx" ON "pub_fields"("communityId");

CREATE INDEX "pub_fields_pubFieldSchemaId_idx" ON "pub_fields"("pubFieldSchemaId");

-- PubsInStages: optimize queries on pubId and stageId
CREATE INDEX "PubsInStages_pubId_idx" ON "PubsInStages"("pubId");

CREATE INDEX "PubsInStages_stageId_idx" ON "PubsInStages"("stageId");

-- membership tables: optimize queries for authorization checks
CREATE INDEX "community_memberships_communityId_idx" ON "community_memberships"("communityId");

CREATE INDEX "community_memberships_userId_idx" ON "community_memberships"("userId");

CREATE INDEX "community_memberships_memberGroupId_idx" ON "community_memberships"("memberGroupId");

CREATE INDEX "pub_memberships_pubId_idx" ON "pub_memberships"("pubId");

CREATE INDEX "pub_memberships_userId_idx" ON "pub_memberships"("userId");

CREATE INDEX "pub_memberships_memberGroupId_idx" ON "pub_memberships"("memberGroupId");

CREATE INDEX "stage_memberships_stageId_idx" ON "stage_memberships"("stageId");

CREATE INDEX "stage_memberships_userId_idx" ON "stage_memberships"("userId");

CREATE INDEX "stage_memberships_memberGroupId_idx" ON "stage_memberships"("memberGroupId");

-- membership_capabilities: optimize queries for authorization
CREATE INDEX "membership_capabilities_role_type_idx" ON "membership_capabilities"("role", "type");

CREATE INDEX "membership_capabilities_capability_idx" ON "membership_capabilities"("capability");

-- stages: optimize queries by communityId
CREATE INDEX "stages_communityId_idx" ON "stages"("communityId");

-- forms: optimize queries by communityId and pubTypeId
CREATE INDEX "forms_communityId_idx" ON "forms"("communityId");

CREATE INDEX "forms_pubTypeId_idx" ON "forms"("pubTypeId");

-- form_elements: optimize queries by formId and fieldId
CREATE INDEX "form_elements_formId_idx" ON "form_elements"("formId");

CREATE INDEX "form_elements_fieldId_idx" ON "form_elements"("fieldId");

CREATE INDEX "form_elements_stageId_idx" ON "form_elements"("stageId");

-- invites: optimize queries by communityId, userId, pubId, stageId, and status
CREATE INDEX "invites_communityId_idx" ON "invites"("communityId");

CREATE INDEX "invites_userId_idx" ON "invites"("userId");

CREATE INDEX "invites_pubId_idx" ON "invites"("pubId");

CREATE INDEX "invites_stageId_idx" ON "invites"("stageId");

CREATE INDEX "invites_status_idx" ON "invites"("status");

-- invite_forms: optimize queries by inviteId
CREATE INDEX "invite_forms_inviteId_idx" ON "invite_forms"("inviteId");

CREATE INDEX "invite_forms_formId_idx" ON "invite_forms"("formId");

-- sessions and auth_tokens: optimize queries by userId
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

CREATE INDEX "auth_tokens_userId_idx" ON "auth_tokens"("userId");

-- member_groups: optimize queries by communityId
CREATE INDEX "member_groups_communityId_idx" ON "member_groups"("communityId");

-- api_access_tokens: optimize queries by communityId
CREATE INDEX "api_access_tokens_communityId_idx" ON "api_access_tokens"("communityId");

CREATE INDEX "api_access_tokens_issuedById_idx" ON "api_access_tokens"("issuedById");

-- api_access_logs: optimize queries by accessTokenId
CREATE INDEX "api_access_logs_accessTokenId_idx" ON "api_access_logs"("accessTokenId");

-- move_constraint: optimize queries by stageId
CREATE INDEX "move_constraint_stageId_idx" ON "move_constraint"("stageId");

CREATE INDEX "move_constraint_destinationId_idx" ON "move_constraint"("destinationId");

-- history tables for audit queries
CREATE INDEX "pub_values_history_userId_idx" ON "pub_values_history"("userId");

CREATE INDEX "pub_values_history_actionRunId_idx" ON "pub_values_history"("actionRunId");

CREATE INDEX "invites_history_userId_idx" ON "invites_history"("userId");

CREATE INDEX "invites_history_actionRunId_idx" ON "invites_history"("actionRunId");

-- whoops, forgot to add this foreign key
ALTER TABLE "automation_runs"
    ADD CONSTRAINT "automation_runs_inputPubId_fkey" FOREIGN KEY ("inputPubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

