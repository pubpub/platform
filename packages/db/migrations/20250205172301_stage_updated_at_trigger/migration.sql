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