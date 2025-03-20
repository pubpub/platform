#!/bin/bash
set -e

# Create empty migration file
>drizzle/migrations/0000_init.sql

# Process migrations in chronological order
# Migration: 20230614132455_init_user by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230614132455_init_user

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_slug_key" ON "users"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230614132455_init_user to flattened file"

# Migration: 20230615122708_placeholders by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230615122708_placeholders

-- CreateTable
CREATE TABLE "pubs" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pub_types" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pub_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metadata" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stages" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_groups" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pins" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pins_pkey" PRIMARY KEY ("id")
);

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230615122708_placeholders to flattened file"

# Migration: 20230621173054_pub_schema_pass_1 by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230621173054_pub_schema_pass_1

/*
  Warnings:

  - Added the required column `pub_id` to the `metadata` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `value` on the `metadata` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `community_id` to the `pub_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fields` to the `pub_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `pub_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parent_id` to the `pubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pub_type_id` to the `pubs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "metadata" ADD COLUMN     "pub_id" TEXT NOT NULL,
DROP COLUMN "value",
ADD COLUMN     "value" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "pub_types" ADD COLUMN     "community_id" TEXT NOT NULL,
ADD COLUMN     "fields" JSONB NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "parent_id" TEXT NOT NULL,
ADD COLUMN     "pub_type_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_pub_type_id_fkey" FOREIGN KEY ("pub_type_id") REFERENCES "pub_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_types" ADD CONSTRAINT "pub_types_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metadata" ADD CONSTRAINT "metadata_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230621173054_pub_schema_pass_1 to flattened file"

# Migration: 20230621173228_community_name by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230621173228_community_name

/*
  Warnings:

  - Added the required column `name` to the `communities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "name" TEXT NOT NULL;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230621173228_community_name to flattened file"

# Migration: 20230621174338_fix_pub_parent_required by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230621174338_fix_pub_parent_required

-- DropForeignKey
ALTER TABLE "pubs" DROP CONSTRAINT "pubs_parent_id_fkey";

-- AlterTable
ALTER TABLE "pubs" ALTER COLUMN "parent_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "pubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230621174338_fix_pub_parent_required to flattened file"

# Migration: 20230621175305_add_community_to_pub by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230621175305_add_community_to_pub

/*
  Warnings:

  - Added the required column `community_id` to the `pubs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "community_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230621175305_add_community_to_pub to flattened file"

# Migration: 20230622182329_metadata_refactor by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230622182329_metadata_refactor

/*
  Warnings:

  - You are about to drop the column `fields` on the `pub_types` table. All the data in the column will be lost.
  - You are about to drop the `metadata` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `metadataBlob` to the `pubs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "metadata" DROP CONSTRAINT "metadata_pub_id_fkey";

-- AlterTable
ALTER TABLE "pub_types" DROP COLUMN "fields";

-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "metadataBlob" JSONB NOT NULL;

-- DropTable
DROP TABLE "metadata";

-- CreateTable
CREATE TABLE "metadata_fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pub_type_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metadata_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metadata_values" (
    "id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "pub_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metadata_values_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "metadata_fields" ADD CONSTRAINT "metadata_fields_pub_type_id_fkey" FOREIGN KEY ("pub_type_id") REFERENCES "pub_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metadata_values" ADD CONSTRAINT "metadata_values_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "metadata_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metadata_values" ADD CONSTRAINT "metadata_values_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230622182329_metadata_refactor to flattened file"

# Migration: 20230622182626_blob_optional by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230622182626_blob_optional

-- AlterTable
ALTER TABLE "pubs" ALTER COLUMN "metadataBlob" DROP NOT NULL;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230622182626_blob_optional to flattened file"

# Migration: 20230622194921_workflow_init by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230622194921_workflow_init

/*
  Warnings:

  - Added the required column `workflow_id` to the `stages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stages" ADD COLUMN     "workflow_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "move_constraint" (
    "id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "destination_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "move_constraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_claim" (
    "id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "pub_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_move" (
    "id" TEXT NOT NULL,
    "source_stage_id" TEXT NOT NULL,
    "destination_stage_id" TEXT NOT NULL,
    "pub_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_move_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PubToStage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PubToStage_AB_unique" ON "_PubToStage"("A", "B");

-- CreateIndex
CREATE INDEX "_PubToStage_B_index" ON "_PubToStage"("B");

-- AddForeignKey
ALTER TABLE "stages" ADD CONSTRAINT "stages_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_constraint" ADD CONSTRAINT "move_constraint_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_constraint" ADD CONSTRAINT "move_constraint_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_claim" ADD CONSTRAINT "action_claim_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_claim" ADD CONSTRAINT "action_claim_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_claim" ADD CONSTRAINT "action_claim_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_move" ADD CONSTRAINT "action_move_source_stage_id_fkey" FOREIGN KEY ("source_stage_id") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_move" ADD CONSTRAINT "action_move_destination_stage_id_fkey" FOREIGN KEY ("destination_stage_id") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_move" ADD CONSTRAINT "action_move_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_move" ADD CONSTRAINT "action_move_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PubToStage" ADD CONSTRAINT "_PubToStage_A_fkey" FOREIGN KEY ("A") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PubToStage" ADD CONSTRAINT "_PubToStage_B_fkey" FOREIGN KEY ("B") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230622194921_workflow_init to flattened file"

# Migration: 20230622195031_workflows_to_community by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230622195031_workflows_to_community

/*
  Warnings:

  - Added the required column `community_id` to the `workflows` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "workflows" ADD COLUMN     "community_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230622195031_workflows_to_community to flattened file"

# Migration: 20230622195558_stage_names_order by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230622195558_stage_names_order

/*
  Warnings:

  - Added the required column `name` to the `stages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `stages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `workflows` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stages" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "order" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "workflows" ADD COLUMN     "name" TEXT NOT NULL;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230622195558_stage_names_order to flattened file"

# Migration: 20230705201158_refactor_fields by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230705201158_refactor_fields

/*
  Warnings:

  - You are about to drop the column `metadataBlob` on the `pubs` table. All the data in the column will be lost.
  - You are about to drop the column `parent_id` on the `pubs` table. All the data in the column will be lost.
  - You are about to drop the `metadata_fields` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `metadata_values` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "metadata_fields" DROP CONSTRAINT "metadata_fields_pub_type_id_fkey";

-- DropForeignKey
ALTER TABLE "metadata_values" DROP CONSTRAINT "metadata_values_field_id_fkey";

-- DropForeignKey
ALTER TABLE "metadata_values" DROP CONSTRAINT "metadata_values_pub_id_fkey";

-- DropForeignKey
ALTER TABLE "pubs" DROP CONSTRAINT "pubs_parent_id_fkey";

-- AlterTable
ALTER TABLE "pubs" DROP COLUMN "metadataBlob",
DROP COLUMN "parent_id",
ADD COLUMN     "valuesBlob" JSONB;

-- DropTable
DROP TABLE "metadata_fields";

-- DropTable
DROP TABLE "metadata_values";

-- CreateTable
CREATE TABLE "pub_fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pub_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pub_values" (
    "id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "pub_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pub_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PubFieldToPubType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PubFieldToPubType_AB_unique" ON "_PubFieldToPubType"("A", "B");

-- CreateIndex
CREATE INDEX "_PubFieldToPubType_B_index" ON "_PubFieldToPubType"("B");

-- AddForeignKey
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "pub_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PubFieldToPubType" ADD CONSTRAINT "_PubFieldToPubType_A_fkey" FOREIGN KEY ("A") REFERENCES "pub_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PubFieldToPubType" ADD CONSTRAINT "_PubFieldToPubType_B_fkey" FOREIGN KEY ("B") REFERENCES "pub_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230705201158_refactor_fields to flattened file"

# Migration: 20230706134853_instances by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230706134853_instances

/*
  Warnings:

  - Added the required column `actions` to the `integrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `integrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `settingsUrl` to the `integrations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "integrations" ADD COLUMN     "actions" JSONB NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "settingsUrl" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "integration_instances" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_IntegrationInstanceToPub" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_IntegrationInstanceToStage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_IntegrationInstanceToPub_AB_unique" ON "_IntegrationInstanceToPub"("A", "B");

-- CreateIndex
CREATE INDEX "_IntegrationInstanceToPub_B_index" ON "_IntegrationInstanceToPub"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_IntegrationInstanceToStage_AB_unique" ON "_IntegrationInstanceToStage"("A", "B");

-- CreateIndex
CREATE INDEX "_IntegrationInstanceToStage_B_index" ON "_IntegrationInstanceToStage"("B");

-- AddForeignKey
ALTER TABLE "integration_instances" ADD CONSTRAINT "integration_instances_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IntegrationInstanceToPub" ADD CONSTRAINT "_IntegrationInstanceToPub_A_fkey" FOREIGN KEY ("A") REFERENCES "integration_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IntegrationInstanceToPub" ADD CONSTRAINT "_IntegrationInstanceToPub_B_fkey" FOREIGN KEY ("B") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IntegrationInstanceToStage" ADD CONSTRAINT "_IntegrationInstanceToStage_A_fkey" FOREIGN KEY ("A") REFERENCES "integration_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IntegrationInstanceToStage" ADD CONSTRAINT "_IntegrationInstanceToStage_B_fkey" FOREIGN KEY ("B") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230706134853_instances to flattened file"

# Migration: 20230706152501_integegration_field_ids by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230706152501_integegration_field_ids

-- AlterTable
ALTER TABLE "pub_fields" ADD COLUMN     "integration_id" TEXT;

-- AddForeignKey
ALTER TABLE "pub_fields" ADD CONSTRAINT "pub_fields_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230706152501_integegration_field_ids to flattened file"

# Migration: 20230710105851_instance_community by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230710105851_instance_community

/*
  Warnings:

  - Added the required column `community_id` to the `integration_instances` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "integration_instances" ADD COLUMN     "community_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "integration_instances" ADD CONSTRAINT "integration_instances_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230710105851_instance_community to flattened file"

# Migration: 20230712173822_community_avatar by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230712173822_community_avatar

-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "avatar" TEXT;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230712173822_community_avatar to flattened file"

# Migration: 20230712174327_pin_schema by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230712174327_pin_schema

/*
  Warnings:

  - Added the required column `user_id` to the `pins` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pins" ADD COLUMN     "instance_id" TEXT,
ADD COLUMN     "pub_id" TEXT,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "workflow_id" TEXT;

-- AddForeignKey
ALTER TABLE "pins" ADD CONSTRAINT "pins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pins" ADD CONSTRAINT "pins_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pins" ADD CONSTRAINT "pins_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pins" ADD CONSTRAINT "pins_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "integration_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230712174327_pin_schema to flattened file"

# Migration: 20230713124028_type_description by Travis Rich
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230713124028_type_description

-- AlterTable
ALTER TABLE "pub_types" ADD COLUMN     "description" TEXT;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis Rich" GIT_COMMITTER_EMAIL="travis.s.rich@gmail.com" git commit --no-verify --no-gpg-sign --author="Travis Rich <travis.s.rich@gmail.com>" -m "Move migration 20230713124028_type_description to flattened file"

# Migration: 20230730130805_remove_workflowws by Travis
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230730130805_remove_workflowws

/*
  Warnings:

  - Added the required column `canAdmin` to the `member_groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `community_id` to the `member_groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canAdmin` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `community_id` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "member_groups" ADD COLUMN     "canAdmin" BOOLEAN NOT NULL,
ADD COLUMN     "community_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "canAdmin" BOOLEAN NOT NULL,
ADD COLUMN     "community_id" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "member_id" TEXT,
    "member_group_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PermissionToPub" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PermissionToStage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PermissionToWorkflow" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToPub_AB_unique" ON "_PermissionToPub"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToPub_B_index" ON "_PermissionToPub"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToStage_AB_unique" ON "_PermissionToStage"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToStage_B_index" ON "_PermissionToStage"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToWorkflow_AB_unique" ON "_PermissionToWorkflow"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToWorkflow_B_index" ON "_PermissionToWorkflow"("B");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_groups" ADD CONSTRAINT "member_groups_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_member_group_id_fkey" FOREIGN KEY ("member_group_id") REFERENCES "member_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToPub" ADD CONSTRAINT "_PermissionToPub_A_fkey" FOREIGN KEY ("A") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToPub" ADD CONSTRAINT "_PermissionToPub_B_fkey" FOREIGN KEY ("B") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToStage" ADD CONSTRAINT "_PermissionToStage_A_fkey" FOREIGN KEY ("A") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToStage" ADD CONSTRAINT "_PermissionToStage_B_fkey" FOREIGN KEY ("B") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToWorkflow" ADD CONSTRAINT "_PermissionToWorkflow_A_fkey" FOREIGN KEY ("A") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToWorkflow" ADD CONSTRAINT "_PermissionToWorkflow_B_fkey" FOREIGN KEY ("B") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis" GIT_COMMITTER_EMAIL="isTravis@users.noreply.github.com" git commit --no-verify --no-gpg-sign --author="Travis <isTravis@users.noreply.github.com>" -m "Move migration 20230730130805_remove_workflowws to flattened file"

# Migration: 20230730131013_really_drop_workflows by Travis
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230730131013_really_drop_workflows

/*
  Warnings:

  - You are about to drop the column `workflow_id` on the `stages` table. All the data in the column will be lost.
  - You are about to drop the `_PermissionToWorkflow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workflows` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `community_id` to the `stages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_PermissionToWorkflow" DROP CONSTRAINT "_PermissionToWorkflow_A_fkey";

-- DropForeignKey
ALTER TABLE "_PermissionToWorkflow" DROP CONSTRAINT "_PermissionToWorkflow_B_fkey";

-- DropForeignKey
ALTER TABLE "pins" DROP CONSTRAINT "pins_instance_id_fkey";

-- DropForeignKey
ALTER TABLE "pins" DROP CONSTRAINT "pins_pub_id_fkey";

-- DropForeignKey
ALTER TABLE "pins" DROP CONSTRAINT "pins_user_id_fkey";

-- DropForeignKey
ALTER TABLE "pins" DROP CONSTRAINT "pins_workflow_id_fkey";

-- DropForeignKey
ALTER TABLE "stages" DROP CONSTRAINT "stages_workflow_id_fkey";

-- DropForeignKey
ALTER TABLE "workflows" DROP CONSTRAINT "workflows_community_id_fkey";

-- AlterTable
ALTER TABLE "stages" DROP COLUMN "workflow_id",
ADD COLUMN     "community_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "_PermissionToWorkflow";

-- DropTable
DROP TABLE "pins";

-- DropTable
DROP TABLE "workflows";

-- CreateTable
CREATE TABLE "_MemberGroupToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_MemberGroupToUser_AB_unique" ON "_MemberGroupToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_MemberGroupToUser_B_index" ON "_MemberGroupToUser"("B");

-- AddForeignKey
ALTER TABLE "stages" ADD CONSTRAINT "stages_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberGroupToUser" ADD CONSTRAINT "_MemberGroupToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberGroupToUser" ADD CONSTRAINT "_MemberGroupToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis" GIT_COMMITTER_EMAIL="isTravis@users.noreply.github.com" git commit --no-verify --no-gpg-sign --author="Travis <isTravis@users.noreply.github.com>" -m "Move migration 20230730131013_really_drop_workflows to flattened file"

# Migration: 20230730141617_community_slug_first by Travis
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230730141617_community_slug_first

-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "slug" TEXT;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis" GIT_COMMITTER_EMAIL="isTravis@users.noreply.github.com" git commit --no-verify --no-gpg-sign --author="Travis <isTravis@users.noreply.github.com>" -m "Move migration 20230730141617_community_slug_first to flattened file"

# Migration: 20230730141652_community_slug_final by Travis
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230730141652_community_slug_final

/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `communities` will be added. If there are existing duplicate values, this will fail.
  - Made the column `slug` on table `communities` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "communities" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "communities_slug_key" ON "communities"("slug");

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Travis" GIT_COMMITTER_EMAIL="isTravis@users.noreply.github.com" git commit --no-verify --no-gpg-sign --author="Travis <isTravis@users.noreply.github.com>" -m "Move migration 20230730141652_community_slug_final to flattened file"

# Migration: 20230906210115_add_auth_tokens by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230906210115_add_auth_tokens

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20230906210115_add_auth_tokens to flattened file"

# Migration: 20230907211557_zero_to_one_stages_per_integration_instance by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230907211557_zero_to_one_stages_per_integration_instance

/*
  Warnings:

  - You are about to drop the `_IntegrationInstanceToStage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_IntegrationInstanceToStage" DROP CONSTRAINT "_IntegrationInstanceToStage_A_fkey";

-- DropForeignKey
ALTER TABLE "_IntegrationInstanceToStage" DROP CONSTRAINT "_IntegrationInstanceToStage_B_fkey";

-- AlterTable
ALTER TABLE "integration_instances" ADD COLUMN     "stage_id" TEXT;

-- DropTable
DROP TABLE "_IntegrationInstanceToStage";

-- AddForeignKey
ALTER TABLE "integration_instances" ADD CONSTRAINT "integration_instances_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20230907211557_zero_to_one_stages_per_integration_instance to flattened file"

# Migration: 20230913200757_add_pub_hierarchy by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230913200757_add_pub_hierarchy

-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "parent_id" TEXT;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "pubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20230913200757_add_pub_hierarchy to flattened file"

# Migration: 20230919171747_add_pubfieldschema by Gabriel Stein
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230919171747_add_pubfieldschema

-- AlterTable
ALTER TABLE "pub_fields" ADD COLUMN     "pubFieldSchemaId" TEXT;

-- CreateTable
CREATE TABLE "PubFieldSchema" (
    "id" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schema" JSONB NOT NULL,

    CONSTRAINT "PubFieldSchema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PubFieldSchema_name_namespace_key" ON "PubFieldSchema"("name", "namespace");

-- AddForeignKey
ALTER TABLE "pub_fields" ADD CONSTRAINT "pub_fields_pubFieldSchemaId_fkey" FOREIGN KEY ("pubFieldSchemaId") REFERENCES "PubFieldSchema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Gabriel Stein" GIT_COMMITTER_EMAIL="g@gabestein.com" git commit --no-verify --no-gpg-sign --author="Gabriel Stein <g@gabestein.com>" -m "Move migration 20230919171747_add_pubfieldschema to flattened file"

# Migration: 20230925191147_add_pubfieldschema_dates by Gabriel Stein
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230925191147_add_pubfieldschema_dates

-- AlterTable
ALTER TABLE "PubFieldSchema" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Gabriel Stein" GIT_COMMITTER_EMAIL="g@gabestein.com" git commit --no-verify --no-gpg-sign --author="Gabriel Stein <g@gabestein.com>" -m "Move migration 20230925191147_add_pubfieldschema_dates to flattened file"

# Migration: 20230926234242_add_pubfield_slugs by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230926234242_add_pubfield_slugs

/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `pub_fields` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `pub_fields` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pub_fields" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pub_fields_slug_key" ON "pub_fields"("slug");

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20230926234242_add_pubfield_slugs to flattened file"

# Migration: 20230928124422_user_name_first_last by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20230928124422_user_name_first_last

/*
  Warnings:

  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users"
  ALTER COLUMN "name" SET DEFAULT '',
  ADD COLUMN     "lastName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN     "orcid" TEXT;

ALTER TABLE "users" RENAME COLUMN "name" TO "firstName";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20230928124422_user_name_first_last to flattened file"

# Migration: 20231010215802_add_supabase_id by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20231010215802_add_supabase_id

/*
  Warnings:

  - A unique constraint covering the columns `[supabaseId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "supabaseId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseId_key" ON "users"("supabaseId");

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20231010215802_add_supabase_id to flattened file"

# Migration: 20231012092908_pub_delete_cascade by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20231012092908_pub_delete_cascade

-- DropForeignKey
ALTER TABLE "pub_values" DROP CONSTRAINT "pub_values_pub_id_fkey";

-- DropForeignKey
ALTER TABLE "pubs" DROP CONSTRAINT "pubs_parent_id_fkey";

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20231012092908_pub_delete_cascade to flattened file"

# Migration: 20231016133737_nullable_last_name by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20231016133737_nullable_last_name

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "lastName" DROP NOT NULL;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20231016133737_nullable_last_name to flattened file"

# Migration: 20231030180206_add_config_column_to_schema by qweliant
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20231030180206_add_config_column_to_schema

-- AlterTable
ALTER TABLE "integration_instances" ADD COLUMN     "config" JSONB;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "firstName" DROP DEFAULT,
ALTER COLUMN "lastName" DROP DEFAULT;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="qweliant" GIT_COMMITTER_EMAIL="dmtorcode@gmail.com" git commit --no-verify --no-gpg-sign --author="qweliant <dmtorcode@gmail.com>" -m "Move migration 20231030180206_add_config_column_to_schema to flattened file"

# Migration: 20231031164256_add_integration_instance_state_table by qweliant
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20231031164256_add_integration_instance_state_table

-- CreateTable
CREATE TABLE "IntegrationInstanceState" (
    "pub_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "value" JSONB NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationInstanceState_pub_id_instance_id_key" ON "IntegrationInstanceState"("pub_id", "instance_id");

-- AddForeignKey
ALTER TABLE "IntegrationInstanceState" ADD CONSTRAINT "IntegrationInstanceState_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationInstanceState" ADD CONSTRAINT "IntegrationInstanceState_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "integration_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="qweliant" GIT_COMMITTER_EMAIL="dmtorcode@gmail.com" git commit --no-verify --no-gpg-sign --author="qweliant <dmtorcode@gmail.com>" -m "Move migration 20231031164256_add_integration_instance_state_table to flattened file"

# Migration: 20231107143830_change_to_state by qweliant
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20231107143830_change_to_state

/*
  Warnings:

  - You are about to drop the column `value` on the `IntegrationInstanceState` table. All the data in the column will be lost.
  - Added the required column `state` to the `IntegrationInstanceState` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "IntegrationInstanceState" DROP COLUMN "value",
ADD COLUMN     "state" JSONB NOT NULL;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="qweliant" GIT_COMMITTER_EMAIL="dmtorcode@gmail.com" git commit --no-verify --no-gpg-sign --author="qweliant <dmtorcode@gmail.com>" -m "Move migration 20231107143830_change_to_state to flattened file"

# Migration: 20240117220109_add_unique_constraint_on_move_constraints by qweliant
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240117220109_add_unique_constraint_on_move_constraints

/*
  Warnings:

  - A unique constraint covering the columns `[stage_id,destination_id]` on the table `move_constraint` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "move_constraint_stage_id_destination_id_key" ON "move_constraint"("stage_id", "destination_id");

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="qweliant" GIT_COMMITTER_EMAIL="dmtorcode@gmail.com" git commit --no-verify --no-gpg-sign --author="qweliant <dmtorcode@gmail.com>" -m "Move migration 20240117220109_add_unique_constraint_on_move_constraints to flattened file"

# Migration: 20240117220908_create_compound_move_constraint_id by qweliant
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240117220908_create_compound_move_constraint_id

/*
  Warnings:

  - The primary key for the `move_constraint` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `move_constraint` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "move_constraint_stage_id_destination_id_key";

-- AlterTable
ALTER TABLE "move_constraint" DROP CONSTRAINT "move_constraint_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "move_constraint_pkey" PRIMARY KEY ("stage_id", "destination_id");

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="qweliant" GIT_COMMITTER_EMAIL="dmtorcode@gmail.com" git commit --no-verify --no-gpg-sign --author="qweliant <dmtorcode@gmail.com>" -m "Move migration 20240117220908_create_compound_move_constraint_id to flattened file"

# Migration: 20240306184411_actions by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240306184411_actions

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ActionToPubField" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "actions_name_key" ON "actions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_ActionToPubField_AB_unique" ON "_ActionToPubField"("A", "B");

-- CreateIndex
CREATE INDEX "_ActionToPubField_B_index" ON "_ActionToPubField"("B");

-- AddForeignKey
ALTER TABLE "_ActionToPubField" ADD CONSTRAINT "_ActionToPubField_A_fkey" FOREIGN KEY ("A") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActionToPubField" ADD CONSTRAINT "_ActionToPubField_B_fkey" FOREIGN KEY ("B") REFERENCES "pub_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20240306184411_actions to flattened file"

# Migration: 20240307023916_move_constraint_ondelete_cascade by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240307023916_move_constraint_ondelete_cascade

-- DropForeignKey
ALTER TABLE "move_constraint" DROP CONSTRAINT "move_constraint_destination_id_fkey";

-- DropForeignKey
ALTER TABLE "move_constraint" DROP CONSTRAINT "move_constraint_stage_id_fkey";

-- AddForeignKey
ALTER TABLE "move_constraint" ADD CONSTRAINT "move_constraint_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_constraint" ADD CONSTRAINT "move_constraint_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20240307023916_move_constraint_ondelete_cascade to flattened file"

# Migration: 20240314025159_add_assignee_column by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240314025159_add_assignee_column

-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "assignee_id" TEXT;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20240314025159_add_assignee_column to flattened file"

# Migration: 20240318203453_add_action_instance by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240318203453_add_action_instance

-- CreateTable
CREATE TABLE "action_instances" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_instances_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "action_instances" ADD CONSTRAINT "action_instances_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_instances" ADD CONSTRAINT "action_instances_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20240318203453_add_action_instance to flattened file"

# Migration: 20240328181858_add_action_description by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240328181858_add_action_description

-- AlterTable
ALTER TABLE "actions" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20240328181858_add_action_description to flattened file"

# Migration: 20240403211924_add_action_instance_config by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240403211924_add_action_instance_config

-- AlterTable
ALTER TABLE "action_instances" ADD COLUMN     "config" JSONB;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20240403211924_add_action_instance_config to flattened file"

# Migration: 20240410194529_add_is_super_admin_to_user_model by Qwelian D Tanner
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240410194529_add_is_super_admin_to_user_model

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Qwelian D Tanner" GIT_COMMITTER_EMAIL="dmtorcode@tutanota.com" git commit --no-verify --no-gpg-sign --author="Qwelian D Tanner <dmtorcode@tutanota.com>" -m "Move migration 20240410194529_add_is_super_admin_to_user_model to flattened file"

# Migration: 20240410232644_add_explicit_pubs_to_stages_m_m_relationship by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240410232644_add_explicit_pubs_to_stages_m_m_relationship

-- CreateTable
CREATE TABLE "PubsInStages" (
    "pubId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,

    CONSTRAINT "PubsInStages_pkey" PRIMARY KEY ("pubId","stageId")
);

-- AddForeignKey
ALTER TABLE "PubsInStages" ADD CONSTRAINT "PubsInStages_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PubsInStages" ADD CONSTRAINT "PubsInStages_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20240410232644_add_explicit_pubs_to_stages_m_m_relationship to flattened file"

# Migration: 20240410233228_remove_implicit_pubs_to_stages_relationship by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240410233228_remove_implicit_pubs_to_stages_relationship

/*
  Warnings:

  - You are about to drop the `_PubToStage` table. If the table is not empty, all the data it contains will be lost.

*/

