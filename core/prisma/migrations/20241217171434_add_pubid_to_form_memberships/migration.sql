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
