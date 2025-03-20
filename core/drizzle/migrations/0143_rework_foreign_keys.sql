ALTER TABLE "action_instances" DROP CONSTRAINT "action_instances_stageId_fkey";
--> statement-breakpoint
ALTER TABLE "action_runs" DROP CONSTRAINT "action_runs_actionInstanceId_fkey";
--> statement-breakpoint
ALTER TABLE "action_runs" DROP CONSTRAINT "action_runs_pubId_fkey";
--> statement-breakpoint
ALTER TABLE "action_runs" DROP CONSTRAINT "action_runs_userId_fkey";
--> statement-breakpoint
ALTER TABLE "action_runs" DROP CONSTRAINT "action_runs_sourceActionRunId_fkey";
--> statement-breakpoint
ALTER TABLE "api_access_logs" DROP CONSTRAINT "api_access_logs_accessTokenId_fkey";
--> statement-breakpoint
ALTER TABLE "api_access_permissions" DROP CONSTRAINT "api_access_permissions_apiAccessTokenId_fkey";
--> statement-breakpoint
ALTER TABLE "api_access_tokens" DROP CONSTRAINT "api_access_tokens_communityId_fkey";
--> statement-breakpoint
ALTER TABLE "api_access_tokens" DROP CONSTRAINT "api_access_tokens_issuedById_fkey";
--> statement-breakpoint
ALTER TABLE "auth_tokens" DROP CONSTRAINT "auth_tokens_userId_fkey";
--> statement-breakpoint
ALTER TABLE "community_memberships" DROP CONSTRAINT "community_memberships_communityId_fkey";
--> statement-breakpoint
ALTER TABLE "community_memberships" DROP CONSTRAINT "community_memberships_userId_fkey";
--> statement-breakpoint
ALTER TABLE "community_memberships" DROP CONSTRAINT "community_memberships_memberGroupId_fkey";
--> statement-breakpoint
ALTER TABLE "form_elements" DROP CONSTRAINT "form_elements_stageId_fkey";
--> statement-breakpoint
ALTER TABLE "form_elements" DROP CONSTRAINT "form_elements_fieldId_fkey";
--> statement-breakpoint
ALTER TABLE "form_elements" DROP CONSTRAINT "form_elements_formId_fkey";
--> statement-breakpoint
ALTER TABLE "form_memberships" DROP CONSTRAINT "form_memberships_formId_fkey";
--> statement-breakpoint
ALTER TABLE "form_memberships" DROP CONSTRAINT "form_memberships_userId_fkey";
--> statement-breakpoint
ALTER TABLE "form_memberships" DROP CONSTRAINT "form_memberships_memberGroupId_fkey";
--> statement-breakpoint
ALTER TABLE "form_memberships" DROP CONSTRAINT "form_memberships_pubId_fkey";
--> statement-breakpoint
ALTER TABLE "forms" DROP CONSTRAINT "forms_pubTypeId_fkey";
--> statement-breakpoint
ALTER TABLE "forms" DROP CONSTRAINT "forms_communityId_fkey";
--> statement-breakpoint
ALTER TABLE "_MemberGroupToUser" DROP CONSTRAINT "_MemberGroupToUser_A_fkey";
--> statement-breakpoint
ALTER TABLE "_MemberGroupToUser" DROP CONSTRAINT "_MemberGroupToUser_B_fkey";
--> statement-breakpoint
ALTER TABLE "member_groups" DROP CONSTRAINT "member_groups_communityId_fkey";
--> statement-breakpoint
ALTER TABLE "move_constraint" DROP CONSTRAINT "move_constraint_stageId_fkey";
--> statement-breakpoint
ALTER TABLE "move_constraint" DROP CONSTRAINT "move_constraint_destinationId_fkey";
--> statement-breakpoint
ALTER TABLE "_PubFieldToPubType" DROP CONSTRAINT "_PubFieldToPubType_A_fkey";
--> statement-breakpoint
ALTER TABLE "_PubFieldToPubType" DROP CONSTRAINT "_PubFieldToPubType_B_fkey";
--> statement-breakpoint
ALTER TABLE "pub_fields" DROP CONSTRAINT "pub_fields_pubFieldSchemaId_fkey";
--> statement-breakpoint
ALTER TABLE "pub_fields" DROP CONSTRAINT "pub_fields_communityId_fkey";
--> statement-breakpoint
ALTER TABLE "pub_memberships" DROP CONSTRAINT "pub_memberships_pubId_fkey";
--> statement-breakpoint
ALTER TABLE "pub_memberships" DROP CONSTRAINT "pub_memberships_userId_fkey";
--> statement-breakpoint
ALTER TABLE "pub_memberships" DROP CONSTRAINT "pub_memberships_memberGroupId_fkey";
--> statement-breakpoint
ALTER TABLE "pub_types" DROP CONSTRAINT "pub_types_communityId_fkey";
--> statement-breakpoint
ALTER TABLE "pub_values" DROP CONSTRAINT "pub_values_fieldId_fkey";
--> statement-breakpoint
ALTER TABLE "pub_values" DROP CONSTRAINT "pub_values_pubId_fkey";
--> statement-breakpoint
ALTER TABLE "pub_values" DROP CONSTRAINT "pub_values_relatedPubId_fkey";
--> statement-breakpoint
ALTER TABLE "pub_values_history" DROP CONSTRAINT "pub_values_history_userId_fkey";
--> statement-breakpoint
ALTER TABLE "pub_values_history" DROP CONSTRAINT "pub_values_history_apiAccessTokenId_fkey";
--> statement-breakpoint
ALTER TABLE "pub_values_history" DROP CONSTRAINT "pub_values_history_actionRunId_fkey";
--> statement-breakpoint
ALTER TABLE "pubs" DROP CONSTRAINT "pubs_pubTypeId_fkey";
--> statement-breakpoint
ALTER TABLE "pubs" DROP CONSTRAINT "pubs_communityId_fkey";
--> statement-breakpoint
ALTER TABLE "pubs" DROP CONSTRAINT "pubs_assigneeId_fkey";
--> statement-breakpoint
ALTER TABLE "PubsInStages" DROP CONSTRAINT "PubsInStages_pubId_fkey";
--> statement-breakpoint
ALTER TABLE "PubsInStages" DROP CONSTRAINT "PubsInStages_stageId_fkey";
--> statement-breakpoint
ALTER TABLE "rules" DROP CONSTRAINT "rules_actionInstanceId_fkey";
--> statement-breakpoint
ALTER TABLE "rules" DROP CONSTRAINT "rules_sourceActionInstanceId_fkey";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";
--> statement-breakpoint
ALTER TABLE "stage_memberships" DROP CONSTRAINT "stage_memberships_stageId_fkey";
--> statement-breakpoint
ALTER TABLE "stage_memberships" DROP CONSTRAINT "stage_memberships_userId_fkey";
--> statement-breakpoint
ALTER TABLE "stage_memberships" DROP CONSTRAINT "stage_memberships_memberGroupId_fkey";
--> statement-breakpoint
ALTER TABLE "stages" DROP CONSTRAINT "stages_communityId_fkey";
--> statement-breakpoint
ALTER TABLE "action_instances" ADD CONSTRAINT "action_instances_stageId_stages_id_fk" FOREIGN KEY ("stageId") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_actionInstanceId_action_instances_id_fk" FOREIGN KEY ("actionInstanceId") REFERENCES "public"."action_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_pubId_pubs_id_fk" FOREIGN KEY ("pubId") REFERENCES "public"."pubs"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_sourceActionRunId_action_runs_id_fk" FOREIGN KEY ("sourceActionRunId") REFERENCES "public"."action_runs"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "api_access_logs" ADD CONSTRAINT "api_access_logs_accessTokenId_api_access_tokens_id_fk" FOREIGN KEY ("accessTokenId") REFERENCES "public"."api_access_tokens"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "api_access_permissions" ADD CONSTRAINT "api_access_permissions_apiAccessTokenId_api_access_tokens_id_fk" FOREIGN KEY ("apiAccessTokenId") REFERENCES "public"."api_access_tokens"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "api_access_tokens" ADD CONSTRAINT "api_access_tokens_communityId_communities_id_fk" FOREIGN KEY ("communityId") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "api_access_tokens" ADD CONSTRAINT "api_access_tokens_issuedById_users_id_fk" FOREIGN KEY ("issuedById") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_communityId_communities_id_fk" FOREIGN KEY ("communityId") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_memberGroupId_member_groups_id_fk" FOREIGN KEY ("memberGroupId") REFERENCES "public"."member_groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "form_elements" ADD CONSTRAINT "form_elements_fieldId_pub_fields_id_fk" FOREIGN KEY ("fieldId") REFERENCES "public"."pub_fields"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "form_elements" ADD CONSTRAINT "form_elements_formId_forms_id_fk" FOREIGN KEY ("formId") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "form_elements" ADD CONSTRAINT "form_elements_stageId_stages_id_fk" FOREIGN KEY ("stageId") REFERENCES "public"."stages"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "form_memberships" ADD CONSTRAINT "form_memberships_formId_forms_id_fk" FOREIGN KEY ("formId") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "form_memberships" ADD CONSTRAINT "form_memberships_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "form_memberships" ADD CONSTRAINT "form_memberships_memberGroupId_member_groups_id_fk" FOREIGN KEY ("memberGroupId") REFERENCES "public"."member_groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "form_memberships" ADD CONSTRAINT "form_memberships_pubId_pubs_id_fk" FOREIGN KEY ("pubId") REFERENCES "public"."pubs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_pubTypeId_pub_types_id_fk" FOREIGN KEY ("pubTypeId") REFERENCES "public"."pub_types"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_communityId_communities_id_fk" FOREIGN KEY ("communityId") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_MemberGroupToUser" ADD CONSTRAINT "_MemberGroupToUser_A_member_groups_id_fk" FOREIGN KEY ("A") REFERENCES "public"."member_groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_MemberGroupToUser" ADD CONSTRAINT "_MemberGroupToUser_B_users_id_fk" FOREIGN KEY ("B") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "member_groups" ADD CONSTRAINT "member_groups_communityId_communities_id_fk" FOREIGN KEY ("communityId") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "move_constraint" ADD CONSTRAINT "move_constraint_stageId_stages_id_fk" FOREIGN KEY ("stageId") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "move_constraint" ADD CONSTRAINT "move_constraint_destinationId_stages_id_fk" FOREIGN KEY ("destinationId") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PubFieldToPubType" ADD CONSTRAINT "_PubFieldToPubType_A_pub_fields_id_fk" FOREIGN KEY ("A") REFERENCES "public"."pub_fields"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PubFieldToPubType" ADD CONSTRAINT "_PubFieldToPubType_B_pub_types_id_fk" FOREIGN KEY ("B") REFERENCES "public"."pub_types"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pub_fields" ADD CONSTRAINT "pub_fields_pubFieldSchemaId_PubFieldSchema_id_fk" FOREIGN KEY ("pubFieldSchemaId") REFERENCES "public"."PubFieldSchema"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pub_fields" ADD CONSTRAINT "pub_fields_communityId_communities_id_fk" FOREIGN KEY ("communityId") REFERENCES "public"."communities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pub_memberships" ADD CONSTRAINT "pub_memberships_pubId_pubs_id_fk" FOREIGN KEY ("pubId") REFERENCES "public"."pubs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pub_memberships" ADD CONSTRAINT "pub_memberships_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pub_memberships" ADD CONSTRAINT "pub_memberships_memberGroupId_member_groups_id_fk" FOREIGN KEY ("memberGroupId") REFERENCES "public"."member_groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pub_types" ADD CONSTRAINT "pub_types_communityId_communities_id_fk" FOREIGN KEY ("communityId") REFERENCES "public"."communities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_fieldId_pub_fields_id_fk" FOREIGN KEY ("fieldId") REFERENCES "public"."pub_fields"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_pubId_pubs_id_fk" FOREIGN KEY ("pubId") REFERENCES "public"."pubs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_relatedPubId_pubs_id_fk" FOREIGN KEY ("relatedPubId") REFERENCES "public"."pubs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pub_values_history" ADD CONSTRAINT "pub_values_history_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pub_values_history" ADD CONSTRAINT "pub_values_history_apiAccessTokenId_api_access_tokens_id_fk" FOREIGN KEY ("apiAccessTokenId") REFERENCES "public"."api_access_tokens"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pub_values_history" ADD CONSTRAINT "pub_values_history_actionRunId_action_runs_id_fk" FOREIGN KEY ("actionRunId") REFERENCES "public"."action_runs"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_pubTypeId_pub_types_id_fk" FOREIGN KEY ("pubTypeId") REFERENCES "public"."pub_types"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_communityId_communities_id_fk" FOREIGN KEY ("communityId") REFERENCES "public"."communities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_assigneeId_users_id_fk" FOREIGN KEY ("assigneeId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PubsInStages" ADD CONSTRAINT "PubsInStages_pubId_pubs_id_fk" FOREIGN KEY ("pubId") REFERENCES "public"."pubs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PubsInStages" ADD CONSTRAINT "PubsInStages_stageId_stages_id_fk" FOREIGN KEY ("stageId") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_actionInstanceId_action_instances_id_fk" FOREIGN KEY ("actionInstanceId") REFERENCES "public"."action_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_sourceActionInstanceId_action_instances_id_fk" FOREIGN KEY ("sourceActionInstanceId") REFERENCES "public"."action_instances"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stage_memberships" ADD CONSTRAINT "stage_memberships_stageId_stages_id_fk" FOREIGN KEY ("stageId") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stage_memberships" ADD CONSTRAINT "stage_memberships_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stage_memberships" ADD CONSTRAINT "stage_memberships_memberGroupId_member_groups_id_fk" FOREIGN KEY ("memberGroupId") REFERENCES "public"."member_groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_communityId_communities_id_fk" FOREIGN KEY ("communityId") REFERENCES "public"."communities"("id") ON DELETE restrict ON UPDATE cascade;