-- Copy Data
INSERT INTO "PubsInStages" SELECT "A","B" FROM "_PubToStage";
-- DropForeignKey
ALTER TABLE "_PubToStage" DROP CONSTRAINT "_PubToStage_A_fkey";

-- DropForeignKey
ALTER TABLE "_PubToStage" DROP CONSTRAINT "_PubToStage_B_fkey";

-- DropTable
DROP TABLE "_PubToStage";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20240410233228_remove_implicit_pubs_to_stages_relationship to flattened file"

# Migration: 20240411012752_create_trigger_on_pub_stage_join_table by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240411012752_create_trigger_on_pub_stage_join_table

CREATE OR REPLACE FUNCTION emit_event()
    RETURNS TRIGGER AS 
$$
BEGIN
    PERFORM
        graphile_worker.add_job(
            'emitEvent',
            json_build_object(
                'table', TG_TABLE_NAME,
                'operation', TG_OP,
                'new', NEW,
                'old', OLD
            )
        );
    RETURN NEW;
END;
$$
LANGUAGE plpgsql
VOLATILE;

CREATE TRIGGER pub_moved
    AFTER INSERT OR DELETE ON "PubsInStages"
    FOR EACH ROW
    EXECUTE FUNCTION emit_event();

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20240411012752_create_trigger_on_pub_stage_join_table to flattened file"

# Migration: 20240415174050_add_name_to_action_instances by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240415174050_add_name_to_action_instances

-- AlterTable
ALTER TABLE "action_instances" ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240415174050_add_name_to_action_instances to flattened file"

# Migration: 20240415185449_remove_action_table by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240415185449_remove_action_table

