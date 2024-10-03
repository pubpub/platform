/*
  Warnings:

  - You are about to drop the column `label` on the `form_elements` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pubId,relatedPubId,fieldId]` on the table `pub_values` will be added. If there are existing duplicate values, this will fail.

*/

-- Move existing labels into the config object
UPDATE "form_elements" 
  SET config = jsonb_build_object('label', "form_elements"."label") 
  WHERE component != 'checkbox'::"InputComponent" AND type = 'pubfield'::"ElementType";
UPDATE "form_elements" 
  SET config = jsonb_build_object('groupLabel', "form_elements"."label")
  WHERE component = 'checkbox'::"InputComponent" AND type = 'pubfield'::"ElementType";
