DROP INDEX "api_access_tokens_token_key";--> statement-breakpoint
DROP INDEX "communities_slug_key";--> statement-breakpoint
DROP INDEX "pub_fields_slug_key";--> statement-breakpoint
DROP INDEX "users_email_key";--> statement-breakpoint
DROP INDEX "users_slug_key";--> statement-breakpoint
ALTER TABLE "api_access_tokens" ADD CONSTRAINT "api_access_tokens_token_key" UNIQUE("token");--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_slug_key" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "pub_fields" ADD CONSTRAINT "pub_fields_slug_key" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_slug_key" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE("email");



-- AUTOMATICALLY GENERATED PROCEDURES AND TRIGGERS

-- PROCEDURES

CREATE OR REPLACE FUNCTION 
"emit_event"() 
RETURNS TRIGGER 
LANGUAGE plpgsql VOLATILE
AS $BODY$

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
$BODY$;

CREATE OR REPLACE FUNCTION 
"f_generic_history"() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $BODY$

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
$BODY$;

CREATE OR REPLACE FUNCTION 
"get_publication_by_id"(pub_id TEXT) 
RETURNS TABLE(id TEXT, title TEXT, created_at TIMESTAMP) 
LANGUAGE sql
AS $BODY$

    SELECT id, title, "createdAt" as created_at
    FROM pubs
    WHERE id = pub_id
  
$BODY$;

CREATE OR REPLACE FUNCTION 
"update_pub_everything"() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $BODY$

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
$BODY$;

CREATE OR REPLACE FUNCTION 
"update_pub_title_for_pub_type"() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $BODY$

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
$BODY$;


-- TRIGGERS

CREATE OR REPLACE TRIGGER "trigger_create_pub_values_update_pub"
AFTER INSERT
ON "public"."pub_values"
REFERENCING  NEW TABLE AS inserted_updated_deleted_rows
FOR EACH STATEMENT
EXECUTE FUNCTION update_pub_everything();

CREATE OR REPLACE TRIGGER "trigger_delete_pub_values_update_pub"
AFTER DELETE
ON "public"."pub_values"
REFERENCING OLD TABLE AS inserted_updated_deleted_rows 
FOR EACH STATEMENT
EXECUTE FUNCTION update_pub_everything();

CREATE OR REPLACE TRIGGER "trigger_pub_field_to_pub_type_delete_pub_title"
AFTER DELETE
ON "public"."_PubFieldToPubType"
FOR EACH ROW
WHEN (OLD."isTitle" IS TRUE)
EXECUTE FUNCTION update_pub_title_for_pub_type();

CREATE OR REPLACE TRIGGER "trigger_pub_field_to_pub_type_insert_pub_title"
AFTER INSERT
ON "public"."_PubFieldToPubType"
FOR EACH ROW
WHEN (NEW."isTitle" IS TRUE)
EXECUTE FUNCTION update_pub_title_for_pub_type();

CREATE OR REPLACE TRIGGER "trigger_update_pub_values_update_pub"
AFTER UPDATE
ON "public"."pub_values"
REFERENCING  NEW TABLE AS inserted_updated_deleted_rows
FOR EACH STATEMENT
EXECUTE FUNCTION update_pub_everything();

CREATE OR REPLACE TRIGGER "trigger_pub_field_to_pub_type_update_pub_title"
AFTER UPDATE
ON "public"."_PubFieldToPubType"
FOR EACH ROW
WHEN (NEW."isTitle" IS DISTINCT FROM OLD."isTitle")
EXECUTE FUNCTION update_pub_title_for_pub_type();