/*
  Warnings:

  - You are about to drop the column `action_id` on the `action_instances` table. All the data in the column will be lost.
  - You are about to drop the `_ActionToPubField` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `actions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `action` to the `action_instances` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Action" AS ENUM ('log', 'pdf', 'email');

-- DropForeignKey
ALTER TABLE "_ActionToPubField" DROP CONSTRAINT "_ActionToPubField_A_fkey";

-- DropForeignKey
ALTER TABLE "_ActionToPubField" DROP CONSTRAINT "_ActionToPubField_B_fkey";

-- DropForeignKey
ALTER TABLE "action_instances" DROP CONSTRAINT "action_instances_action_id_fkey";

-- AlterTable
ALTER TABLE "action_instances" DROP COLUMN "action_id",
ADD COLUMN     "action" "Action" NOT NULL;

-- AlterTable
ALTER TABLE "pub_fields" ADD COLUMN     "actions" "Action"[];

-- DropTable
DROP TABLE "_ActionToPubField";

-- DropTable
DROP TABLE "actions";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240415185449_remove_action_table to flattened file"

# Migration: 20240416111211_drop_actions_pubfields by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240416111211_drop_actions_pubfields

/*
  Warnings:

  - You are about to drop the column `actions` on the `pub_fields` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pub_fields" DROP COLUMN "actions";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240416111211_drop_actions_pubfields to flattened file"

# Migration: 20240416124817_set_postgres_defaults_for_uuids by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240416124817_set_postgres_defaults_for_uuids

-- AlterTable
ALTER TABLE "PubFieldSchema" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "action_claim" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "action_instances" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "action_move" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "communities" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "integration_instances" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "integrations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "member_groups" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "members" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "permissions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "pub_fields" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "pub_types" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "pub_values" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "pubs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "stages" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240416124817_set_postgres_defaults_for_uuids to flattened file"

# Migration: 20240416211436_add_push_to_v6_action by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240416211436_add_push_to_v6_action

-- AlterEnum
ALTER TYPE "Action" ADD VALUE 'pushToV6';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20240416211436_add_push_to_v6_action to flattened file"

# Migration: 20240416214541_add_rules by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240416214541_add_rules

-- CreateEnum
CREATE TYPE "Event" AS ENUM ('pubEnteredStage', 'pubLeftStage');

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event" "Event" NOT NULL,
    "action_instance_id" TEXT NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rules_action_instance_id_event_key" ON "rules"("action_instance_id", "event");

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_action_instance_id_fkey" FOREIGN KEY ("action_instance_id") REFERENCES "action_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20240416214541_add_rules to flattened file"

# Migration: 20240416234734_add_cascade_on_delete by Qwelian D Tanner
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240416234734_add_cascade_on_delete

-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_community_id_fkey";

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Qwelian D Tanner" GIT_COMMITTER_EMAIL="dmtorcode@tutanota.com" git commit --no-verify --no-gpg-sign --author="Qwelian D Tanner <dmtorcode@tutanota.com>" -m "Move migration 20240416234734_add_cascade_on_delete to flattened file"

# Migration: 20240418185908_remove_pubs_in_stages_if_pubs_or_stages_are_removed by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240418185908_remove_pubs_in_stages_if_pubs_or_stages_are_removed

-- DropForeignKey
ALTER TABLE "PubsInStages" DROP CONSTRAINT "PubsInStages_pubId_fkey";

-- DropForeignKey
ALTER TABLE "PubsInStages" DROP CONSTRAINT "PubsInStages_stageId_fkey";

-- AddForeignKey
ALTER TABLE "PubsInStages" ADD CONSTRAINT "PubsInStages_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PubsInStages" ADD CONSTRAINT "PubsInStages_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240418185908_remove_pubs_in_stages_if_pubs_or_stages_are_removed to flattened file"

# Migration: 20240422152704_add_http_action by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240422152704_add_http_action

-- AlterEnum
ALTER TYPE "Action" ADD VALUE 'http';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240422152704_add_http_action to flattened file"

# Migration: 20240506184830_add_move_action by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240506184830_add_move_action

-- AlterEnum
ALTER TYPE "Action" ADD VALUE 'move';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20240506184830_add_move_action to flattened file"

# Migration: 20240520190654_add_action_runs by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240520190654_add_action_runs

-- CreateEnum
CREATE TYPE "ActionRunStatus" AS ENUM ('success', 'failure');

-- CreateTable
CREATE TABLE "action_runs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "action_instance_id" TEXT,
    "pub_id" TEXT,
    "config" JSONB,
    "event" "Event",
    "params" JSONB,
    "status" "ActionRunStatus" NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_runs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_action_instance_id_fkey" FOREIGN KEY ("action_instance_id") REFERENCES "action_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20240520190654_add_action_runs to flattened file"

# Migration: 20240523104802_add_new_duration_event by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240523104802_add_new_duration_event

-- AlterEnum
ALTER TYPE "Event" ADD VALUE 'pubInStageForDuration';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240523104802_add_new_duration_event to flattened file"

# Migration: 20240523122445_add_config_option_for_rules by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240523122445_add_config_option_for_rules

-- AlterTable
ALTER TABLE "rules" ADD COLUMN     "config" JSONB;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240523122445_add_config_option_for_rules to flattened file"

# Migration: 20240523130939_update_comments by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240523130939_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments



-- Model pub_values comments



-- Model pub_types comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model action_claim comments



-- Model action_move comments



-- Model members comments



-- Model member_groups comments



-- Model permissions comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model rules comments

COMMENT ON COLUMN "rules"."config" IS '@type(RuleConfigs, ''~/actions/types'', true, false, true)';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240523130939_update_comments to flattened file"

# Migration: 20240529145416_add_forms by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240529145416_add_forms

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "pub_type_id" TEXT NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_inputs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "field_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "order" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,
    "is_submit" BOOLEAN NOT NULL,

    CONSTRAINT "form_inputs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_pub_type_id_fkey" FOREIGN KEY ("pub_type_id") REFERENCES "pub_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_inputs" ADD CONSTRAINT "form_inputs_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "pub_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_inputs" ADD CONSTRAINT "form_inputs_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Only allow one is_submit = true column per form_id
CREATE UNIQUE INDEX form_inputs_is_submit_unique ON "form_inputs" ("form_id") WHERE "is_submit" = true;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20240529145416_add_forms to flattened file"

# Migration: 20240529160343_record_action_rsult by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240529160343_record_action_rsult

/*
  Warnings:

  - Added the required column `result` to the `action_runs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "action_runs" ADD COLUMN     "result" JSONB NOT NULL;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20240529160343_record_action_rsult to flattened file"

# Migration: 20240530103008_update_comments by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240530103008_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments



-- Model pub_values comments



-- Model pub_types comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model action_claim comments



-- Model action_move comments



-- Model members comments



-- Model member_groups comments



-- Model permissions comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments

COMMENT ON COLUMN "rules"."config" IS '@type(RuleConfigs, ''~/actions/types'', true, false, true)';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240530103008_update_comments to flattened file"

# Migration: 20240530112116_add_scheduled_action_run_status by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240530112116_add_scheduled_action_run_status

-- AlterEnum
ALTER TYPE "ActionRunStatus" ADD VALUE 'scheduled';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240530112116_add_scheduled_action_run_status to flattened file"

# Migration: 20240603202647_update_comments by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240603202647_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments



-- Model pub_values comments



-- Model pub_types comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model action_claim comments



-- Model action_move comments



-- Model members comments



-- Model member_groups comments



-- Model permissions comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments

COMMENT ON COLUMN "rules"."config" IS '@type(RuleConfigs, ''~/actions/types'', true, false, true)';


-- Model forms comments



-- Model form_inputs comments;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20240603202647_update_comments to flattened file"

# Migration: 20240604094500_transition_to_camelcase by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240604094500_transition_to_camelcase

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

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240604094500_transition_to_camelcase to flattened file"

# Migration: 20240604102349_update_comments by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240604102349_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments



-- Model pub_values comments



-- Model pub_types comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model action_claim comments



-- Model action_move comments



-- Model members comments



-- Model member_groups comments



-- Model permissions comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments

COMMENT ON COLUMN "rules"."config" IS '@type(RuleConfigs, ''~/actions/types'', true, false, true)';


-- Model forms comments



-- Model form_inputs comments;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240604102349_update_comments to flattened file"

# Migration: 20240604114027_update_comments by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240604114027_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments



-- Model pub_values comments



-- Model pub_types comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model action_claim comments



-- Model action_move comments



-- Model members comments



-- Model member_groups comments



-- Model permissions comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments

COMMENT ON COLUMN "rules"."config" IS '@type(RuleConfigs, ''~/actions/types'', true, false, true)';


-- Model forms comments



-- Model form_inputs comments;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240604114027_update_comments to flattened file"

# Migration: 20240617120000_update_pub_moved_trigger_to_include_community_slug by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240617120000_update_pub_moved_trigger_to_include_community_slug

-- Create the new function
CREATE OR REPLACE FUNCTION emit_event()
    RETURNS TRIGGER AS 
$$
DECLARE
    community RECORD;
BEGIN
    -- Determine the community from the Pubs or Stages table
    IF TG_OP = 'INSERT' THEN
        SELECT c.id, c.slug INTO community
        FROM pubs p
        JOIN communities c ON p."communityId" = c.id
        WHERE p.id = NEW."pubId";
    ELSIF TG_OP = 'DELETE' THEN
        SELECT c.id, c.slug INTO community
        FROM pubs p
        JOIN communities c ON p."communityId" = c.id
        WHERE p.id = OLD."pubId";
    END IF;

    PERFORM
        graphile_worker.add_job(
            'emitEvent',
            json_build_object(
                'table', TG_TABLE_NAME,
                'operation', TG_OP,
                'new', NEW,
                'old', OLD,
                'community', community
            )
        );
    RETURN NEW;
END;
$$
LANGUAGE plpgsql
VOLATILE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240617120000_update_pub_moved_trigger_to_include_community_slug to flattened file"

# Migration: 20240702114658_add_schemaname_column_to_pubfield by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240702114658_add_schemaname_column_to_pubfield

-- CreateEnum
CREATE TYPE "CoreSchemaType" AS ENUM ('String', 'Boolean', 'Vector3', 'DateTime', 'Email', 'URL', 'UserId', 'FileUpload');

-- AlterTable
ALTER TABLE "pub_fields" ADD COLUMN     "schemaName" "CoreSchemaType";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240702114658_add_schemaname_column_to_pubfield to flattened file"

# Migration: 20240703161852_add_api_access_tokens by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240703161852_add_api_access_tokens

-- CreateEnum
CREATE TYPE "ApiAccessType" AS ENUM ('read', 'write', 'archive');

-- CreateEnum
CREATE TYPE "ApiAccessScope" AS ENUM ('community', 'pub', 'stage', 'member', 'pubType');

-- CreateTable
CREATE TABLE "api_access_tokens" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "communityId" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "issuedById" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_access_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "accessTokenId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,

    CONSTRAINT "api_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_access_permissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "apiAccessTokenId" TEXT NOT NULL,
    "scope" "ApiAccessScope" NOT NULL,
    "accessType" "ApiAccessType" NOT NULL,
    "constraints" JSONB,

    CONSTRAINT "api_access_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_access_tokens_token_key" ON "api_access_tokens"("token");

-- CreateIndex
CREATE INDEX "token_idx" ON "api_access_tokens"("token");

-- CreateIndex
CREATE INDEX "api_access_permissions_idx" ON "api_access_permissions"("apiAccessTokenId", "scope", "accessType");

-- AddForeignKey
ALTER TABLE "api_access_tokens" ADD CONSTRAINT "api_access_tokens_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_access_tokens" ADD CONSTRAINT "api_access_tokens_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_access_logs" ADD CONSTRAINT "api_access_logs_accessTokenId_fkey" FOREIGN KEY ("accessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_access_permissions" ADD CONSTRAINT "api_access_permissions_apiAccessTokenId_fkey" FOREIGN KEY ("apiAccessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240703161852_add_api_access_tokens to flattened file"

# Migration: 20240703161854_update_comments by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240703161854_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments

COMMENT ON COLUMN "PubFieldSchema"."schema" IS '@type(JSONSchemaType<any>, ''ajv'', true, false, true)';


-- Model pub_values comments



-- Model pub_types comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model action_claim comments



-- Model action_move comments



-- Model members comments



-- Model member_groups comments



-- Model permissions comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments

COMMENT ON COLUMN "rules"."config" IS '@type(RuleConfigs, ''~/actions/types'', true, false, true)';


-- Model forms comments



-- Model form_inputs comments



-- Model api_access_tokens comments



-- Model api_access_logs comments



-- Model api_access_permissions comments

COMMENT ON COLUMN "api_access_permissions"."constraints" IS '@type(ApiAccessPermissionConstraints, ''../../ApiAccessToken'', true, false, true)';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240703161854_update_comments to flattened file"

# Migration: 20240709044026_add_forms_archiving by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240709044026_add_forms_archiving

-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20240709044026_add_forms_archiving to flattened file"

# Migration: 20240710022410_add_forms_slug_and_unique_constraint by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240710022410_add_forms_slug_and_unique_constraint

/*
  Warnings:

  - A unique constraint covering the columns `[name,communityId]` on the table `forms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug,communityId]` on the table `forms` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `communityId` to the `forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `forms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "communityId" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "forms_name_communityId_key" ON "forms"("name", "communityId");

-- CreateIndex
CREATE UNIQUE INDEX "forms_slug_communityId_key" ON "forms"("slug", "communityId");

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20240710022410_add_forms_slug_and_unique_constraint to flattened file"

# Migration: 20240711145906_add_is_archived_to_pubfields by Allison King
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240711145906_add_is_archived_to_pubfields

-- AlterTable
ALTER TABLE "pub_fields" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Allison King" GIT_COMMITTER_EMAIL="aking@knowledgefutures.org" git commit --no-verify --no-gpg-sign --author="Allison King <aking@knowledgefutures.org>" -m "Move migration 20240711145906_add_is_archived_to_pubfields to flattened file"

# Migration: 20240711171041_update_comments by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240711171041_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments

COMMENT ON COLUMN "PubFieldSchema"."schema" IS '@type(JSONSchemaType<any>, ''ajv'', true, false, true)';


-- Model pub_values comments



-- Model pub_types comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model action_claim comments



-- Model action_move comments



-- Model members comments



-- Model member_groups comments



-- Model permissions comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments

COMMENT ON COLUMN "rules"."config" IS NULL;


-- Model forms comments



-- Model form_inputs comments



-- Model api_access_tokens comments



-- Model api_access_logs comments



-- Model api_access_permissions comments

COMMENT ON COLUMN "api_access_permissions"."constraints" IS '@type(ApiAccessPermissionConstraints, ''../types'', true, false, true)';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240711171041_update_comments to flattened file"

# Migration: 20240715133139_add_member_role_column by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240715133139_add_member_role_column

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('admin', 'editor', 'contributor');

-- AlterTable
ALTER TABLE "members"
ADD COLUMN "role" "MemberRole" NOT NULL DEFAULT 'editor';

-- Migrate members
BEGIN;

UPDATE "members"
SET
    "role" = 'admin'
WHERE
    "canAdmin" = true;

COMMIT;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240715133139_add_member_role_column to flattened file"

# Migration: 20240715133257_remove_can_admin_column by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240715133257_remove_can_admin_column

/*
  Warnings:

  - You are about to drop the column `canAdmin` on the `members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "members" DROP COLUMN "canAdmin";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240715133257_remove_can_admin_column to flattened file"

# Migration: 20240717105403_add_role_to_membergroup by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240717105403_add_role_to_membergroup

-- AlterTable
ALTER TABLE "member_groups"
ADD COLUMN "role" "MemberRole" NOT NULL DEFAULT 'editor';

-- Migrate data
UPDATE "member_groups"
set
    "role" = 'admin'
where
    "canAdmin" = true;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240717105403_add_role_to_membergroup to flattened file"

# Migration: 20240717105614_remove_can_admin_column_on_membergroup by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240717105614_remove_can_admin_column_on_membergroup

/*
  Warnings:

  - You are about to drop the column `canAdmin` on the `member_groups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "member_groups" DROP COLUMN "canAdmin";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240717105614_remove_can_admin_column_on_membergroup to flattened file"

# Migration: 20240722140326_add_explicit_relation_between_forms_and_permissions_and_add_constraint_that_forces_xor_on_memberid_and_membergroup_id_on_permissions by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240722140326_add_explicit_relation_between_forms_and_permissions_and_add_constraint_that_forces_xor_on_memberid_and_membergroup_id_on_permissions

-- CreateTable
CREATE TABLE
    "form_to_permissions" (
        "formId" TEXT NOT NULL,
        "permissionId" TEXT NOT NULL
    );

-- CreateIndex
CREATE UNIQUE INDEX "form_to_permissions_formId_permissionId_key" ON "form_to_permissions" ("formId", "permissionId");

-- AddForeignKey
ALTER TABLE "form_to_permissions" ADD CONSTRAINT "form_to_permissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_to_permissions" ADD CONSTRAINT "form_to_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Force permissions to have either a memberId or a memberGroupId, but not both
ALTER TABLE "permissions" ADD CONSTRAINT "memberId_xor_memberGroupId" CHECK (
    (
        "memberId" IS NOT NULL
        AND "memberGroupId" IS NULL
    )
    OR (
        "memberId" IS NULL
        AND "memberGroupId" IS NOT NULL
    )
);

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240722140326_add_explicit_relation_between_forms_and_permissions_and_add_constraint_that_forces_xor_on_memberid_and_membergroup_id_on_permissions to flattened file"

# Migration: 20240722185836_add_community_id_to_pubfields by Allison King
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240722185836_add_community_id_to_pubfields

BEGIN;
-- Add a column with a temporarily optional communityId
ALTER TABLE "pub_fields" ADD COLUMN     "communityId" TEXT;

-- Rename pubpub:fileUpload to belong to unjournal
UPDATE "pub_fields" SET slug = 'unjournal:fileUpload' WHERE slug = 'pubpub:fileUpload';

-- Drop rows where slug starts with `pubpub` as these core pub fields are deprecated
DELETE FROM "pub_fields" WHERE (slug LIKE 'pubpub:%');

-- Match slugs to determine community IDs. ex: unjournal:url should get unjournal's community ID
UPDATE "pub_fields" SET "communityId" = c.id FROM "communities" c WHERE split_part(pub_fields.slug, ':', 1) = c.slug;

-- Now that communityId is populated (hopefully) make the column required
ALTER TABLE "pub_fields" ALTER COLUMN "communityId" SET NOT NULL;
COMMIT;

-- AddForeignKey
ALTER TABLE "pub_fields" ADD CONSTRAINT "pub_fields_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Allison King" GIT_COMMITTER_EMAIL="aking@knowledgefutures.org" git commit --no-verify --no-gpg-sign --author="Allison King <aking@knowledgefutures.org>" -m "Move migration 20240722185836_add_community_id_to_pubfields to flattened file"

# Migration: 20240724231044_update_form_elements by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240724231044_update_form_elements

/*
  Warnings:

  - You are about to drop the `form_inputs` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FormAccessType" AS ENUM ('private', 'inviteOnly', 'public');

-- CreateEnum
CREATE TYPE "StructuralFormElement" AS ENUM ('h2', 'h3', 'p', 'hr');

-- CreateEnum
CREATE TYPE "ElementType" AS ENUM ('pubfield', 'structural');

-- DropForeignKey
ALTER TABLE "form_inputs" DROP CONSTRAINT "form_inputs_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "form_inputs" DROP CONSTRAINT "form_inputs_formId_fkey";

-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "access" "FormAccessType" NOT NULL DEFAULT 'private';

-- DropTable
DROP TABLE "form_inputs";

-- CreateTable
CREATE TABLE "form_elements" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "type" "ElementType" NOT NULL,
    "fieldId" TEXT,
    "formId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "element" "StructuralFormElement",
    "content" TEXT,
    "required" BOOLEAN,
    "isSubmit" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "form_elements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "form_elements_fieldId_formId_key" ON "form_elements"("fieldId", "formId");

-- AddForeignKey
ALTER TABLE "form_elements" ADD CONSTRAINT "form_elements_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "pub_fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_elements" ADD CONSTRAINT "form_elements_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20240724231044_update_form_elements to flattened file"

# Migration: 20240725202915_enforce_unique_user_community_columns_in_members_table by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240725202915_enforce_unique_user_community_columns_in_members_table

/*
  Warnings:

  - A unique constraint covering the columns `[userId,communityId]` on the table `members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "members_userId_communityId_key" ON "members"("userId", "communityId");

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20240725202915_enforce_unique_user_community_columns_in_members_table to flattened file"

# Migration: 20240729202132_user_id_to_member_id by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240729202132_user_id_to_member_id

ALTER TYPE "CoreSchemaType" RENAME VALUE 'UserId' TO 'MemberId';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20240729202132_user_id_to_member_id to flattened file"

# Migration: 20240731145045_remove_old_references_in_schemas by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240731145045_remove_old_references_in_schemas

UPDATE
    "PubFieldSchema"
SET
    schema = jsonb_set(schema, '{$id}', concat('"unjournal:', split_part(schema ->> '$id', ':', 2), '"')::jsonb)
WHERE
    split_part(schema ->> '$id', ':', 1) = 'pubpub'
RETURNING
    schema;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20240731145045_remove_old_references_in_schemas to flattened file"

# Migration: 20240806164513_add_password_hash_and_salt_to_users_table by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240806164513_add_password_hash_and_salt_to_users_table

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "passwordHash" TEXT;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240806164513_add_password_hash_and_salt_to_users_table to flattened file"

# Migration: 20240806170730_add_sessions_table by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240806170730_add_sessions_table

-- CreateTable
CREATE TABLE
    "sessions" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid (),
        "userId" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
    );

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240806170730_add_sessions_table to flattened file"

# Migration: 20240806170732_update_comments by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240806170732_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model sessions comments



-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments

COMMENT ON COLUMN "PubFieldSchema"."schema" IS '@type(JSONSchemaType<any>, ''ajv'', true, false, true)';


-- Model pub_values comments



-- Model pub_types comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model action_claim comments



-- Model action_move comments



-- Model members comments



-- Model member_groups comments



-- Model permissions comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments



-- Model forms comments



-- Model form_elements comments



-- Model api_access_tokens comments



-- Model api_access_logs comments



-- Model api_access_permissions comments

COMMENT ON COLUMN "api_access_permissions"."constraints" IS '@type(ApiAccessPermissionConstraints, ''../types'', true, false, true)';


-- Model form_to_permissions comments;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240806170732_update_comments to flattened file"

# Migration: 20240806183507_support_buttons_in_form_element by Allison King
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240806183507_support_buttons_in_form_element

/*
  Warnings:

  - You are about to drop the column `isSubmit` on the `form_elements` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[type,label,formId]` on the table `form_elements` will be added. If there are existing duplicate values, this will fail.

*/

