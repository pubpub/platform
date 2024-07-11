/*
Warnings:

- You are about to drop the column `instance_id` on the `IntegrationInstanceState` table. All the data in the column will be lost.
- You are about to drop the column `pub_id` on the `IntegrationInstanceState` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `PubFieldSchema` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `PubFieldSchema` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `action_claim` table. All the data in the column will be lost.
- You are about to drop the column `pub_id` on the `action_claim` table. All the data in the column will be lost.
- You are about to drop the column `stage_id` on the `action_claim` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `action_claim` table. All the data in the column will be lost.
- You are about to drop the column `user_id` on the `action_claim` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `action_instances` table. All the data in the column will be lost.
- You are about to drop the column `stage_id` on the `action_instances` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `action_instances` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `action_move` table. All the data in the column will be lost.
- You are about to drop the column `destination_stage_id` on the `action_move` table. All the data in the column will be lost.
- You are about to drop the column `pub_id` on the `action_move` table. All the data in the column will be lost.
- You are about to drop the column `source_stage_id` on the `action_move` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `action_move` table. All the data in the column will be lost.
- You are about to drop the column `user_id` on the `action_move` table. All the data in the column will be lost.
- You are about to drop the column `action_instance_id` on the `action_runs` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `action_runs` table. All the data in the column will be lost.
- You are about to drop the column `pub_id` on the `action_runs` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `action_runs` table. All the data in the column will be lost.
- You are about to drop the column `user_id` on the `action_runs` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `auth_tokens` table. All the data in the column will be lost.
- You are about to drop the column `user_id` on the `auth_tokens` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `communities` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `communities` table. All the data in the column will be lost.
- You are about to drop the column `field_id` on the `form_inputs` table. All the data in the column will be lost.
- You are about to drop the column `form_id` on the `form_inputs` table. All the data in the column will be lost.
- You are about to drop the column `is_submit` on the `form_inputs` table. All the data in the column will be lost.
- You are about to drop the column `pub_type_id` on the `forms` table. All the data in the column will be lost.
- You are about to drop the column `community_id` on the `integration_instances` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `integration_instances` table. All the data in the column will be lost.
- You are about to drop the column `integration_id` on the `integration_instances` table. All the data in the column will be lost.
- You are about to drop the column `stage_id` on the `integration_instances` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `integration_instances` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `integrations` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `integrations` table. All the data in the column will be lost.
- You are about to drop the column `community_id` on the `member_groups` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `member_groups` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `member_groups` table. All the data in the column will be lost.
- You are about to drop the column `community_id` on the `members` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `members` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `members` table. All the data in the column will be lost.
- You are about to drop the column `user_id` on the `members` table. All the data in the column will be lost.
- The primary key for the `move_constraint` table will be changed. If it partially fails, the table could be left without primary key constraint.
- You are about to drop the column `created_at` on the `move_constraint` table. All the data in the column will be lost.
- You are about to drop the column `destination_id` on the `move_constraint` table. All the data in the column will be lost.
- You are about to drop the column `stage_id` on the `move_constraint` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `move_constraint` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `permissions` table. All the data in the column will be lost.
- You are about to drop the column `member_group_id` on the `permissions` table. All the data in the column will be lost.
- You are about to drop the column `member_id` on the `permissions` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `permissions` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `pub_fields` table. All the data in the column will be lost.
- You are about to drop the column `integration_id` on the `pub_fields` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `pub_fields` table. All the data in the column will be lost.
- You are about to drop the column `community_id` on the `pub_types` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `pub_types` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `pub_types` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `pub_values` table. All the data in the column will be lost.
- You are about to drop the column `field_id` on the `pub_values` table. All the data in the column will be lost.
- You are about to drop the column `pub_id` on the `pub_values` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `pub_values` table. All the data in the column will be lost.
- You are about to drop the column `assignee_id` on the `pubs` table. All the data in the column will be lost.
- You are about to drop the column `community_id` on the `pubs` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `pubs` table. All the data in the column will be lost.
- You are about to drop the column `parent_id` on the `pubs` table. All the data in the column will be lost.
- You are about to drop the column `pub_type_id` on the `pubs` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `pubs` table. All the data in the column will be lost.
- You are about to drop the column `action_instance_id` on the `rules` table. All the data in the column will be lost.
- You are about to drop the column `community_id` on the `stages` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `stages` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `stages` table. All the data in the column will be lost.
- You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
- You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
- A unique constraint covering the columns `[pubId,instanceId]` on the table `IntegrationInstanceState` will be added. If there are existing duplicate values, this will fail.
- A unique constraint covering the columns `[actionInstanceId,event]` on the table `rules` will be added. If there are existing duplicate values, this will fail.
- Added the required column `instanceId` to the `IntegrationInstanceState` table without a default value. This is not possible if the table is not empty.
- Added the required column `pubId` to the `IntegrationInstanceState` table without a default value. This is not possible if the table is not empty.
- Added the required column `pubId` to the `action_claim` table without a default value. This is not possible if the table is not empty.
- Added the required column `stageId` to the `action_claim` table without a default value. This is not possible if the table is not empty.
- Added the required column `userId` to the `action_claim` table without a default value. This is not possible if the table is not empty.
- Added the required column `stageId` to the `action_instances` table without a default value. This is not possible if the table is not empty.
- Added the required column `destinationStageId` to the `action_move` table without a default value. This is not possible if the table is not empty.
- Added the required column `pubId` to the `action_move` table without a default value. This is not possible if the table is not empty.
- Added the required column `sourceStageId` to the `action_move` table without a default value. This is not possible if the table is not empty.
- Added the required column `userId` to the `action_move` table without a default value. This is not possible if the table is not empty.
- Added the required column `userId` to the `auth_tokens` table without a default value. This is not possible if the table is not empty.
- Added the required column `fieldId` to the `form_inputs` table without a default value. This is not possible if the table is not empty.
- Added the required column `formId` to the `form_inputs` table without a default value. This is not possible if the table is not empty.
- Added the required column `isSubmit` to the `form_inputs` table without a default value. This is not possible if the table is not empty.
- Added the required column `pubTypeId` to the `forms` table without a default value. This is not possible if the table is not empty.
- Added the required column `communityId` to the `integration_instances` table without a default value. This is not possible if the table is not empty.
- Added the required column `integrationId` to the `integration_instances` table without a default value. This is not possible if the table is not empty.
- Added the required column `communityId` to the `member_groups` table without a default value. This is not possible if the table is not empty.
- Added the required column `communityId` to the `members` table without a default value. This is not possible if the table is not empty.
- Added the required column `userId` to the `members` table without a default value. This is not possible if the table is not empty.
- Added the required column `destinationId` to the `move_constraint` table without a default value. This is not possible if the table is not empty.
- Added the required column `stageId` to the `move_constraint` table without a default value. This is not possible if the table is not empty.
- Added the required column `communityId` to the `pub_types` table without a default value. This is not possible if the table is not empty.
- Added the required column `fieldId` to the `pub_values` table without a default value. This is not possible if the table is not empty.
- Added the required column `pubId` to the `pub_values` table without a default value. This is not possible if the table is not empty.
- Added the required column `communityId` to the `pubs` table without a default value. This is not possible if the table is not empty.
- Added the required column `pubTypeId` to the `pubs` table without a default value. This is not possible if the table is not empty.
- Added the required column `actionInstanceId` to the `rules` table without a default value. This is not possible if the table is not empty.
- Added the required column `communityId` to the `stages` table without a default value. This is not possible if the table is not empty.

 */
