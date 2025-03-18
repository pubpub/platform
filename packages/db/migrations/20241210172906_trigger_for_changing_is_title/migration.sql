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