-- AlterEnum
ALTER TYPE "ElementType" ADD VALUE 'button';

-- AlterTable
ALTER TABLE "form_elements" ADD COLUMN     "stageId" TEXT,
ALTER COLUMN "order" DROP NOT NULL;
ALTER TABLE "form_elements" DROP COLUMN "isSubmit";

-- CreateIndex
CREATE UNIQUE INDEX "form_elements_type_label_formId_key" ON "form_elements"("type", "label", "formId");

-- AddForeignKey
ALTER TABLE "form_elements" ADD CONSTRAINT "form_elements_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Allison King" GIT_COMMITTER_EMAIL="aking@knowledgefutures.org" git commit --no-verify --no-gpg-sign --author="Allison King <aking@knowledgefutures.org>" -m "Move migration 20240806183507_support_buttons_in_form_element to flattened file"

# Migration: 20240819104844_add_authtokentype_to_both_session_and_authtoken by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240819104844_add_authtokentype_to_both_session_and_authtoken

-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM (
    'generic',
    'passwordReset',
    'signup',
    'verifyEmail'
);

-- AlterTable
ALTER TABLE "auth_tokens"
ADD COLUMN "type" "AuthTokenType" NOT NULL DEFAULT 'generic',
ALTER COLUMN "id"
SET DEFAULT gen_random_uuid ();

-- AlterTable
ALTER TABLE "sessions"
ADD COLUMN "type" "AuthTokenType" NOT NULL DEFAULT 'generic';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240819104844_add_authtokentype_to_both_session_and_authtoken to flattened file"

# Migration: 20240821101734_update_comments by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240821101734_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model sessions comments

COMMENT ON COLUMN "sessions"."type" IS 'With what type of token is this session created? Used for determining on a page-by-page basis whether to allow a certain session to access it. For instance, a verify email token/session should not allow you to access the password reset page.';


-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments

COMMENT ON COLUMN "PubFieldSchema"."schema" IS '@type(JSONSchemaType<any>, ''ajv'', true, false, true)';


-- Model pub_values comments



-- Model pub_types comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model action_claim comments



-- Model action_move comments



-- Model members comments



-- Model member_groups comments



-- Model permissions comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments



-- Model forms comments



-- Model form_elements comments



-- Model api_access_tokens comments



-- Model api_access_logs comments



-- Model api_access_permissions comments

COMMENT ON COLUMN "api_access_permissions"."constraints" IS '@type(ApiAccessPermissionConstraints, ''../types'', true, false, true)';


-- Model form_to_permissions comments



-- Enum AuthTokenType comments

COMMENT ON TYPE "AuthTokenType" IS '@property generic - For most use-cases. This will just authenticate you with a regular session.
@property passwordReset - For resetting your password only
@property signup - For signing up, but also when you''re invited to a community
@property verifyEmail - For verifying your email address';


-- Enum CoreSchemaType comments




-- Enum MemberRole comments




-- Enum Action comments




-- Enum ActionRunStatus comments




-- Enum Event comments




-- Enum FormAccessType comments




-- Enum StructuralFormElement comments




-- Enum ElementType comments




-- Enum ApiAccessType comments




-- Enum ApiAccessScope comments;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240821101734_update_comments to flattened file"

# Migration: 20240829135909_rename_unjournal_fields by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240829135909_rename_unjournal_fields

-- Add "legacy" to fields that don't have schemas and archive
UPDATE
    pub_fields
SET
    name = '(Legacy) ' || name,
    slug = 'legacy-' || slug,
    "isArchived" = true
WHERE
    "schemaName" IS null;

-- Replace field names in instance config
UPDATE
    integration_instances
SET
    config = replace(
        config :: TEXT,
        'unjournal:',
        'legacy-unjournal:'
    ) :: jsonb;

-- Remove form elements tied to schemaless fields
DELETE FROM
    form_elements USING pub_fields
WHERE
    "form_elements"."fieldId" IS NOT null
    AND "pub_fields"."schemaName" IS null;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20240829135909_rename_unjournal_fields to flattened file"

# Migration: 20240829182113_remove_supabase_id by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240829182113_remove_supabase_id