-- DropForeignKey
ALTER TABLE "IntegrationInstanceState"
DROP CONSTRAINT "IntegrationInstanceState_instance_id_fkey";

-- DropForeignKey
ALTER TABLE "IntegrationInstanceState"
DROP CONSTRAINT "IntegrationInstanceState_pub_id_fkey";

-- DropForeignKey
ALTER TABLE "action_claim"
DROP CONSTRAINT "action_claim_pub_id_fkey";

-- DropForeignKey
ALTER TABLE "action_claim"
DROP CONSTRAINT "action_claim_stage_id_fkey";

-- DropForeignKey
ALTER TABLE "action_claim"
DROP CONSTRAINT "action_claim_user_id_fkey";

-- DropForeignKey
ALTER TABLE "action_instances"
DROP CONSTRAINT "action_instances_stage_id_fkey";

-- DropForeignKey
ALTER TABLE "action_move"
DROP CONSTRAINT "action_move_destination_stage_id_fkey";

-- DropForeignKey
ALTER TABLE "action_move"
DROP CONSTRAINT "action_move_pub_id_fkey";

-- DropForeignKey
ALTER TABLE "action_move"
DROP CONSTRAINT "action_move_source_stage_id_fkey";

-- DropForeignKey
ALTER TABLE "action_move"
DROP CONSTRAINT "action_move_user_id_fkey";

