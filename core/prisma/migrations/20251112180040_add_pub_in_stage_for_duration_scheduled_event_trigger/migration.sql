-- Create the new function
CREATE OR REPLACE FUNCTION emit_event()
    RETURNS TRIGGER
    AS $$
DECLARE
    community RECORD;
BEGIN
    -- Determine the community from the Pubs or Stages table
    IF TG_OP = 'INSERT' THEN
        SELECT
            c.id,
            c.slug INTO community
        FROM
            pubs p
            JOIN communities c ON p."communityId" = c.id
        WHERE
            p.id = NEW."pubId";
    ELSIF TG_OP = 'DELETE' THEN
        SELECT
            c.id,
            c.slug INTO community
        FROM
            pubs p
            JOIN communities c ON p."communityId" = c.id
        WHERE
            p.id = OLD."pubId";
    END IF;
    PERFORM
        graphile_worker.add_job('emitEvent', json_build_object('table', TG_TABLE_NAME, 'operation', TG_OP, 'new', NEW, 'old', OLD, 'community', community));
    RETURN NEW;
END;
$$
LANGUAGE plpgsql
VOLATILE;

