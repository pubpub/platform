-- Populate stageId column from PubsInStages table
UPDATE "pubs" SET "stageId" = "PubsInStages"."stageId" FROM "PubsInStages" WHERE "PubsInStages"."pubId" = "pubs"."id";

-- Remove trigger that updates pubs.updatedAt when a pub's stage is changed (this is handled by kysely updatedAt plugin now)
DROP TRIGGER IF EXISTS "trigger_pubs_in_stages_update_pub" ON "PubsInStages";

-- Update emitEvent trigger to work on pubs table
CREATE OR REPLACE FUNCTION emit_event()
    RETURNS TRIGGER AS 
$$
DECLARE
    community RECORD;
BEGIN
    -- Determine the community
    SELECT c.id, c.slug INTO community
    FROM communities c 
    WHERE c.id = NEW."communityId";

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

DROP TRIGGER IF EXISTS pub_moved ON "PubsInStages";
CREATE OR REPLACE TRIGGER pub_moved
    AFTER INSERT OR UPDATE ON "pubs"
    FOR EACH ROW
    EXECUTE FUNCTION emit_event();

/*
  Warnings:

  - You are about to drop the `PubsInStages` table. If the table is not empty, all the data it contains will be lost.

*/

-- DropForeignKey
ALTER TABLE "PubsInStages" DROP CONSTRAINT "PubsInStages_pubId_fkey";

-- DropForeignKey
ALTER TABLE "PubsInStages" DROP CONSTRAINT "PubsInStages_stageId_fkey";

-- DropTable
DROP TABLE "PubsInStages";