-- DropForeignKey
ALTER TABLE "action_runs"
DROP CONSTRAINT "action_runs_action_instance_id_fkey";

-- DropForeignKey
ALTER TABLE "action_runs"
DROP CONSTRAINT "action_runs_pub_id_fkey";

-- DropForeignKey
ALTER TABLE "action_runs"
DROP CONSTRAINT "action_runs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "auth_tokens"
DROP CONSTRAINT "auth_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "form_inputs"
DROP CONSTRAINT "form_inputs_field_id_fkey";

-- DropForeignKey
ALTER TABLE "form_inputs"
DROP CONSTRAINT "form_inputs_form_id_fkey";

-- DropForeignKey
ALTER TABLE "forms"
DROP CONSTRAINT "forms_pub_type_id_fkey";

-- DropForeignKey
ALTER TABLE "integration_instances"
DROP CONSTRAINT "integration_instances_community_id_fkey";

-- DropForeignKey
ALTER TABLE "integration_instances"
DROP CONSTRAINT "integration_instances_integration_id_fkey";

-- DropForeignKey
ALTER TABLE "integration_instances"
DROP CONSTRAINT "integration_instances_stage_id_fkey";

-- DropForeignKey
ALTER TABLE "member_groups"
DROP CONSTRAINT "member_groups_community_id_fkey";

-- DropForeignKey
ALTER TABLE "members"
DROP CONSTRAINT "members_community_id_fkey";

-- DropForeignKey
ALTER TABLE "members"
DROP CONSTRAINT "members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "move_constraint"
DROP CONSTRAINT "move_constraint_destination_id_fkey";

-- DropForeignKey
ALTER TABLE "move_constraint"
DROP CONSTRAINT "move_constraint_stage_id_fkey";

-- DropForeignKey
ALTER TABLE "permissions"
DROP CONSTRAINT "permissions_member_group_id_fkey";

-- DropForeignKey
ALTER TABLE "permissions"
DROP CONSTRAINT "permissions_member_id_fkey";

-- DropForeignKey
ALTER TABLE "pub_fields"
DROP CONSTRAINT "pub_fields_integration_id_fkey";

-- DropForeignKey
ALTER TABLE "pub_types"
DROP CONSTRAINT "pub_types_community_id_fkey";

-- DropForeignKey
ALTER TABLE "pub_values"
DROP CONSTRAINT "pub_values_field_id_fkey";

-- DropForeignKey
ALTER TABLE "pub_values"
DROP CONSTRAINT "pub_values_pub_id_fkey";

-- DropForeignKey
ALTER TABLE "pubs"
DROP CONSTRAINT "pubs_assignee_id_fkey";

-- DropForeignKey
ALTER TABLE "pubs"
DROP CONSTRAINT "pubs_community_id_fkey";

-- DropForeignKey
ALTER TABLE "pubs"
DROP CONSTRAINT "pubs_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "pubs"
DROP CONSTRAINT "pubs_pub_type_id_fkey";

-- DropForeignKey
ALTER TABLE "rules"
DROP CONSTRAINT "rules_action_instance_id_fkey";

-- DropForeignKey
ALTER TABLE "stages"
DROP CONSTRAINT "stages_community_id_fkey";

-- DropIndex
DROP INDEX "IntegrationInstanceState_pub_id_instance_id_key";

-- DropIndex
DROP INDEX "rules_action_instance_id_event_key";

-- AlterTable
ALTER TABLE "IntegrationInstanceState"
RENAME COLUMN "instance_id" to "instanceId";

ALTER TABLE "IntegrationInstanceState"
RENAME COLUMN "pub_id" to "pubId";