/*
  Warnings:

  - You are about to drop the column `supabaseId` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_supabaseId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "supabaseId";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20240829182113_remove_supabase_id to flattened file"

# Migration: 20240905145651_component_configuration by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240905145651_component_configuration

/*
  Warnings:

  - You are about to drop the column `description` on the `form_elements` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "InputComponent" AS ENUM ('textArea', 'textInput', 'datePicker', 'checkbox', 'fileUpload', 'memberSelect', 'confidenceInterval');

-- AlterTable
ALTER TABLE "form_elements" DROP COLUMN "description",
ADD COLUMN     "component" "InputComponent",
ADD COLUMN     "config" JSONB;

-- Set default form components
UPDATE "form_elements" SET "component" = 'checkbox'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'Boolean'::"CoreSchemaType";
UPDATE "form_elements" SET "component" = 'textInput'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'String'::"CoreSchemaType";
UPDATE "form_elements" SET "component" = 'datePicker'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'DateTime'::"CoreSchemaType";
UPDATE "form_elements" SET "component" = 'textInput'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'Email'::"CoreSchemaType";
UPDATE "form_elements" SET "component" = 'fileUpload'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'FileUpload'::"CoreSchemaType";
UPDATE "form_elements" SET "component" = 'textInput'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'URL'::"CoreSchemaType";
UPDATE "form_elements" SET "component" = 'memberSelect'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'MemberId'::"CoreSchemaType";
UPDATE "form_elements" SET "component" = 'confidenceInterval'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'Vector3'::"CoreSchemaType";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20240905145651_component_configuration to flattened file"

# Migration: 20240917200221_add_relationships_to_pub_values by Allison King
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240917200221_add_relationships_to_pub_values

/*
  Warnings:

  - A unique constraint covering the columns `[pubId,relatedPubId,fieldId]` on the table `pub_values` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "pub_fields" ADD COLUMN     "isRelation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "pub_values" ADD COLUMN     "relatedPubId" TEXT,
ALTER COLUMN "value" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pub_values_pubId_relatedPubId_fieldId_key" ON "pub_values"("pubId", "relatedPubId", "fieldId");

-- AddForeignKey
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_relatedPubId_fkey" FOREIGN KEY ("relatedPubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Allison King" GIT_COMMITTER_EMAIL="aking@knowledgefutures.org" git commit --no-verify --no-gpg-sign --author="Allison King <aking@knowledgefutures.org>" -m "Move migration 20240917200221_add_relationships_to_pub_values to flattened file"

# Migration: 20240923161145_add_null_core_schema_type_and_make_pubvalues_unique_constraint_not_null_unique by Allison King
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240923161145_add_null_core_schema_type_and_make_pubvalues_unique_constraint_not_null_unique

-- AlterEnum
ALTER TYPE "CoreSchemaType" ADD VALUE 'Null';

-- Alter the unique constraint so that Nulls are not distinct
-- We want to be able to still have a unique constraint on just pubId and fieldId if there is a null relatedPubId
BEGIN;
DROP INDEX "pub_values_pubId_relatedPubId_fieldId_key";
CREATE UNIQUE INDEX "pub_values_pubId_relatedPubId_fieldId_key" ON "pub_values"("pubId", "relatedPubId", "fieldId")
WHERE "relatedPubId" IS NOT NULL;

CREATE UNIQUE INDEX "pub_values_pubId_fieldId_key" ON "pub_values"("pubId", "fieldId")
WHERE "relatedPubId" IS NULL;
COMMIT;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Allison King" GIT_COMMITTER_EMAIL="aking@knowledgefutures.org" git commit --no-verify --no-gpg-sign --author="Allison King <aking@knowledgefutures.org>" -m "Move migration 20240923161145_add_null_core_schema_type_and_make_pubvalues_unique_constraint_not_null_unique to flattened file"

# Migration: 20240930150006_add_number_numeric_string_array by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20240930150006_add_number_numeric_string_array

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CoreSchemaType" ADD VALUE 'Number';
ALTER TYPE "CoreSchemaType" ADD VALUE 'NumericArray';
ALTER TYPE "CoreSchemaType" ADD VALUE 'StringArray';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20240930150006_add_number_numeric_string_array to flattened file"

# Migration: 20241002220742_remove_label_column_from_inputs by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241002220742_remove_label_column_from_inputs

-- Move existing labels into the config object
UPDATE "form_elements"
  SET config = jsonb_build_object('label', "form_elements"."label")
  WHERE component != 'checkbox'::"InputComponent" AND type = 'pubfield'::"ElementType";
UPDATE "form_elements"
  SET config = jsonb_build_object('groupLabel', "form_elements"."label")
  WHERE component = 'checkbox'::"InputComponent" AND type = 'pubfield'::"ElementType";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20241002220742_remove_label_column_from_inputs to flattened file"

# Migration: 20241007162426_drop_history_tables_and_add_cascades by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241007162426_drop_history_tables_and_add_cascades

/*
  Warnings:

  - You are about to drop the `action_claim` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `action_move` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "action_claim" DROP CONSTRAINT "action_claim_pubId_fkey";

-- DropForeignKey
ALTER TABLE "action_claim" DROP CONSTRAINT "action_claim_stageId_fkey";

-- DropForeignKey
ALTER TABLE "action_claim" DROP CONSTRAINT "action_claim_userId_fkey";

-- DropForeignKey
ALTER TABLE "action_move" DROP CONSTRAINT "action_move_destinationStageId_fkey";

-- DropForeignKey
ALTER TABLE "action_move" DROP CONSTRAINT "action_move_pubId_fkey";

-- DropForeignKey
ALTER TABLE "action_move" DROP CONSTRAINT "action_move_sourceStageId_fkey";

-- DropForeignKey
ALTER TABLE "action_move" DROP CONSTRAINT "action_move_userId_fkey";

-- DropForeignKey
ALTER TABLE "form_elements" DROP CONSTRAINT "form_elements_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "form_elements" DROP CONSTRAINT "form_elements_formId_fkey";

-- DropForeignKey
ALTER TABLE "forms" DROP CONSTRAINT "forms_communityId_fkey";

-- DropForeignKey
ALTER TABLE "member_groups" DROP CONSTRAINT "member_groups_communityId_fkey";

-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_userId_fkey";

-- DropForeignKey
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_memberGroupId_fkey";

-- DropForeignKey
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_memberId_fkey";

-- DropTable
DROP TABLE "action_claim";

-- DropTable
DROP TABLE "action_move";

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_groups" ADD CONSTRAINT "member_groups_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_elements" ADD CONSTRAINT "form_elements_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "pub_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_elements" ADD CONSTRAINT "form_elements_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20241007162426_drop_history_tables_and_add_cascades to flattened file"

# Migration: 20241007162428_update_comments by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241007162428_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model sessions comments

COMMENT ON COLUMN "sessions"."type" IS 'With what type of token is this session created? Used for determining on a page-by-page basis whether to allow a certain session to access it. For instance, a verify email token/session should not allow you to access the password reset page.';


-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments

COMMENT ON COLUMN "PubFieldSchema"."schema" IS '@type(JSONSchemaType<any>, ''ajv'', true, false, true)';


-- Model pub_values comments



-- Model pub_types comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model members comments



-- Model member_groups comments



-- Model permissions comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments



-- Model forms comments



-- Model form_elements comments



-- Model api_access_tokens comments



-- Model api_access_logs comments



-- Model api_access_permissions comments

COMMENT ON COLUMN "api_access_permissions"."constraints" IS '@type(ApiAccessPermissionConstraints, ''../types'', true, false, true)';


-- Model form_to_permissions comments



-- Enum AuthTokenType comments

COMMENT ON TYPE "AuthTokenType" IS '@property generic - For most use-cases. This will just authenticate you with a regular session.
@property passwordReset - For resetting your password only
@property signup - For signing up, but also when you''re invited to a community
@property verifyEmail - For verifying your email address';


-- Enum CoreSchemaType comments




-- Enum MemberRole comments




-- Enum Action comments




-- Enum ActionRunStatus comments




-- Enum Event comments




-- Enum FormAccessType comments




-- Enum StructuralFormElement comments




-- Enum ElementType comments




-- Enum InputComponent comments




-- Enum ApiAccessType comments




-- Enum ApiAccessScope comments;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20241007162428_update_comments to flattened file"

# Migration: 20241007212932_add_more_options_to_input_component_enum by Allison King
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241007212932_add_more_options_to_input_component_enum

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InputComponent" ADD VALUE 'checkboxGroup';
ALTER TYPE "InputComponent" ADD VALUE 'radioGroup';
ALTER TYPE "InputComponent" ADD VALUE 'selectDropdown';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Allison King" GIT_COMMITTER_EMAIL="aking@knowledgefutures.org" git commit --no-verify --no-gpg-sign --author="Allison King <aking@knowledgefutures.org>" -m "Move migration 20241007212932_add_more_options_to_input_component_enum to flattened file"

# Migration: 20241016174257_add_multivalue_input_to_input_component_enum by Allison King
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241016174257_add_multivalue_input_to_input_component_enum

-- AlterEnum
ALTER TYPE "InputComponent" ADD VALUE 'multivalueInput';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Allison King" GIT_COMMITTER_EMAIL="aking@knowledgefutures.org" git commit --no-verify --no-gpg-sign --author="Allison King <aking@knowledgefutures.org>" -m "Move migration 20241016174257_add_multivalue_input_to_input_component_enum to flattened file"

# Migration: 20241017223037_add_new_membership_tables by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241017223037_add_new_membership_tables

/*
  Warnings:

  - You are about to drop the column `role` on the `member_groups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "member_groups" DROP COLUMN "role";

-- CreateTable
CREATE TABLE "community_memberships" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "role" "MemberRole" NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT,
    "memberGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK ( num_nonnulls("userId", "memberGroupId") = 1 ),
    CONSTRAINT "community_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pub_memberships" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "role" "MemberRole" NOT NULL,
    "pubId" TEXT NOT NULL,
    "userId" TEXT,
    "memberGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK ( num_nonnulls("userId", "memberGroupId") = 1 ),
    CONSTRAINT "pub_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_memberships" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "role" "MemberRole" NOT NULL,
    "stageId" TEXT NOT NULL,
    "userId" TEXT,
    "memberGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK ( num_nonnulls("userId", "memberGroupId") = 1 ),
    CONSTRAINT "stage_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_memberships" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "formId" TEXT NOT NULL,
    "userId" TEXT,
    "memberGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK ( num_nonnulls("userId", "memberGroupId") = 1 ),
    CONSTRAINT "form_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_memberships_communityId_userId_key" ON "community_memberships"("communityId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "community_memberships_communityId_memberGroupId_key" ON "community_memberships"("communityId", "memberGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "pub_memberships_pubId_userId_key" ON "pub_memberships"("pubId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "pub_memberships_pubId_memberGroupId_key" ON "pub_memberships"("pubId", "memberGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "stage_memberships_stageId_userId_key" ON "stage_memberships"("stageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "stage_memberships_stageId_memberGroupId_key" ON "stage_memberships"("stageId", "memberGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "form_memberships_formId_userId_key" ON "form_memberships"("formId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "form_memberships_formId_memberGroupId_key" ON "form_memberships"("formId", "memberGroupId");

-- AddForeignKey
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_memberships" ADD CONSTRAINT "pub_memberships_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_memberships" ADD CONSTRAINT "pub_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_memberships" ADD CONSTRAINT "pub_memberships_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_memberships" ADD CONSTRAINT "stage_memberships_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_memberships" ADD CONSTRAINT "stage_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_memberships" ADD CONSTRAINT "stage_memberships_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_memberships" ADD CONSTRAINT "form_memberships_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_memberships" ADD CONSTRAINT "form_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_memberships" ADD CONSTRAINT "form_memberships_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20241017223037_add_new_membership_tables to flattened file"

# Migration: 20241017223040_update_comments by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241017223040_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model sessions comments

COMMENT ON COLUMN "sessions"."type" IS 'With what type of token is this session created? Used for determining on a page-by-page basis whether to allow a certain session to access it. For instance, a verify email token/session should not allow you to access the password reset page.';


-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments

COMMENT ON COLUMN "PubFieldSchema"."schema" IS '@type(JSONSchemaType<any>, ''ajv'', true, false, true)';


-- Model pub_values comments



-- Model pub_types comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model members comments



-- Model member_groups comments



-- Model community_memberships comments



-- Model pub_memberships comments



-- Model stage_memberships comments



-- Model form_memberships comments



-- Model permissions comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments



-- Model forms comments



-- Model form_elements comments



-- Model api_access_tokens comments



-- Model api_access_logs comments



-- Model api_access_permissions comments

COMMENT ON COLUMN "api_access_permissions"."constraints" IS '@type(ApiAccessPermissionConstraints, ''../types'', true, false, true)';


-- Model form_to_permissions comments



-- Enum AuthTokenType comments

COMMENT ON TYPE "AuthTokenType" IS '@property generic - For most use-cases. This will just authenticate you with a regular session.
@property passwordReset - For resetting your password only
@property signup - For signing up, but also when you''re invited to a community
@property verifyEmail - For verifying your email address';


-- Enum CoreSchemaType comments




-- Enum MemberRole comments




-- Enum Action comments




-- Enum ActionRunStatus comments




-- Enum Event comments




-- Enum FormAccessType comments




-- Enum StructuralFormElement comments




-- Enum ElementType comments




-- Enum InputComponent comments




-- Enum ApiAccessType comments




-- Enum ApiAccessScope comments;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20241017223040_update_comments to flattened file"

# Migration: 20241021151230_add_rich_text_type by Allison King
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241021151230_add_rich_text_type

-- AlterEnum
ALTER TYPE "CoreSchemaType" ADD VALUE 'RichText';

-- AlterEnum
ALTER TYPE "InputComponent" ADD VALUE 'richText';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Allison King" GIT_COMMITTER_EMAIL="aking@knowledgefutures.org" git commit --no-verify --no-gpg-sign --author="Allison King <aking@knowledgefutures.org>" -m "Move migration 20241021151230_add_rich_text_type to flattened file"

# Migration: 20241030175616_add_is_title_to_pubfield_pubtype_join_table by Allison King
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241030175616_add_is_title_to_pubfield_pubtype_join_table

-- AlterTable
ALTER TABLE "_PubFieldToPubType" ADD COLUMN     "isTitle" BOOLEAN NOT NULL DEFAULT false;

-- RenameIndex
ALTER INDEX "_PubFieldToPubType_AB_unique" RENAME TO "_PubFieldToPubType_A_B_key";

-- Create a unique index when isTitle=true 
-- This is done manually because prisma doesn't currently support defining unique constraints this way in the schema file
CREATE UNIQUE INDEX unique_pubType_isTitle on "_PubFieldToPubType" ("B") where "isTitle" is true;

-- Try to match on if there's an existing 'title' or 'name' field and set that field to isTitle=true
WITH FirstMatchingPubField AS (
    SELECT
      "_PubFieldToPubType"."A" as "pubfield",
      "_PubFieldToPubType"."B" as "pubtype",
      pub_fields.slug,
      ROW_NUMBER() OVER (PARTITION BY "_PubFieldToPubType"."B" ORDER BY pub_fields."createdAt" ASC) AS row_num
    FROM
      "_PubFieldToPubType"
      JOIN pub_fields ON "_PubFieldToPubType"."A" = pub_fields.id 
    WHERE
      (pub_fields."schemaName" = 'String' OR pub_fields."schemaName" = 'Email' OR pub_fields."schemaName" = 'URL')
      AND (
          pub_fields.name ILIKE '%title%'
          OR pub_fields.name ILIKE '%name%'
      )
)
UPDATE "_PubFieldToPubType"
SET "isTitle" = true 
FROM FirstMatchingPubField
WHERE 
  "_PubFieldToPubType"."A" = FirstMatchingPubField.pubfield
  AND "_PubFieldToPubType"."B" = FirstMatchingPubField.pubtype 
  AND FirstMatchingPubField.row_num = 1;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Allison King" GIT_COMMITTER_EMAIL="aking@knowledgefutures.org" git commit --no-verify --no-gpg-sign --author="Allison King <aking@knowledgefutures.org>" -m "Move migration 20241030175616_add_is_title_to_pubfield_pubtype_join_table to flattened file"

# Migration: 20241030175617_update_comments by Allison King
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241030175617_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model sessions comments

COMMENT ON COLUMN "sessions"."type" IS 'With what type of token is this session created? Used for determining on a page-by-page basis whether to allow a certain session to access it. For instance, a verify email token/session should not allow you to access the password reset page.';


-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments

COMMENT ON COLUMN "PubFieldSchema"."schema" IS '@type(JSONSchemaType<any>, ''ajv'', true, false, true)';


-- Model pub_values comments



-- Model pub_types comments



-- Model _PubFieldToPubType comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model members comments



-- Model member_groups comments



-- Model permissions comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments



-- Model forms comments



-- Model form_elements comments



-- Model api_access_tokens comments



-- Model api_access_logs comments



-- Model api_access_permissions comments

COMMENT ON COLUMN "api_access_permissions"."constraints" IS '@type(ApiAccessPermissionConstraints, ''../types'', true, false, true)';


-- Model form_to_permissions comments



-- Enum AuthTokenType comments

COMMENT ON TYPE "AuthTokenType" IS '@property generic - For most use-cases. This will just authenticate you with a regular session.
@property passwordReset - For resetting your password only
@property signup - For signing up, but also when you''re invited to a community
@property verifyEmail - For verifying your email address';


-- Enum CoreSchemaType comments




-- Enum MemberRole comments




-- Enum Action comments




-- Enum ActionRunStatus comments




-- Enum Event comments




-- Enum FormAccessType comments




-- Enum StructuralFormElement comments




-- Enum ElementType comments




-- Enum InputComponent comments




-- Enum ApiAccessType comments




-- Enum ApiAccessScope comments;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Allison King" GIT_COMMITTER_EMAIL="aking@knowledgefutures.org" git commit --no-verify --no-gpg-sign --author="Allison King <aking@knowledgefutures.org>" -m "Move migration 20241030175617_update_comments to flattened file"

# Migration: 20241105184158_copy_membership_data by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241105184158_copy_membership_data

BEGIN;

INSERT INTO "community_memberships" ("id", "role", "communityId", "userId", "createdAt", "updatedAt")
    SELECT "id", "role", "communityId", "userId", "createdAt", "updatedAt" FROM "members"
    ON CONFLICT ("id") DO NOTHING;

INSERT INTO "form_memberships" ("formId", "userId")
    SELECT "formId", "userId" FROM "form_to_permissions"
    JOIN "permissions"
        ON "permissions"."id" = "form_to_permissions"."permissionId"
    JOIN "members"
        ON "members"."id" = "permissions"."memberId"
    ON CONFLICT DO NOTHING;

COMMIT;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20241105184158_copy_membership_data to flattened file"

# Migration: 20241106060651_delete_old_permissions_and_membership_tables by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241106060651_delete_old_permissions_and_membership_tables

/*
  Warnings:

  - You are about to drop the `_PermissionToPub` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PermissionToStage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `form_to_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PermissionToPub" DROP CONSTRAINT "_PermissionToPub_A_fkey";

-- DropForeignKey
ALTER TABLE "_PermissionToPub" DROP CONSTRAINT "_PermissionToPub_B_fkey";

-- DropForeignKey
ALTER TABLE "_PermissionToStage" DROP CONSTRAINT "_PermissionToStage_A_fkey";

-- DropForeignKey
ALTER TABLE "_PermissionToStage" DROP CONSTRAINT "_PermissionToStage_B_fkey";

-- DropForeignKey
ALTER TABLE "form_to_permissions" DROP CONSTRAINT "form_to_permissions_formId_fkey";

-- DropForeignKey
ALTER TABLE "form_to_permissions" DROP CONSTRAINT "form_to_permissions_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_communityId_fkey";

-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_userId_fkey";

-- DropForeignKey
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_memberGroupId_fkey";

-- DropForeignKey
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_memberId_fkey";

-- DropTable
DROP TABLE "_PermissionToPub";

-- DropTable
DROP TABLE "_PermissionToStage";

-- DropTable
DROP TABLE "form_to_permissions";

-- DropTable
DROP TABLE "members";

-- DropTable
DROP TABLE "permissions";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20241106060651_delete_old_permissions_and_membership_tables to flattened file"

# Migration: 20241106060653_update_comments by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241106060653_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model sessions comments

COMMENT ON COLUMN "sessions"."type" IS 'With what type of token is this session created? Used for determining on a page-by-page basis whether to allow a certain session to access it. For instance, a verify email token/session should not allow you to access the password reset page.';


-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments

COMMENT ON COLUMN "PubFieldSchema"."schema" IS '@type(JSONSchemaType<any>, ''ajv'', true, false, true)';


-- Model pub_values comments



-- Model pub_types comments



-- Model _PubFieldToPubType comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model member_groups comments



-- Model community_memberships comments



-- Model pub_memberships comments



-- Model stage_memberships comments



-- Model form_memberships comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments



-- Model forms comments



-- Model form_elements comments



-- Model api_access_tokens comments



-- Model api_access_logs comments



-- Model api_access_permissions comments

COMMENT ON COLUMN "api_access_permissions"."constraints" IS '@type(ApiAccessPermissionConstraints, ''../types'', true, false, true)';


-- Enum AuthTokenType comments

COMMENT ON TYPE "AuthTokenType" IS '@property generic - For most use-cases. This will just authenticate you with a regular session.
@property passwordReset - For resetting your password only
@property signup - For signing up, but also when you''re invited to a community
@property verifyEmail - For verifying your email address';


-- Enum CoreSchemaType comments




-- Enum MemberRole comments




-- Enum Action comments




-- Enum ActionRunStatus comments




-- Enum Event comments




-- Enum FormAccessType comments




-- Enum StructuralFormElement comments




-- Enum ElementType comments




-- Enum InputComponent comments




-- Enum ApiAccessType comments




-- Enum ApiAccessScope comments;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20241106060653_update_comments to flattened file"

# Migration: 20241107193617_add_capabilities_to_db by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241107193617_add_capabilities_to_db

-- CreateEnum
CREATE TYPE "Capabilities" AS ENUM (
    'movePub',
    'createPub',
    'viewPub',
    'deletePub',
    'updatePubValues',
    'createRelatedPub',
    'createPubWithForm',
    'editPubWithForm',
    'createPubField',
    'archivePubField',
    'editPubField',
    'createPubType',
    'editPubType',
    'deletePubType',
    'runAction',
    'viewStage',
    'createStage',
    'manageStage',
    'deleteStage',
    'addPubMember',
    'removePubMember',
    'addStageMember',
    'removeStageMember',
    'addFormMember',
    'removeFormMember',
    'addCommunityMember',
    'removeCommunityMember',
    'manageMemberGroups',
    'addCommunity',
    'editCommunity',
    'createForm',
    'editForm',
    'archiveForm',
    'createApiToken',
    'revokeApiToken'
);

-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('community', 'stage', 'pub', 'form');

-- CreateTable
CREATE TABLE "membership_capabilities" (
    "role" "MemberRole" NOT NULL,
    "type" "MembershipType" NOT NULL,
    "capability" "Capabilities" NOT NULL,

    CONSTRAINT "membership_capabilities_pkey" PRIMARY KEY ("role","type","capability")
);

INSERT INTO "membership_capabilities"
VALUES
    ('contributor'::"MemberRole", 'stage'::"MembershipType", 'movePub'::"Capabilities"),
    ('contributor'::"MemberRole", 'stage'::"MembershipType", 'createPub'::"Capabilities"),
    ('contributor'::"MemberRole", 'stage'::"MembershipType", 'viewPub'::"Capabilities"),
    ('contributor'::"MemberRole", 'stage'::"MembershipType", 'updatePubValues'::"Capabilities"),
    ('contributor'::"MemberRole", 'stage'::"MembershipType", 'createRelatedPub'::"Capabilities"),
    ('contributor'::"MemberRole", 'stage'::"MembershipType", 'editPubWithForm'::"Capabilities"),
    ('contributor'::"MemberRole", 'stage'::"MembershipType", 'runAction'::"Capabilities"),
    ('contributor'::"MemberRole", 'stage'::"MembershipType", 'viewStage'::"Capabilities"),
    ('editor'::"MemberRole", 'stage'::"MembershipType", 'movePub'::"Capabilities"),
    ('editor'::"MemberRole", 'stage'::"MembershipType", 'createPub'::"Capabilities"),
    ('editor'::"MemberRole", 'stage'::"MembershipType", 'viewPub'::"Capabilities"),
    ('editor'::"MemberRole", 'stage'::"MembershipType", 'updatePubValues'::"Capabilities"),
    ('editor'::"MemberRole", 'stage'::"MembershipType", 'createRelatedPub'::"Capabilities"),
    ('editor'::"MemberRole", 'stage'::"MembershipType", 'createPubWithForm'::"Capabilities"),
    ('editor'::"MemberRole", 'stage'::"MembershipType", 'editPubWithForm'::"Capabilities"),
    ('editor'::"MemberRole", 'stage'::"MembershipType", 'runAction'::"Capabilities"),
    ('editor'::"MemberRole", 'stage'::"MembershipType", 'viewStage'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'movePub'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'createPub'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'viewPub'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'deletePub'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'updatePubValues'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'createRelatedPub'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'createPubWithForm'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'editPubWithForm'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'runAction'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'viewStage'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'manageStage'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'addPubMember'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'removePubMember'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'addStageMember'::"Capabilities"),
    ('admin'::"MemberRole", 'stage'::"MembershipType", 'removeStageMember'::"Capabilities"),
    ('contributor'::"MemberRole", 'pub'::"MembershipType", 'viewPub'::"Capabilities"),
    ('contributor'::"MemberRole", 'pub'::"MembershipType", 'updatePubValues'::"Capabilities"),
    ('contributor'::"MemberRole", 'pub'::"MembershipType", 'editPubWithForm'::"Capabilities"),
    ('editor'::"MemberRole", 'pub'::"MembershipType", 'movePub'::"Capabilities"),
    ('editor'::"MemberRole", 'pub'::"MembershipType", 'viewPub'::"Capabilities"),
    ('editor'::"MemberRole", 'pub'::"MembershipType", 'updatePubValues'::"Capabilities"),
    ('editor'::"MemberRole", 'pub'::"MembershipType", 'createRelatedPub'::"Capabilities"),
    ('editor'::"MemberRole", 'pub'::"MembershipType", 'editPubWithForm'::"Capabilities"),
    ('admin'::"MemberRole", 'pub'::"MembershipType", 'movePub'::"Capabilities"),
    ('admin'::"MemberRole", 'pub'::"MembershipType", 'viewPub'::"Capabilities"),
    ('admin'::"MemberRole", 'pub'::"MembershipType", 'deletePub'::"Capabilities"),
    ('admin'::"MemberRole", 'pub'::"MembershipType", 'updatePubValues'::"Capabilities"),
    ('admin'::"MemberRole", 'pub'::"MembershipType", 'createRelatedPub'::"Capabilities"),
    ('admin'::"MemberRole", 'pub'::"MembershipType", 'createPubWithForm'::"Capabilities"),
    ('admin'::"MemberRole", 'pub'::"MembershipType", 'editPubWithForm'::"Capabilities"),
    ('admin'::"MemberRole", 'pub'::"MembershipType", 'runAction'::"Capabilities"),
    ('editor'::"MemberRole", 'community'::"MembershipType", 'movePub'::"Capabilities"),
    ('editor'::"MemberRole", 'community'::"MembershipType", 'createPub'::"Capabilities"),
    ('editor'::"MemberRole", 'community'::"MembershipType", 'viewPub'::"Capabilities"),
    ('editor'::"MemberRole", 'community'::"MembershipType", 'deletePub'::"Capabilities"),
    ('editor'::"MemberRole", 'community'::"MembershipType", 'updatePubValues'::"Capabilities"),
    ('editor'::"MemberRole", 'community'::"MembershipType", 'createRelatedPub'::"Capabilities"),
    ('editor'::"MemberRole", 'community'::"MembershipType", 'createPubWithForm'::"Capabilities"),
    ('editor'::"MemberRole", 'community'::"MembershipType", 'editPubWithForm'::"Capabilities"),
    ('editor'::"MemberRole", 'community'::"MembershipType", 'runAction'::"Capabilities"),
    ('editor'::"MemberRole", 'community'::"MembershipType", 'viewStage'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'movePub'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'createPub'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'viewPub'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'deletePub'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'updatePubValues'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'createRelatedPub'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'createPubWithForm'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'editPubWithForm'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'createPubField'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'archivePubField'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'editPubField'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'createPubType'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'editPubType'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'deletePubType'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'runAction'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'viewStage'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'createStage'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'manageStage'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'deleteStage'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'addPubMember'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'removePubMember'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'addStageMember'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'removeStageMember'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'addFormMember'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'removeFormMember'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'addCommunityMember'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'removeCommunityMember'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'manageMemberGroups'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'addCommunity'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'editCommunity'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'createForm'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'editForm'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'archiveForm'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'createApiToken'::"Capabilities"),
    ('admin'::"MemberRole", 'community'::"MembershipType", 'revokeApiToken'::"Capabilities")
;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20241107193617_add_capabilities_to_db to flattened file"

# Migration: 20241107193619_update_comments by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241107193619_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model sessions comments

COMMENT ON COLUMN "sessions"."type" IS 'With what type of token is this session created? Used for determining on a page-by-page basis whether to allow a certain session to access it. For instance, a verify email token/session should not allow you to access the password reset page.';


-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments

COMMENT ON COLUMN "PubFieldSchema"."schema" IS '@type(JSONSchemaType<any>, ''ajv'', true, false, true)';


-- Model pub_values comments



-- Model pub_types comments



-- Model _PubFieldToPubType comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model member_groups comments



-- Model community_memberships comments



-- Model pub_memberships comments



-- Model stage_memberships comments



-- Model form_memberships comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments



-- Model forms comments



-- Model form_elements comments



-- Model api_access_tokens comments



-- Model api_access_logs comments



-- Model api_access_permissions comments

COMMENT ON COLUMN "api_access_permissions"."constraints" IS '@type(ApiAccessPermissionConstraints, ''../types'', true, false, true)';


-- Model membership_capabilities comments



-- Enum AuthTokenType comments

COMMENT ON TYPE "AuthTokenType" IS '@property generic - For most use-cases. This will just authenticate you with a regular session.
@property passwordReset - For resetting your password only
@property signup - For signing up, but also when you''re invited to a community
@property verifyEmail - For verifying your email address';


-- Enum CoreSchemaType comments




-- Enum MemberRole comments




-- Enum Action comments




-- Enum ActionRunStatus comments




-- Enum Event comments




-- Enum FormAccessType comments




-- Enum StructuralFormElement comments




-- Enum ElementType comments




-- Enum InputComponent comments




-- Enum ApiAccessType comments




-- Enum ApiAccessScope comments




-- Enum Capabilities comments




-- Enum MembershipType comments;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20241107193619_update_comments to flattened file"

# Migration: 20241126113759_add_pub_values_updated_at_trigger by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241126113759_add_pub_values_updated_at_trigger

CREATE OR REPLACE FUNCTION update_pub_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "pubs"
    -- it's fine to use CURRENT_TIMESTAMP here because we're inside a transaction
    -- and the timestamp will be the same for all rows in the transaction
    SET "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = CASE
        WHEN TG_OP = 'DELETE' THEN OLD."pubId"
        ELSE NEW."pubId"
    END;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pub_values_update_pub
    AFTER INSERT OR UPDATE OR DELETE ON "pub_values"
    FOR EACH ROW
    EXECUTE FUNCTION update_pub_updated_at();

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20241126113759_add_pub_values_updated_at_trigger to flattened file"

# Migration: 20241126151624_add_google_drive_import_action by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241126151624_add_google_drive_import_action

-- AlterEnum
ALTER TYPE "Action" ADD VALUE 'googleDriveImport';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20241126151624_add_google_drive_import_action to flattened file"

# Migration: 20241203035210_add_default_forms by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241203035210_add_default_forms

-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20241203035210_add_default_forms to flattened file"

# Migration: 20241203164958_add_base_history_fn by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241203164958_add_base_history_fn

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM(
    'insert',
    'update',
    'delete'
);

CREATE DOMAIN modified_by_type AS TEXT CHECK (VALUE ~ '^(user|action-run|api-access-token):[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\|\d+$|^(unknown|system)\|\d+$');

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
    v_userId text;
    v_apiAccessTokenId text;
    v_actionRunId text;
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
        v_userId := v_id;
    WHEN 'api-access-token' THEN
        v_apiAccessTokenId := v_id;
    WHEN 'action-run' THEN
        v_actionRunId := v_id;
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
        USING 'insert'::"OperationType", NULL::json, row_to_json(NEW), NEW."id", v_userId, v_apiAccessTokenId, v_actionRunId, v_other;
    ELSIF (TG_OP = 'UPDATE'
            AND OLD IS DISTINCT FROM NEW) THEN
        -- this is extremely annoying but there's no real other way to check whether
        -- the `lastModifiedBy` is actually set
        -- during the update trigger
        -- as it's not possible to just get the values of the columns of the actual update
        IF v_timestamp_new = v_timestamp_old THEN
            RAISE EXCEPTION 'lastModifiedBy must be explicitly set in UPDATE';
        END IF;
        EXECUTE vc_insert_sql
        USING 'update'::"OperationType", row_to_json(OLD), row_to_json(NEW), NEW."id", v_userId, v_apiAccessTokenId, v_actionRunId, v_other;
    END IF;
        RETURN NULL;
END;
$$
LANGUAGE plpgsql;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20241203164958_add_base_history_fn to flattened file"

# Migration: 20241203193207_add_datacite_action by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241203193207_add_datacite_action

-- AlterEnum
ALTER TYPE "Action" ADD VALUE 'datacite';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20241203193207_add_datacite_action to flattened file"

# Migration: 20241205152006_add_title_field by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241205152006_add_title_field

-- AlterTable
ALTER TABLE "pubs"
    ADD COLUMN "title" TEXT;

-- defined in core/prisma/migrations/20241126113759_add_pub_values_updated_at_trigger/migration.sql
-- we are replacing it with a more complex function that also updates the title
DROP TRIGGER IF EXISTS trigger_pub_values_update_pub ON "pub_values";

DROP FUNCTION IF EXISTS update_pub_updated_at();

CREATE OR REPLACE FUNCTION update_pub_for_value_changes()
    RETURNS TRIGGER
    AS $$
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS tmp_affected_pubs(
        "pubId" text PRIMARY KEY,
        "value" text
    ) ON COMMIT DROP;
    WITH tf AS (
        SELECT DISTINCT ON (inserted_updated_deleted_rows."pubId")
            inserted_updated_deleted_rows."pubId",
            inserted_updated_deleted_rows."value",
            CASE WHEN inserted_updated_deleted_rows."value" IS NULL THEN
                TRUE
            ELSE
                FALSE
            END AS is_null_value
        FROM
            inserted_updated_deleted_rows
            JOIN "pubs" p ON inserted_updated_deleted_rows."pubId" = p."id"
            JOIN "_PubFieldToPubType" pft ON pft."A" = inserted_updated_deleted_rows."fieldId"
                AND pft."B" = p."pubTypeId"
                AND pft."isTitle" = TRUE
    )
    INSERT INTO tmp_affected_pubs("pubId", "value")
    SELECT DISTINCT
        "pubId",
        CASE WHEN is_null_value THEN
            NULL
        ELSE
            ("value" #>> '{}')
        END
    FROM tf
    -- this is to handle edge cases which mostly happen during "UPDATE"s in transactions
    ON CONFLICT("pubId")
        DO UPDATE SET
            "value" = CASE WHEN EXCLUDED."value" IS NULL THEN
                NULL
            ELSE
                EXCLUDED."value"
            END;


    -- this is to handle the actual update of the title
    -- and to ensure that the updatedAt is updated
    UPDATE
        "pubs"
    SET
        "updatedAt" = CURRENT_TIMESTAMP,
        "title" = CASE 
            WHEN TG_OP = 'DELETE' OR tmp."value" IS NULL THEN
                NULL
            ELSE
                tmp."value"
            END
    FROM ( SELECT DISTINCT
            "pubId"
        FROM
            inserted_updated_deleted_rows
    ) AS affected
    LEFT JOIN tmp_affected_pubs tmp ON tmp."pubId" = affected."pubId"
    WHERE
        "pubs"."id" = affected."pubId";
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

-- these triggers run once for every batch of pub_values
-- we need to create separate triggers for insert, update and delete, as they cannot be combined
-- this is slightly more efficient than a single trigger that handles all three operations
-- and runs the same function for each row that has been changed, at the cost
-- of being slightly more complex
CREATE TRIGGER trigger_pub_values_insert_pub
    AFTER INSERT ON "pub_values" REFERENCING NEW TABLE AS inserted_updated_deleted_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_pub_for_value_changes();

CREATE TRIGGER trigger_pub_values_update_pub
    AFTER UPDATE ON "pub_values" REFERENCING NEW TABLE AS inserted_updated_deleted_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_pub_for_value_changes();

CREATE TRIGGER trigger_pub_values_delete_pub
    AFTER DELETE ON "pub_values" REFERENCING OLD TABLE AS inserted_updated_deleted_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_pub_for_value_changes();

-- backfill the title for all pubs
WITH values_titles AS (
    SELECT
        "pubId",
        ("value" #>> '{}') AS "title"
    FROM
        "pub_values"
        JOIN "pubs" ON "pub_values"."pubId" = "pubs"."id"
        JOIN "_PubFieldToPubType" pft ON pft."A" = "pub_values"."fieldId"
            AND pft."B" = "pubs"."pubTypeId"
            AND pft."isTitle" = TRUE)
    UPDATE
        "pubs"
    SET
        "title" = values_titles."title"
    FROM
        values_titles
WHERE
    "pubs"."id" = values_titles."pubId";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20241205152006_add_title_field to flattened file"

# Migration: 20241205192106_unique_pub_type_names by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241205192106_unique_pub_type_names

/*
  Warnings:

  - A unique constraint covering the columns `[name,communityId]` on the table `pub_types` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "pub_types_name_communityId_key" ON "pub_types"("name", "communityId");

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20241205192106_unique_pub_type_names to flattened file"

# Migration: 20241205231134_backfill_default_forms by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241205231134_backfill_default_forms

WITH "components" AS (
    SELECT
        "c".*
    FROM (
        VALUES 
        ('Boolean'::"CoreSchemaType", 'checkbox'::"InputComponent"),
        ('String'::"CoreSchemaType", 'textInput'::"InputComponent"),
        ('DateTime'::"CoreSchemaType", 'datePicker'::"InputComponent"),
        ('Number'::"CoreSchemaType", 'textInput'::"InputComponent"),
        ('NumericArray'::"CoreSchemaType", 'multivalueInput'::"InputComponent"),
        ('StringArray'::"CoreSchemaType", 'multivalueInput'::"InputComponent"),
        ('Email'::"CoreSchemaType", 'textInput'::"InputComponent"),
        ('FileUpload'::"CoreSchemaType", 'fileUpload'::"InputComponent"),
        ('URL'::"CoreSchemaType", 'textInput'::"InputComponent"),
        ('MemberId'::"CoreSchemaType", 'memberSelect'::"InputComponent"),
        ('Vector3'::"CoreSchemaType", 'confidenceInterval'::"InputComponent"),
        ('Null'::"CoreSchemaType", NULL::"InputComponent"),
        ('RichText'::"CoreSchemaType", 'richText'::"InputComponent")
    ) AS c("schema", "component")
),
"form" AS (
    INSERT INTO
        "forms"(
            "name",
            "pubTypeId",
            "slug",
            "communityId",
            "isDefault"
        )
    SELECT
        "pub_types"."name" || ' Editor (Default)',
        "pub_types"."id",
        -- Rough equivalent to our slugify js function, adapted from https://gist.github.com/abn/779166b0c766ce67351c588489831852
        trim(
            BOTH '-'
            FROM
                regexp_replace(
                    lower(trim("pub_types"."name")),
                    '[^a-z0-9\\-_]+',
                    '-',
                    'gi'
                )
        ) || '-default-editor',
        "pub_types"."communityId",
        TRUE
    FROM "pub_types"
    ON CONFLICT DO NOTHING
    RETURNING 
        "forms"."slug",
        "forms"."id",
        "forms"."pubTypeId"
),
"title_element" AS (
    INSERT INTO
        "form_elements"("formId", "type", "content", "order", "element")
    SELECT
        "form"."id",
        'structural',
        '# :value{field="title"}',
        0,
        'p'
    FROM
        "form"
)
INSERT INTO
    "form_elements"(
        "fieldId",
        "formId",
        "label",
        "type",
        "order",
        "component"
    )
SELECT
    "pub_fields"."id",
    "form"."id" AS "formId",
    "pub_fields"."name" AS "label",
    'pubfield' AS "type",
    ROW_NUMBER() OVER (PARTITION BY "form"."id") + 1 AS "order",
    "components"."component"
FROM
    "form"
    INNER JOIN "_PubFieldToPubType" ON "_PubFieldToPubType"."B" = "form"."pubTypeId"
    INNER JOIN "pub_fields" ON "pub_fields"."id" = "_PubFieldToPubType"."A"
    INNER JOIN "components" ON "components"."schema" = "pub_fields"."schemaName";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20241205231134_backfill_default_forms to flattened file"

# Migration: 20241210172906_trigger_for_changing_is_title by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241210172906_trigger_for_changing_is_title

-- when _PubFieldToPubType.isTitle is set to true, we need to update the pub.title
-- so we just rerun a newly created "update_pubtitle" function
-- on any insert, update or delete of _PubFieldToPubType where isTitle is different from the previous value or set to true
CREATE OR REPLACE FUNCTION update_pub_title_for_pub_type() RETURNS TRIGGER AS $$
BEGIN

    UPDATE "pubs"
    SET "title" = title_values.value
    FROM (
        SELECT DISTINCT ON (p.id)
            p.id as pub_id,
            (
                SELECT pv.value #>> '{}'
                FROM "pub_values" pv
                JOIN "_PubFieldToPubType" pft ON 
                    pft."A" = pv."fieldId" AND
                    pft."B" = p."pubTypeId" AND
                    pft."isTitle" = true
                WHERE pv."pubId" = p.id
            ) as value
        FROM "pubs" p
        WHERE p."pubTypeId" = COALESCE(NEW."B", OLD."B")
    ) title_values
    WHERE "pubs"."id" = title_values.pub_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pub_field_to_pub_type_insert_pub_title
AFTER INSERT ON "_PubFieldToPubType"
FOR EACH ROW
WHEN (NEW."isTitle" IS TRUE)
EXECUTE FUNCTION update_pub_title_for_pub_type();

CREATE TRIGGER trigger_pub_field_to_pub_type_update_pub_title
AFTER UPDATE ON "_PubFieldToPubType"
FOR EACH ROW
WHEN (NEW."isTitle" IS DISTINCT FROM OLD."isTitle")
EXECUTE FUNCTION update_pub_title_for_pub_type();


CREATE TRIGGER trigger_pub_field_to_pub_type_delete_pub_title
AFTER DELETE ON "_PubFieldToPubType"
FOR EACH ROW
WHEN (OLD."isTitle" IS TRUE)
EXECUTE FUNCTION update_pub_title_for_pub_type();

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20241210172906_trigger_for_changing_is_title to flattened file"

# Migration: 20241212130738_update_comments by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241212130738_update_comments

-- generator-version: 1.0.0

-- Model users comments



-- Model sessions comments

COMMENT ON COLUMN "sessions"."type" IS 'With what type of token is this session created? Used for determining on a page-by-page basis whether to allow a certain session to access it. For instance, a verify email token/session should not allow you to access the password reset page.';


-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments

COMMENT ON COLUMN "PubFieldSchema"."schema" IS '@type(JSONSchemaType<any>, ''ajv'', true, false, true)';


-- Model pub_values comments



-- Model pub_values_history comments



-- Model pub_types comments



-- Model _PubFieldToPubType comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model member_groups comments



-- Model community_memberships comments



-- Model pub_memberships comments



-- Model stage_memberships comments



-- Model form_memberships comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments



-- Model forms comments



-- Model form_elements comments



-- Model api_access_tokens comments



-- Model api_access_logs comments



-- Model api_access_permissions comments

COMMENT ON COLUMN "api_access_permissions"."constraints" IS '@type(ApiAccessPermissionConstraints, ''../types'', true, false, true)';


-- Model membership_capabilities comments



-- Enum AuthTokenType comments

COMMENT ON TYPE "AuthTokenType" IS '@property generic - For most use-cases. This will just authenticate you with a regular session.
@property passwordReset - For resetting your password only
@property signup - For signing up, but also when you''re invited to a community
@property verifyEmail - For verifying your email address';


-- Enum CoreSchemaType comments




-- Enum OperationType comments




-- Enum MemberRole comments




-- Enum Action comments




-- Enum ActionRunStatus comments




-- Enum Event comments




-- Enum FormAccessType comments




-- Enum StructuralFormElement comments




-- Enum ElementType comments




-- Enum InputComponent comments




-- Enum ApiAccessType comments




-- Enum ApiAccessScope comments




-- Enum Capabilities comments




-- Enum MembershipType comments;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20241212130738_update_comments to flattened file"

# Migration: 20241212164758_fix_cascading_delete_issues by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241212164758_fix_cascading_delete_issues

-- DropForeignKey
ALTER TABLE "api_access_logs" DROP CONSTRAINT "api_access_logs_accessTokenId_fkey";

-- DropForeignKey
ALTER TABLE "api_access_permissions" DROP CONSTRAINT "api_access_permissions_apiAccessTokenId_fkey";

-- DropForeignKey
ALTER TABLE "api_access_tokens" DROP CONSTRAINT "api_access_tokens_communityId_fkey";

-- DropForeignKey
ALTER TABLE "api_access_tokens" DROP CONSTRAINT "api_access_tokens_issuedById_fkey";

-- AlterTable
ALTER TABLE "api_access_logs" ALTER COLUMN "accessTokenId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "api_access_tokens" ALTER COLUMN "issuedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "api_access_tokens" ADD CONSTRAINT "api_access_tokens_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_access_tokens" ADD CONSTRAINT "api_access_tokens_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_access_logs" ADD CONSTRAINT "api_access_logs_accessTokenId_fkey" FOREIGN KEY ("accessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_access_permissions" ADD CONSTRAINT "api_access_permissions_apiAccessTokenId_fkey" FOREIGN KEY ("apiAccessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20241212164758_fix_cascading_delete_issues to flattened file"

# Migration: 20241214173138_add_pub_values_history_history_table by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241214173138_add_pub_values_history_history_table

/*
 Warnings:

 - Added the required column `lastModifiedBy` to the `pub_values` table without a default value. This is not possible if the table is not empty.
 */
