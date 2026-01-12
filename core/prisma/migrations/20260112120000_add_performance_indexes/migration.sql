-- action_runs: critical! seq scan of 6180 rows filtering to 1, looped 25 times
CREATE INDEX "action_runs_automationRunId_idx" ON "action_runs"("automationRunId");
CREATE INDEX "action_runs_pubId_idx" ON "action_runs"("pubId");
CREATE INDEX "action_runs_userId_idx" ON "action_runs"("userId");
CREATE INDEX "action_runs_actionInstanceId_idx" ON "action_runs"("actionInstanceId");
CREATE INDEX "action_runs_status_idx" ON "action_runs"("status");

-- automation_runs: frequently filtered and sorted
CREATE INDEX "automation_runs_automationId_idx" ON "automation_runs"("automationId");
CREATE INDEX "automation_runs_inputPubId_idx" ON "automation_runs"("inputPubId");
CREATE INDEX "automation_runs_sourceUserId_idx" ON "automation_runs"("sourceUserId");
CREATE INDEX "automation_runs_sourceAutomationRunId_idx" ON "automation_runs"("sourceAutomationRunId");
CREATE INDEX "automation_runs_status_idx" ON "automation_runs"("status");
-- composite for common query pattern: filter by automation, sort by createdAt
CREATE INDEX "automation_runs_automationId_createdAt_idx" ON "automation_runs"("automationId", "createdAt" DESC);

-- automations: filtered by communityId and stageId
CREATE INDEX "automations_communityId_idx" ON "automations"("communityId");
CREATE INDEX "automations_stageId_idx" ON "automations"("stageId");

-- automation_triggers: filtered by event and automationId
CREATE INDEX "automation_triggers_automationId_idx" ON "automation_triggers"("automationId");
CREATE INDEX "automation_triggers_event_idx" ON "automation_triggers"("event");
CREATE INDEX "automation_triggers_sourceAutomationId_idx" ON "automation_triggers"("sourceAutomationId");

-- action_instances: joined via automationId
CREATE INDEX "action_instances_automationId_idx" ON "action_instances"("automationId");

-- automation_condition_blocks: filtered by automationId
CREATE INDEX "automation_condition_blocks_automationId_idx" ON "automation_condition_blocks"("automationId");
CREATE INDEX "automation_condition_blocks_parent_idx" ON "automation_condition_blocks"("automationConditionBlockId");

-- automation_conditions: joined via automationConditionBlockId
CREATE INDEX "automation_conditions_blockId_idx" ON "automation_conditions"("automationConditionBlockId");

-- pub_values: critical! seq scan removing 3491 rows, looped 12 times
-- note: partial unique indexes exist on (pubId, fieldId) and (pubId, relatedPubId, fieldId)
-- but we need a non-partial index on pubId for general lookups
CREATE INDEX "pub_values_pubId_idx" ON "pub_values"("pubId");
CREATE INDEX "pub_values_fieldId_idx" ON "pub_values"("fieldId");
CREATE INDEX "pub_values_relatedPubId_idx" ON "pub_values"("relatedPubId");

-- pubs: commonly filtered by communityId and pubTypeId
CREATE INDEX "pubs_communityId_idx" ON "pubs"("communityId");
CREATE INDEX "pubs_pubTypeId_idx" ON "pubs"("pubTypeId");
CREATE INDEX "pubs_communityId_pubTypeId_idx" ON "pubs"("communityId", "pubTypeId");

-- pub_types: filtered by communityId
CREATE INDEX "pub_types_communityId_idx" ON "pub_types"("communityId");

-- pub_fields: filtered by communityId
CREATE INDEX "pub_fields_communityId_idx" ON "pub_fields"("communityId");
CREATE INDEX "pub_fields_pubFieldSchemaId_idx" ON "pub_fields"("pubFieldSchemaId");

