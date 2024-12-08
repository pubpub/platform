-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE OR REPLACE FUNCTION update_form_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "forms"
    SET "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = CASE
        WHEN TG_OP = 'DELETE' THEN OLD."formId"
        ELSE NEW."formId"
    END;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_form_elements_update_form
    AFTER INSERT OR UPDATE OR DELETE ON "form_elements"
    FOR EACH ROW
    EXECUTE FUNCTION update_form_updated_at();