-- AlterTable
-- first we add the column with a default value
ALTER TABLE "pub_values"
  ADD COLUMN "lastModifiedBy" modified_by_type NOT NULL DEFAULT CONCAT('unknown', '|', FLOOR(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000));

-- then we remove the default value
ALTER TABLE "pub_values"
  ALTER COLUMN "lastModifiedBy" DROP DEFAULT;

-- CreateTable
CREATE TABLE "pub_values_history"(
  "id" text NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "operationType" "OperationType" NOT NULL,
  "oldRowData" jsonb,
  "newRowData" jsonb,
  "pubValueId" text,
  "userId" text,
  "apiAccessTokenId" text,
  "actionRunId" text,
  "other" text,
  CONSTRAINT "pub_values_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pub_values_history"
  ADD CONSTRAINT "pub_values_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_values_history"
  ADD CONSTRAINT "pub_values_history_apiAccessTokenId_fkey" FOREIGN KEY ("apiAccessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_values_history"
  ADD CONSTRAINT "pub_values_history_actionRunId_fkey" FOREIGN KEY ("actionRunId") REFERENCES "action_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE pub_values_history
  ADD CONSTRAINT chk_pub_values_history_crudtype_rowdata CHECK (("operationType" = 'insert' AND "oldRowData" IS NULL AND "newRowData" IS NOT NULL) OR ("operationType" = 'update' AND "oldRowData" IS NOT NULL AND "newRowData" IS NOT NULL) OR ("operationType" = 'delete' AND "oldRowData" IS NOT NULL AND "newRowData" IS NULL));

-- backfill pub_values_history with existing data
-- we just set it to insert the current row data, as we do not know who created it
-- we do not set a perpetrator for the existing data, as it is not possible to know who created it
-- setting a createAt manually is risky, as the base table might not have a createdAt/updateAt column. therefore we set the base case to the current timestamp
INSERT INTO "pub_values_history"("operationType", "oldRowData", "newRowData", "pubValueId")
SELECT
  'insert'::"OperationType",
  NULL,
  row_to_json(t),
  t.id
FROM
  "pub_values" t;

CREATE TRIGGER trigger_pub_values_history
  AFTER INSERT OR UPDATE ON pub_values
  FOR EACH ROW
  EXECUTE FUNCTION f_generic_history('pubValueId');

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20241214173138_add_pub_values_history_history_table to flattened file"

# Migration: 20241214173204_update_comments by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241214173204_update_comments

-- generator-version: 1.0.0

-- Model pub_values_history comments



-- Model users comments



-- Model sessions comments

COMMENT ON COLUMN "sessions"."type" IS 'With what type of token is this session created? Used for determining on a page-by-page basis whether to allow a certain session to access it. For instance, a verify email token/session should not allow you to access the password reset page.';


-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments

COMMENT ON COLUMN "PubFieldSchema"."schema" IS '@type(JSONSchemaType<any>, ''ajv'', true, false, true)';


-- Model pub_values comments

COMMENT ON COLUMN "pub_values"."lastModifiedBy" IS '@type(LastModifiedBy, ''../types'', true, false, true)';


-- Model pub_types comments



-- Model _PubFieldToPubType comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model member_groups comments



-- Model community_memberships comments



-- Model pub_memberships comments



-- Model stage_memberships comments



-- Model form_memberships comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments



-- Model forms comments



-- Model form_elements comments



-- Model api_access_tokens comments



-- Model api_access_logs comments



-- Model api_access_permissions comments

COMMENT ON COLUMN "api_access_permissions"."constraints" IS '@type(ApiAccessPermissionConstraints, ''../types'', true, false, true)';


-- Model membership_capabilities comments



-- Enum AuthTokenType comments

COMMENT ON TYPE "AuthTokenType" IS '@property generic - For most use-cases. This will just authenticate you with a regular session.
@property passwordReset - For resetting your password only
@property signup - For signing up, but also when you''re invited to a community
@property verifyEmail - For verifying your email address';


-- Enum CoreSchemaType comments




-- Enum OperationType comments




-- Enum MemberRole comments




-- Enum Action comments




-- Enum ActionRunStatus comments




-- Enum Event comments




-- Enum FormAccessType comments




-- Enum StructuralFormElement comments




-- Enum ElementType comments




-- Enum InputComponent comments




-- Enum ApiAccessType comments




-- Enum ApiAccessScope comments




-- Enum Capabilities comments




-- Enum MembershipType comments;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20241214173204_update_comments to flattened file"

# Migration: 20241217171434_add_pubid_to_form_memberships by Allison King
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241217171434_add_pubid_to_form_memberships

/*
  Warnings:

  - A unique constraint covering the columns `[formId,userId,pubId]` on the table `form_memberships` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[formId,memberGroupId,pubId]` on the table `form_memberships` will be added. If there are existing duplicate values, this will fail.

*/

BEGIN;

-- AlterTable
ALTER TABLE "form_memberships" ADD COLUMN     "pubId" TEXT;

-- AddForeignKey
ALTER TABLE "form_memberships" ADD CONSTRAINT "form_memberships_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex
DROP INDEX "form_memberships_formId_memberGroupId_key";

-- DropIndex
DROP INDEX "form_memberships_formId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "form_memberships_formId_userId_pubId_key" ON "form_memberships"("formId", "userId", "pubId");

-- CreateIndex
CREATE UNIQUE INDEX "form_memberships_formId_memberGroupId_pubId_key" ON "form_memberships"("formId", "memberGroupId", "pubId");

-- Backfill pubIds for existing form_memberships entries based on action runs
UPDATE form_memberships SET "pubId" = email_invites."pubId"
FROM
(
    SELECT DISTINCT "pubId", community_memberships."userId", 
    forms.id as "formId"
    FROM action_runs 
    INNER JOIN action_instances ON action_runs."actionInstanceId" = action_instances.id 
    INNER JOIN community_memberships ON params->'actionInstanceArgs'->>'recipient' = community_memberships.id
    INNER JOIN pubs ON pubs.id = "pubId"
    INNER JOIN forms ON forms.slug = regexp_replace(
        params->'actionInstanceArgs'->>'body',
        '.*:link\{form="([^"]+)"\}.*',
        '\1'
    ) AND forms."communityId" = pubs."communityId"
    WHERE action='email'
) AS email_invites
WHERE form_memberships."formId" = email_invites."formId"
AND form_memberships."userId" = email_invites."userId";

END;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Allison King" GIT_COMMITTER_EMAIL="aking@knowledgefutures.org" git commit --no-verify --no-gpg-sign --author="Allison King <aking@knowledgefutures.org>" -m "Move migration 20241217171434_add_pubid_to_form_memberships to flattened file"

# Migration: 20241219131700_fix_title_update_trigger by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20241219131700_fix_title_update_trigger

CREATE OR REPLACE FUNCTION update_pub_for_value_changes()
    RETURNS TRIGGER
    AS $$
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS tmp_affected_pubs(
        "pubId" text PRIMARY KEY,
        "value" text
    ) ON COMMIT DROP;
    WITH tf AS (
        SELECT DISTINCT ON (inserted_updated_deleted_rows."pubId")
            inserted_updated_deleted_rows."pubId",
            inserted_updated_deleted_rows."value",
            CASE WHEN inserted_updated_deleted_rows."value" IS NULL THEN
                TRUE
            ELSE
                FALSE
            END AS is_null_value
        FROM
            inserted_updated_deleted_rows
            JOIN "pubs" p ON inserted_updated_deleted_rows."pubId" = p."id"
            JOIN "_PubFieldToPubType" pft ON pft."A" = inserted_updated_deleted_rows."fieldId"
                AND pft."B" = p."pubTypeId"
                AND pft."isTitle" = TRUE
    )
    INSERT INTO tmp_affected_pubs("pubId", "value")
    SELECT DISTINCT
        "pubId",
        CASE WHEN is_null_value THEN
            NULL
        ELSE
            ("value" #>> '{}')
        END
    FROM tf
    -- this is to handle edge cases which mostly happen during "UPDATE"s in transactions
    ON CONFLICT("pubId")
        DO UPDATE SET
            "value" = CASE WHEN EXCLUDED."value" IS NULL THEN
                NULL
            ELSE
                EXCLUDED."value"
            END;


    -- this is to handle the actual update of the title
    -- and to ensure that the updatedAt is updated
    UPDATE
        "pubs"
    SET
        "updatedAt" = CURRENT_TIMESTAMP,
        "title" = CASE 
        -- this is what's changed from the earlier function
        WHEN tmp."pubId" IS NULL THEN
            pubs."title"
        WHEN TG_OP = 'DELETE' OR tmp."value" IS NULL THEN
            NULL
        ELSE
            tmp."value"
        END
    FROM ( SELECT DISTINCT
            "pubId"
        FROM
            inserted_updated_deleted_rows
    ) AS affected
    LEFT JOIN tmp_affected_pubs tmp ON tmp."pubId" = affected."pubId"
    WHERE
        "pubs"."id" = affected."pubId";
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20241219131700_fix_title_update_trigger to flattened file"

# Migration: 20250114185819_rm_integrations by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20250114185819_rm_integrations

/*
  Warnings:

  - You are about to drop the column `integrationId` on the `pub_fields` table. All the data in the column will be lost.
  - You are about to drop the `IntegrationInstanceState` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_IntegrationInstanceToPub` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `integration_instances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `integrations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "IntegrationInstanceState" DROP CONSTRAINT "IntegrationInstanceState_instanceId_fkey";

-- DropForeignKey
ALTER TABLE "IntegrationInstanceState" DROP CONSTRAINT "IntegrationInstanceState_pubId_fkey";

-- DropForeignKey
ALTER TABLE "_IntegrationInstanceToPub" DROP CONSTRAINT "_IntegrationInstanceToPub_A_fkey";

-- DropForeignKey
ALTER TABLE "_IntegrationInstanceToPub" DROP CONSTRAINT "_IntegrationInstanceToPub_B_fkey";

-- DropForeignKey
ALTER TABLE "integration_instances" DROP CONSTRAINT "integration_instances_communityId_fkey";

-- DropForeignKey
ALTER TABLE "integration_instances" DROP CONSTRAINT "integration_instances_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "integration_instances" DROP CONSTRAINT "integration_instances_stageId_fkey";

-- DropForeignKey
ALTER TABLE "pub_fields" DROP CONSTRAINT "pub_fields_integrationId_fkey";

-- AlterTable
ALTER TABLE "pub_fields" DROP COLUMN "integrationId";

-- DropTable
DROP TABLE "IntegrationInstanceState";

-- DropTable
DROP TABLE "_IntegrationInstanceToPub";

-- DropTable
DROP TABLE "integration_instances";

-- DropTable
DROP TABLE "integrations";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20250114185819_rm_integrations to flattened file"

# Migration: 20250114190224_update_comments by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20250114190224_update_comments

-- generator-version: 1.0.0

-- Model pub_values_history comments



-- Model users comments



-- Model sessions comments

COMMENT ON COLUMN "sessions"."type" IS 'With what type of token is this session created? Used for determining on a page-by-page basis whether to allow a certain session to access it. For instance, a verify email token/session should not allow you to access the password reset page.';


-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments

COMMENT ON COLUMN "PubFieldSchema"."schema" IS '@type(JSONSchemaType<any>, ''ajv'', true, false, true)';


-- Model pub_values comments

COMMENT ON COLUMN "pub_values"."lastModifiedBy" IS '@type(LastModifiedBy, ''../types'', true, false, true)';


-- Model pub_types comments



-- Model _PubFieldToPubType comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model member_groups comments



-- Model community_memberships comments



-- Model pub_memberships comments



-- Model stage_memberships comments



-- Model form_memberships comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments



-- Model forms comments



-- Model form_elements comments



-- Model api_access_tokens comments



-- Model api_access_logs comments



-- Model api_access_permissions comments

COMMENT ON COLUMN "api_access_permissions"."constraints" IS '@type(ApiAccessPermissionConstraints, ''../types'', true, false, true)';


-- Model membership_capabilities comments



-- Enum AuthTokenType comments

COMMENT ON TYPE "AuthTokenType" IS '@property generic - For most use-cases. This will just authenticate you with a regular session.
@property passwordReset - For resetting your password only
@property signup - For signing up, but also when you''re invited to a community
@property verifyEmail - For verifying your email address';


-- Enum CoreSchemaType comments




-- Enum OperationType comments




-- Enum MemberRole comments




-- Enum Action comments




-- Enum ActionRunStatus comments




-- Enum Event comments




-- Enum FormAccessType comments




-- Enum StructuralFormElement comments




-- Enum ElementType comments




-- Enum InputComponent comments




-- Enum ApiAccessType comments




-- Enum ApiAccessScope comments




-- Enum Capabilities comments




-- Enum MembershipType comments;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20250114190224_update_comments to flattened file"

# Migration: 20250114195812_add_relation_block_input_component by Allison King
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20250114195812_add_relation_block_input_component

-- AlterEnum
ALTER TYPE "InputComponent" ADD VALUE 'relationBlock';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Allison King" GIT_COMMITTER_EMAIL="aking@knowledgefutures.org" git commit --no-verify --no-gpg-sign --author="Allison King <aking@knowledgefutures.org>" -m "Move migration 20250114195812_add_relation_block_input_component to flattened file"

# Migration: 20250130165541_add_ts_vector_to_pub_values by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20250130165541_add_ts_vector_to_pub_values

-- Create the search vector column
ALTER TABLE "pubs" ADD COLUMN "searchVector" tsvector;

-- CreateIndex
CREATE INDEX "pubs_searchVector_idx" ON "pubs" USING GIN ("searchVector");


-- update existing trigger defined in amongst other 20241219131700_fix_title_update_trigger/migration.sql
CREATE OR REPLACE FUNCTION update_pub_for_value_changes()
    RETURNS TRIGGER
    AS $$
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS tmp_affected_pubs(
        "pubId" text PRIMARY KEY,
        "value" text
    ) ON COMMIT DROP;
    WITH tf AS (
        SELECT DISTINCT ON (inserted_updated_deleted_rows."pubId")
            inserted_updated_deleted_rows."pubId",
            inserted_updated_deleted_rows."value",
            CASE WHEN inserted_updated_deleted_rows."value" IS NULL THEN
                TRUE
            ELSE
                FALSE
            END AS is_null_value
        FROM
            inserted_updated_deleted_rows
            JOIN "pubs" p ON inserted_updated_deleted_rows."pubId" = p."id"
            JOIN "_PubFieldToPubType" pft ON pft."A" = inserted_updated_deleted_rows."fieldId"
                AND pft."B" = p."pubTypeId"
                AND pft."isTitle" = TRUE
    )
    INSERT INTO tmp_affected_pubs("pubId", "value")
    SELECT DISTINCT
        "pubId",
        CASE WHEN is_null_value THEN
            NULL
        ELSE
            ("value" #>> '{}')
        END
    FROM tf
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
    WITH updates AS (
        SELECT 
            affected."pubId",
            CASE 
                WHEN tmp."pubId" IS NULL THEN pubs."title"
                WHEN TG_OP = 'DELETE' OR tmp."value" IS NULL THEN NULL
                ELSE tmp."value"
            END AS new_title
        FROM (
            SELECT DISTINCT "pubId"
            FROM inserted_updated_deleted_rows
        ) AS affected
        LEFT JOIN tmp_affected_pubs tmp ON tmp."pubId" = affected."pubId"
        JOIN pubs ON pubs.id = affected."pubId"
    )
    UPDATE "pubs"
    SET
        "updatedAt" = CURRENT_TIMESTAMP,
        "title" = updates.new_title,
        -- we weight the searchVector based on the title and its values
        "searchVector" = (
            SELECT 
                setweight(to_tsvector('english', COALESCE(updates.new_title, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(
                    (SELECT string_agg(CAST(value #>> '{}' AS TEXT), ' ')
                    FROM pub_values
                    WHERE "pubId" = updates."pubId"), 
                '')), 'B')
        )
    FROM updates
    WHERE "pubs"."id" = updates."pubId";

    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

-- Update existing data
UPDATE pubs
SET "searchVector" = (
  SELECT setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
         setweight(to_tsvector('english', COALESCE(
           (SELECT string_agg(CAST(value->>'value' AS TEXT), ' ')
            FROM pub_values
            WHERE "pubId" = pubs.id), ''
         )), 'B')
);

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20250130165541_add_ts_vector_to_pub_values to flattened file"

# Migration: 20250203230851_add_updated_at_to_everything by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20250203230851_add_updated_at_to_everything

-- AlterTable
ALTER TABLE "PubsInStages" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "_PubFieldToPubType" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "api_access_permissions" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "api_access_tokens" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "auth_tokens" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "form_elements" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "rules" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20250203230851_add_updated_at_to_everything to flattened file"

# Migration: 20250205172301_stage_updated_at_trigger by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20250205172301_stage_updated_at_trigger

CREATE OR REPLACE FUNCTION update_pub_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "pubs"
    -- it's fine to use CURRENT_TIMESTAMP here because we're inside a transaction
    -- and the timestamp will be the same for all rows in the transaction
    SET "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = CASE
        WHEN TG_OP = 'DELETE' THEN OLD."pubId"
        ELSE NEW."pubId"
    END;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pubs_in_stages_update_pub
    AFTER INSERT OR UPDATE OR DELETE ON "PubsInStages"
    FOR EACH ROW
    EXECUTE FUNCTION update_pub_updated_at();

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20250205172301_stage_updated_at_trigger to flattened file"

# Migration: 20250213201642_add_mudder_ranks by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20250213201642_add_mudder_ranks

BEGIN;
  CREATE TEMP TABLE "mudder_ranks" (
    index SERIAL PRIMARY KEY,
    rank TEXT
  );
  /*
   * This temp table holds 200 mudder generated keys which we use to assign initial ranks to existing
   * form elements and related pubs in the migration.
   * Generated with: mudder.base62.mudder(200).map((rank) => `('${rank}')`).join(", ")
   */

  INSERT INTO "mudder_ranks"("index","rank") VALUES (0,'0J');
  INSERT INTO "mudder_ranks"("rank")
  VALUES ('0c'), ('0v'), ('1'), ('1X'), ('1q'), ('2'), ('2S'), ('2m'), ('3'), ('3O'), ('3h'),
  ('4'), ('4J'), ('4c'), ('4v'), ('5'), ('5Y'), ('5r'), ('6'), ('6T'), ('6m'), ('7'), ('7O'), ('7i'),
  ('8'), ('8K'), ('8d'), ('8w'), ('9'), ('9Y'), ('9r'), ('A'), ('AU'), ('An'), ('B'), ('BP'), ('Bi'),
  ('C'), ('CK'), ('Ce'), ('Cx'), ('D'), ('DZ'), ('Ds'), ('E'), ('EU'), ('En'), ('F'), ('FQ'), ('Fj'),
  ('G'), ('GL'), ('Ge'), ('Gx'), ('H'), ('Ha'), ('Ht'), ('I'), ('IV'), ('Io'), ('J'), ('JQ'), ('Jj'),
  ('K'), ('KM'), ('Kf'), ('Ky'), ('L'), ('La'), ('Lt'), ('M'), ('MW'), ('Mp'), ('N'), ('NR'), ('Nk'),
  ('O'), ('OM'), ('Of'), ('Oz'), ('P'), ('Pb'), ('Pu'), ('Q'), ('QW'), ('Qp'), ('R'), ('RS'), ('Rl'),
  ('S'), ('SN'), ('Sg'), ('Sz'), ('T'), ('Tb'), ('Tv'), ('U'), ('UX'), ('Uq'), ('V'), ('VS'), ('Vl'),
  ('W'), ('WO'), ('Wh'), ('X'), ('XJ'), ('Xc'), ('Xv'), ('Y'), ('YX'), ('Yr'), ('Z'), ('ZT'), ('Zm'),
  ('a'), ('aO'), ('ah'), ('b'), ('bK'), ('bd'), ('bw'), ('c'), ('cY'), ('cr'), ('d'), ('dT'), ('dn'),
  ('e'), ('eP'), ('ei'), ('f'), ('fK'), ('fd'), ('fw'), ('g'), ('gZ'), ('gs'), ('h'), ('hU'), ('hn'),
  ('i'), ('iP'), ('ij'), ('j'), ('jL'), ('je'), ('jx'), ('k'), ('kZ'), ('ks'), ('l'), ('lV'), ('lo'),
  ('m'), ('mQ'), ('mj'), ('n'), ('nL'), ('nf'), ('ny'), ('o'), ('oa'), ('ot'), ('p'), ('pV'), ('po'),
  ('q'), ('qR'), ('qk'), ('r'), ('rM'), ('rf'), ('ry'), ('s'), ('sb'), ('su'), ('t'), ('tW'), ('tp'),
  ('u'), ('uR'), ('uk'), ('v'), ('vN'), ('vg'), ('vz'), ('w'), ('wb'), ('wu'), ('x'), ('xX'), ('xq'),
  ('y'), ('yS'), ('yl'), ('z'), ('zN'), ('zg');

  -- Add rank to form_elements
  -- Uses "C" collation order to ensure uppercase letters sort before lowercase to match mudder
  ALTER TABLE "form_elements" ADD COLUMN "rank" TEXT COLLATE "C";

  -- Set initial rank values for form elements based on 'order'
  UPDATE "form_elements"
  SET "rank" = "mudder_ranks"."rank"
  FROM "mudder_ranks"
  WHERE 
    "form_elements"."order" IS NOT NULL 
    AND "form_elements"."order" = "mudder_ranks"."index";

  -- Set a rank for submit buttons which were previously unordered, near the end (zzzz...)
  WITH "buttons" AS (
    -- Assign a somewhat arbitrary numeric order to the buttons
    -- Since some have order = null, the non-null ordered ones will come first
    SELECT "id", "formId", ROW_NUMBER() OVER (PARTITION BY "formId" ORDER BY "order") AS "index"
    FROM "form_elements"
    WHERE "form_elements"."type" = 'button'::"ElementType"
  )
  UPDATE "form_elements"
  SET "rank" = REPEAT('z'::text, "buttons"."index"::int + 10)
  FROM "buttons"
  WHERE "form_elements"."type" = 'button'::"ElementType"
    AND "form_elements"."id" = "buttons"."id";

  -- Now that there are ranks for all elements, add a not null constraint
  ALTER TABLE "form_elements" ALTER COLUMN "rank" SET NOT NULL;

-- Add rank to pub_values
-- This one is nullable for now
  ALTER TABLE "pub_values" ADD COLUMN "rank" TEXT COLLATE "C";

-- Get all pub_values with multiple related pubs, then assign initial ranks ordered by updatedAt
  WITH "related_pubs" AS (
    SELECT "pubId", "fieldId"
    FROM "pub_values"
    WHERE "relatedPubId" IS NOT NULL
    GROUP BY "pubId", "fieldId"
    HAVING COUNT("pubId") > 1
  ),
  "row_numbers" AS (
    SELECT 
      "pub_values"."id", 
      ROW_NUMBER() OVER (
        PARTITION BY "pub_values"."pubId", "pub_values"."fieldId" 
        ORDER BY "pub_values"."updatedAt"
      ) as "r"
    FROM "pub_values"
    JOIN "related_pubs" ON 
      "related_pubs"."pubId" = "pub_values"."pubId" 
      AND "related_pubs"."fieldId" = "pub_values"."fieldId"
  )
  UPDATE "pub_values" 
  SET 
    "rank" = "mudder_ranks"."rank", 
    "lastModifiedBy" = 'system|' || FLOOR(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)
  FROM "mudder_ranks", "row_numbers"
  WHERE 
    "mudder_ranks"."index" = "row_numbers"."r"
    AND "row_numbers"."id" = "pub_values"."id";
COMMIT;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20250213201642_add_mudder_ranks to flattened file"

# Migration: 20250227001152_let_community_editors_invite_users by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20250227001152_let_community_editors_invite_users

INSERT INTO
    "membership_capabilities"
VALUES
    (
        'editor'::"MemberRole",
        'community'::"MembershipType",
        'addCommunityMember'::"Capabilities"
    );

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20250227001152_let_community_editors_invite_users to flattened file"

# Migration: 20250304132049_add_action_success_events by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20250304132049_add_action_success_events

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Event" ADD VALUE 'actionSucceeded';
ALTER TYPE "Event" ADD VALUE 'actionFailed';

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20250304132049_add_action_success_events to flattened file"

# Migration: 20250305135055_add_action_ref_to_rul by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20250305135055_add_action_ref_to_rul

-- AlterTable
ALTER TABLE "rules" ADD COLUMN     "sourceActionInstanceId" TEXT;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_sourceActionInstanceId_fkey" FOREIGN KEY ("sourceActionInstanceId") REFERENCES "action_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX "rules_actionInstanceId_event_key";

-- unique index for action chaining events
CREATE UNIQUE INDEX "unique_action_chaining_events" ON "rules" ("actionInstanceId", "event", "sourceActionInstanceId") WHERE "sourceActionInstanceId" IS NOT NULL;

-- unique index for regular events
CREATE UNIQUE INDEX "unique_regular_events" ON "rules" ("actionInstanceId", "event") WHERE "sourceActionInstanceId" IS NULL;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20250305135055_add_action_ref_to_rul to flattened file"

# Migration: 20250306165526_log_triggering_action_run by Thomas F. K. Jorna
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20250306165526_log_triggering_action_run

-- AlterTable
ALTER TABLE "action_runs" ADD COLUMN     "sourceActionRunId" TEXT;

-- AddForeignKey
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_sourceActionRunId_fkey" FOREIGN KEY ("sourceActionRunId") REFERENCES "action_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Thomas F. K. Jorna" GIT_COMMITTER_EMAIL="hello@tefkah.com" git commit --no-verify --no-gpg-sign --author="Thomas F. K. Jorna <hello@tefkah.com>" -m "Move migration 20250306165526_log_triggering_action_run to flattened file"

# Migration: 20250306184110_remove_parent_id by Eric McDaniel
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20250306184110_remove_parent_id

/*
  Warnings:

  - You are about to drop the column `parentId` on the `pubs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "pubs" DROP CONSTRAINT "pubs_parentId_fkey";

-- AlterTable
ALTER TABLE "pubs" DROP COLUMN "parentId";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Eric McDaniel" GIT_COMMITTER_EMAIL="eric.g.mcdaniel@gmail.com" git commit --no-verify --no-gpg-sign --author="Eric McDaniel <eric.g.mcdaniel@gmail.com>" -m "Move migration 20250306184110_remove_parent_id to flattened file"

# Migration: 20250319022702_remove_order by Kalil Smith-Nuevelle
cat >> drizzle/migrations/0000_init.sql << 'EOF'
-- migration: 20250319022702_remove_order

/*
  Warnings:

  - You are about to drop the column `order` on the `form_elements` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "form_elements" DROP COLUMN "order";

EOF

git add drizzle/migrations/0000_init.sql
GIT_COMMITTER_NAME="Kalil Smith-Nuevelle" GIT_COMMITTER_EMAIL="kalilsn@gmail.com" git commit --no-verify --no-gpg-sign --author="Kalil Smith-Nuevelle <kalilsn@gmail.com>" -m "Move migration 20250319022702_remove_order to flattened file"

