-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "title" TEXT;

-- defined in core/prisma/migrations/20241126113759_add_pub_values_updated_at_trigger/migration.sql
-- we are replacing it with a more complex function that also updates the title
DROP TRIGGER IF EXISTS trigger_pub_values_update_pub ON "pub_values";
DROP FUNCTION IF EXISTS update_pub_updated_at();

CREATE OR REPLACE FUNCTION update_pub_for_value_changes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "pubs"
    SET "updatedAt" = CURRENT_TIMESTAMP,
        -- set title if this field is marked as the title field for this pub's type
        "title" = CASE 
            WHEN EXISTS (
                SELECT 1 FROM "_PubFieldToPubType" pft
                JOIN "pubs" p ON p.id = COALESCE(NEW."pubId", OLD."pubId")
                -- theoretically this should never happen
                -- as values should never change which field they are associated with
                -- but good to have the fallback
                WHERE pft."A" = COALESCE(NEW."fieldId", OLD."fieldId")
                AND pft."B" = p."pubTypeId"
                AND pft."isTitle" = true
            )
            THEN CASE
                WHEN TG_OP IN ('INSERT', 'UPDATE') THEN 
                    CAST(NEW."value"->>'value' AS TEXT)
                -- for DELETE, set to NULL
                ELSE NULL
            END
            ELSE "title"
        END
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
    EXECUTE FUNCTION update_pub_for_value_changes();