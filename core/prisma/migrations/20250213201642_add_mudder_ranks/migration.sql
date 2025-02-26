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
  INSERT INTO "mudder_ranks"("rank")
  VALUES ('0J'), ('0c'), ('0v'), ('1'), ('1X'), ('1q'), ('2'), ('2S'), ('2m'), ('3'), ('3O'), ('3h'),
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