-- PubsInStages: composite PK exists but single column indexes help some queries
CREATE INDEX "PubsInStages_pubId_idx" ON "PubsInStages"("pubId");
CREATE INDEX "PubsInStages_stageId_idx" ON "PubsInStages"("stageId");

-- membership tables: heavily used in authorization checks
CREATE INDEX "community_memberships_communityId_idx" ON "community_memberships"("communityId");
CREATE INDEX "community_memberships_userId_idx" ON "community_memberships"("userId");
CREATE INDEX "community_memberships_memberGroupId_idx" ON "community_memberships"("memberGroupId");

CREATE INDEX "pub_memberships_pubId_idx" ON "pub_memberships"("pubId");
CREATE INDEX "pub_memberships_userId_idx" ON "pub_memberships"("userId");
CREATE INDEX "pub_memberships_memberGroupId_idx" ON "pub_memberships"("memberGroupId");

CREATE INDEX "stage_memberships_stageId_idx" ON "stage_memberships"("stageId");
CREATE INDEX "stage_memberships_userId_idx" ON "stage_memberships"("userId");
CREATE INDEX "stage_memberships_memberGroupId_idx" ON "stage_memberships"("memberGroupId");

-- membership_capabilities: used in CTE for authorization
CREATE INDEX "membership_capabilities_role_type_idx" ON "membership_capabilities"("role", "type");
CREATE INDEX "membership_capabilities_capability_idx" ON "membership_capabilities"("capability");

-- stages: filtered by communityId
CREATE INDEX "stages_communityId_idx" ON "stages"("communityId");

-- forms: commonly filtered
CREATE INDEX "forms_communityId_idx" ON "forms"("communityId");
CREATE INDEX "forms_pubTypeId_idx" ON "forms"("pubTypeId");

-- form_elements: joined via formId and fieldId
CREATE INDEX "form_elements_formId_idx" ON "form_elements"("formId");
CREATE INDEX "form_elements_fieldId_idx" ON "form_elements"("fieldId");
CREATE INDEX "form_elements_stageId_idx" ON "form_elements"("stageId");

-- invites: commonly filtered
CREATE INDEX "invites_communityId_idx" ON "invites"("communityId");
CREATE INDEX "invites_userId_idx" ON "invites"("userId");
CREATE INDEX "invites_pubId_idx" ON "invites"("pubId");
CREATE INDEX "invites_stageId_idx" ON "invites"("stageId");
CREATE INDEX "invites_status_idx" ON "invites"("status");

-- invite_forms: joined via inviteId
CREATE INDEX "invite_forms_inviteId_idx" ON "invite_forms"("inviteId");
CREATE INDEX "invite_forms_formId_idx" ON "invite_forms"("formId");

-- sessions and auth_tokens: filtered by userId
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX "auth_tokens_userId_idx" ON "auth_tokens"("userId");

-- member_groups: filtered by communityId
CREATE INDEX "member_groups_communityId_idx" ON "member_groups"("communityId");

-- api_access_tokens: filtered by communityId
CREATE INDEX "api_access_tokens_communityId_idx" ON "api_access_tokens"("communityId");
CREATE INDEX "api_access_tokens_issuedById_idx" ON "api_access_tokens"("issuedById");

-- api_access_logs: joined via accessTokenId
CREATE INDEX "api_access_logs_accessTokenId_idx" ON "api_access_logs"("accessTokenId");

-- move_constraint: filtered by stageId
CREATE INDEX "move_constraint_stageId_idx" ON "move_constraint"("stageId");
CREATE INDEX "move_constraint_destinationId_idx" ON "move_constraint"("destinationId");

-- history tables for audit queries
CREATE INDEX "pub_values_history_userId_idx" ON "pub_values_history"("userId");
CREATE INDEX "pub_values_history_actionRunId_idx" ON "pub_values_history"("actionRunId");
CREATE INDEX "invites_history_userId_idx" ON "invites_history"("userId");
CREATE INDEX "invites_history_actionRunId_idx" ON "invites_history"("actionRunId");