-- AlterTable
ALTER TABLE "PubFieldSchema"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "PubFieldSchema"
RENAME COLUMN "updated_at" to "updatedAt";

-- AlterTable
ALTER TABLE "action_claim"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "action_claim"
RENAME COLUMN "pub_id" to "pubId";

ALTER TABLE "action_claim"
RENAME COLUMN "stage_id" to "stageId";

ALTER TABLE "action_claim"
RENAME COLUMN "updated_at" to "updatedAt";

ALTER TABLE "action_claim"
RENAME COLUMN "user_id" to "userId";

-- AlterTable
ALTER TABLE "action_instances"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "action_instances"
RENAME COLUMN "stage_id" to "stageId";

ALTER TABLE "action_instances"
RENAME COLUMN "updated_at" to "updatedAt";

-- AlterTable
ALTER TABLE "action_move"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "action_move"
RENAME COLUMN "destination_stage_id" to "destinationStageId";

ALTER TABLE "action_move"
RENAME COLUMN "pub_id" to "pubId";

ALTER TABLE "action_move"
RENAME COLUMN "source_stage_id" to "sourceStageId";

ALTER TABLE "action_move"
RENAME COLUMN "updated_at" to "updatedAt";

ALTER TABLE "action_move"
RENAME COLUMN "user_id" to "userId";

-- AlterTable
ALTER TABLE "action_runs"
RENAME COLUMN "action_instance_id" to "actionInstanceId";

ALTER TABLE "action_runs"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "action_runs"
RENAME COLUMN "pub_id" to "pubId";

ALTER TABLE "action_runs"
RENAME COLUMN "updated_at" to "updatedAt";

ALTER TABLE "action_runs"
RENAME COLUMN "user_id" to "userId";

-- AlterTable
ALTER TABLE "auth_tokens"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "auth_tokens"
RENAME COLUMN "user_id" to "userId";

-- AlterTable
ALTER TABLE "communities"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "communities"
RENAME COLUMN "updated_at" to "updatedAt";

-- AlterTable
ALTER TABLE "form_inputs"
RENAME COLUMN "field_id" to "fieldId";

ALTER TABLE "form_inputs"
RENAME COLUMN "form_id" to "formId";

ALTER TABLE "form_inputs"
RENAME COLUMN "is_submit" to "isSubmit";

-- AlterTable
ALTER TABLE "forms"
RENAME COLUMN "pub_type_id" to "pubTypeId";

-- AlterTable
ALTER TABLE "integration_instances"
RENAME COLUMN "community_id" to "communityId";

ALTER TABLE "integration_instances"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "integration_instances"
RENAME COLUMN "integration_id" to "integrationId";

ALTER TABLE "integration_instances"
RENAME COLUMN "stage_id" to "stageId";

ALTER TABLE "integration_instances"
RENAME COLUMN "updated_at" to "updatedAt";

-- AlterTable
ALTER TABLE "integrations"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "integrations"
RENAME COLUMN "updated_at" to "updatedAt";

-- AlterTable
ALTER TABLE "member_groups"
RENAME COLUMN "community_id" to "communityId";

ALTER TABLE "member_groups"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "member_groups"
RENAME COLUMN "updated_at" to "updatedAt";

-- AlterTable
ALTER TABLE "members"
RENAME COLUMN "community_id" to "communityId";

ALTER TABLE "members"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "members"
RENAME COLUMN "updated_at" to "updatedAt";

ALTER TABLE "members"
RENAME COLUMN "user_id" to "userId";

-- AlterTable
ALTER TABLE "move_constraint"
DROP CONSTRAINT "move_constraint_pkey";

ALTER TABLE "move_constraint"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "move_constraint"
RENAME COLUMN "destination_id" to "destinationId";

ALTER TABLE "move_constraint"
RENAME COLUMN "stage_id" to "stageId";

ALTER TABLE "move_constraint"
RENAME COLUMN "updated_at" to "updatedAt";

ALTER TABLE "move_constraint" ADD CONSTRAINT "move_constraint_pkey" PRIMARY KEY ("stageId", "destinationId");

-- AlterTable
ALTER TABLE "permissions"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "permissions"
RENAME COLUMN "member_group_id" to "memberGroupId";

