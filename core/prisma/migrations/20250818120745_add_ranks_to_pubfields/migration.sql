/*
 Warnings:

 - Added the required column `rank` to the `_PubFieldToPubType` table without a default value. This is not possible if the table is not empty.
 */
-- AlterTable
-- BEGIN;
ALTER TABLE "_PubFieldToPubType"
  ADD COLUMN "rank" text COLLATE "C";

CREATE TEMP TABLE IF NOT EXISTS "mudder_ranks"(
  index SERIAL PRIMARY KEY,
  rank text
);


-- when running `prisma reset`, the previous values are still there
-- but when running `prisma migrate dev`, the previous values are not there
TRUNCATE TABLE "mudder_ranks";

-- /*
--  * This temp table holds 200 mudder generated keys which we use to assign initial ranks to existing
--  * form elements and related pubs in the migration.
--  * Generated with: mudder.base62.mudder(200).map((rank) => `('${rank}')`).join(", ")
--  */
INSERT INTO "mudder_ranks"("index", "rank")
  VALUES (0, '0J');
INSERT INTO "mudder_ranks"("rank")
  VALUES ('0c'), ('0v'), ('1'), ('1X'), ('1q'), ('2'), ('2S'), ('2m'), ('3'), ('3O'), ('3h'), ('4'), ('4J'), ('4c'), ('4v'), ('5'), ('5Y'), ('5r'), ('6'), ('6T'), ('6m'), ('7'), ('7O'), ('7i'), ('8'), ('8K'), ('8d'), ('8w'), ('9'), ('9Y'), ('9r'), ('A'), ('AU'), ('An'), ('B'), ('BP'), ('Bi'), ('C'), ('CK'), ('Ce'), ('Cx'), ('D'), ('DZ'), ('Ds'), ('E'), ('EU'), ('En'), ('F'), ('FQ'), ('Fj'), ('G'), ('GL'), ('Ge'), ('Gx'), ('H'), ('Ha'), ('Ht'), ('I'), ('IV'), ('Io'), ('J'), ('JQ'), ('Jj'), ('K'), ('KM'), ('Kf'), ('Ky'), ('L'), ('La'), ('Lt'), ('M'), ('MW'), ('Mp'), ('N'), ('NR'), ('Nk'), ('O'), ('OM'), ('Of'), ('Oz'), ('P'), ('Pb'), ('Pu'), ('Q'), ('QW'), ('Qp'), ('R'), ('RS'), ('Rl'), ('S'), ('SN'), ('Sg'), ('Sz'), ('T'), ('Tb'), ('Tv'), ('U'), ('UX'), ('Uq'), ('V'), ('VS'), ('Vl'), ('W'), ('WO'), ('Wh'), ('X'), ('XJ'), ('Xc'), ('Xv'), ('Y'), ('YX'), ('Yr'), ('Z'), ('ZT'), ('Zm'), ('a'), ('aO'), ('ah'), ('b'), ('bK'), ('bd'), ('bw'), ('c'), ('cY'), ('cr'), ('d'), ('dT'), ('dn'), ('e'), ('eP'), ('ei'), ('f'), ('fK'), ('fd'), ('fw'), ('g'), ('gZ'), ('gs'), ('h'), ('hU'), ('hn'), ('i'), ('iP'), ('ij'), ('j'), ('jL'), ('je'), ('jx'), ('k'), ('kZ'), ('ks'), ('l'), ('lV'), ('lo'), ('m'), ('mQ'), ('mj'), ('n'), ('nL'), ('nf'), ('ny'), ('o'), ('oa'), ('ot'), ('p'), ('pV'), ('po'), ('q'), ('qR'), ('qk'), ('r'), ('rM'), ('rf'), ('ry'), ('s'), ('sb'), ('su'), ('t'), ('tW'), ('tp'), ('u'), ('uR'), ('uk'), ('v'), ('vN'), ('vg'), ('vz'), ('w'), ('wb'), ('wu'), ('x'), ('xX'), ('xq'), ('y'), ('yS'), ('yl'), ('z'), ('zN'), ('zg');

-- Fields with isTitle=true get rank 0, others follow in order
UPDATE
  "_PubFieldToPubType"
SET
  "rank" = "mudder_ranks"."rank"
FROM (
  SELECT
    "A",
    "B",
    ROW_NUMBER() OVER (PARTITION BY "B" ORDER BY CASE WHEN "isTitle" = TRUE THEN
        0
      ELSE
        1
      END) - 1 AS row_index
  FROM
    "_PubFieldToPubType") ranked_fields
  JOIN "mudder_ranks" ON "mudder_ranks"."index" = ranked_fields.row_index
WHERE
  "_PubFieldToPubType"."A" = ranked_fields."A"
  AND "_PubFieldToPubType"."B" = ranked_fields."B";


-- set rank to not null
ALTER TABLE "_PubFieldToPubType"
  ALTER COLUMN "rank" SET NOT NULL;