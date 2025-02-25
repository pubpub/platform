BEGIN;
  ALTER TABLE "form_elements" ADD COLUMN "rank" TEXT;

  /* Convert numeric order to alphanumeric (base62) string
   *
   * These values are the first 100 of a 1000 item division of the 0-z space, generated with mudder:
   * mudder.base62.mudder('','', 100, undefined, 1000).map((rank, index) => `(${index}, '${rank}')`).join(", ")
   * 
   * We intentionally generate ranks closer to the beginning of the space because new form elements
   * are always added to the end.
   */
  WITH "mudder_ranks" AS (
    SELECT "m".* FROM (
      VALUES (0, '03'), (1, '07'), (2, '0B'), (3, '0F'), (4, '0J'), (5, '0N'), (6, '0Q'), (7, '0U'), (8, '0Y'),
      (9, '0c'), (10, '0g'), (11, '0k'), (12, '0n'), (13, '0r'), (14, '0v'), (15, '0z'), (16, '1'), (17, '17'),
      (18, '1B'), (19, '1E'), (20, '1I'), (21, '1M'), (22, '1Q'), (23, '1U'), (24, '1Y'), (25, '1b'), (26, '1f'),
      (27, '1j'), (28, '1n'), (29, '1r'), (30, '1v'), (31, '1z'), (32, '2'), (33, '26'), (34, '2A'), (35, '2E'),
      (36, '2I'), (37, '2M'), (38, '2P'), (39, '2T'), (40, '2X'), (41, '2b'), (42, '2f'), (43, '2j'), (44, '2m'),
      (45, '2q'), (46, '2u'), (47, '2y'), (48, '3'), (49, '36'), (50, '3A'), (51, '3D'), (52, '3H'), (53, '3L'),
      (54, '3P'), (55, '3T'), (56, '3X'), (57, '3a'), (58, '3e'), (59, '3i'), (60, '3m'), (61, '3q'), (62, '3u'),
      (63, '3y'), (64, '4'), (65, '45'), (66, '49'), (67, '4D'), (68, '4H'), (69, '4L'), (70, '4O'), (71, '4S'),
      (72, '4W'), (73, '4a'), (74, '4e'), (75, '4i'), (76, '4l'), (77, '4p'), (78, '4t'), (79, '4x'), (80, '5'),
      (81, '55'), (82, '59'), (83, '5C'), (84, '5G'), (85, '5K'), (86, '5O'), (87, '5S'), (88, '5W'), (89, '5Z'),
      (90, '5d'), (91, '5h'), (92, '5l'), (93, '5p'), (94, '5t'), (95, '5x'), (96, '6'), (97, '64'), (98, '68'),
      (99, '6C')
    ) AS "m"("index", "rank")
  )
  UPDATE "form_elements"
  SET "rank" = "mudder_ranks"."rank"
  FROM "mudder_ranks"
  WHERE 
    "form_elements"."order" IS NOT NULL 
    AND "form_elements"."order" = "mudder_ranks"."index";

  -- Set a rank for submit buttons, all the way at the end (z, zz, zzz etc.)
  WITH "buttons" AS (
    -- Assign a somewhat arbitrary numeric order to the buttons
    -- Since some have order = null, the non-null ordered ones will come first
    SELECT "id", "formId", ROW_NUMBER() OVER (PARTITION BY "formId" ORDER BY "order") AS "rank"
    FROM "form_elements"
    WHERE "form_elements"."type" = 'button'::"ElementType"
  )
  UPDATE "form_elements"
  SET "rank" = REPEAT('z'::text, "buttons"."rank"::int)
  FROM "buttons"
  WHERE "form_elements"."type" = 'button'::"ElementType"
    AND "form_elements"."id" = "buttons"."id";

  ALTER TABLE "form_elements" ALTER COLUMN "rank" SET NOT NULL;

COMMIT;