ALTER TABLE "permissions"
RENAME COLUMN "member_id" to "memberId";

ALTER TABLE "permissions"
RENAME COLUMN "updated_at" to "updatedAt";

-- AlterTable
ALTER TABLE "pub_fields"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "pub_fields"
RENAME COLUMN "integration_id" to "integrationId";

ALTER TABLE "pub_fields"
RENAME COLUMN "updated_at" to "updatedAt";

-- AlterTable
ALTER TABLE "pub_types"
RENAME COLUMN "community_id" to "communityId";

ALTER TABLE "pub_types"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "pub_types"
RENAME COLUMN "updated_at" to "updatedAt";

-- AlterTable
ALTER TABLE "pub_values"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "pub_values"
RENAME COLUMN "field_id" to "fieldId";

ALTER TABLE "pub_values"
RENAME COLUMN "pub_id" to "pubId";

ALTER TABLE "pub_values"
RENAME COLUMN "updated_at" to "updatedAt";

-- AlterTable
ALTER TABLE "pubs"
RENAME COLUMN "assignee_id" to "assigneeId";

ALTER TABLE "pubs"
RENAME COLUMN "community_id" to "communityId";

ALTER TABLE "pubs"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "pubs"
RENAME COLUMN "parent_id" to "parentId";

ALTER TABLE "pubs"
RENAME COLUMN "pub_type_id" to "pubTypeId";

ALTER TABLE "pubs"
RENAME COLUMN "updated_at" to "updatedAt";

-- AlterTable
ALTER TABLE "rules"
RENAME COLUMN "action_instance_id" to "actionInstanceId";

-- AlterTable
ALTER TABLE "stages"
RENAME COLUMN "community_id" to "communityId";

ALTER TABLE "stages"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "stages"
RENAME COLUMN "updated_at" to "updatedAt";

-- AlterTable
ALTER TABLE "users"
RENAME COLUMN "created_at" to "createdAt";

ALTER TABLE "users"
RENAME COLUMN "updated_at" to "updatedAt";

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationInstanceState_pubId_instanceId_key" ON "IntegrationInstanceState" ("pubId", "instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "rules_actionInstanceId_event_key" ON "rules" ("actionInstanceId", "event");

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_pubTypeId_fkey" FOREIGN KEY ("pubTypeId") REFERENCES "pub_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "pubs" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_fields" ADD CONSTRAINT "pub_fields_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "pub_fields" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_types" ADD CONSTRAINT "pub_types_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stages" ADD CONSTRAINT "stages_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_constraint" ADD CONSTRAINT "move_constraint_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_constraint" ADD CONSTRAINT "move_constraint_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "stages" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_claim" ADD CONSTRAINT "action_claim_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_claim" ADD CONSTRAINT "action_claim_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_claim" ADD CONSTRAINT "action_claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_move" ADD CONSTRAINT "action_move_sourceStageId_fkey" FOREIGN KEY ("sourceStageId") REFERENCES "stages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_move" ADD CONSTRAINT "action_move_destinationStageId_fkey" FOREIGN KEY ("destinationStageId") REFERENCES "stages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_move" ADD CONSTRAINT "action_move_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_move" ADD CONSTRAINT "action_move_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_groups" ADD CONSTRAINT "member_groups_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "member_groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_instances" ADD CONSTRAINT "integration_instances_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_instances" ADD CONSTRAINT "integration_instances_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_instances" ADD CONSTRAINT "integration_instances_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationInstanceState" ADD CONSTRAINT "IntegrationInstanceState_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationInstanceState" ADD CONSTRAINT "IntegrationInstanceState_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "integration_instances" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_instances" ADD CONSTRAINT "action_instances_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_actionInstanceId_fkey" FOREIGN KEY ("actionInstanceId") REFERENCES "action_instances" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_actionInstanceId_fkey" FOREIGN KEY ("actionInstanceId") REFERENCES "action_instances" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_pubTypeId_fkey" FOREIGN KEY ("pubTypeId") REFERENCES "pub_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_inputs" ADD CONSTRAINT "form_inputs_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "pub_fields" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_inputs" ADD CONSTRAINT "form_inputs_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;