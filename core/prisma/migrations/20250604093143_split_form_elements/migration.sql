CREATE TABLE "form_inputs"(
    "id" text NOT NULL DEFAULT gen_random_uuid(),
    "fieldId" text,
    "formId" text NOT NULL,
    "rank" text NOT NULL COLLATE "C",
    "component" "InputComponent" NOT NULL,
    "config" jsonb,
    "required" boolean,
    "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "form_inputs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_structural_elements"(
    "id" text NOT NULL DEFAULT gen_random_uuid(),
    "formId" text NOT NULL,
    "rank" text NOT NULL COLLATE "C",
    "element" "StructuralFormElement" NOT NULL,
    "content" text,
    "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "form_structural_elements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_buttons"(
    "id" text NOT NULL DEFAULT gen_random_uuid(),
    "formId" text NOT NULL,
    "rank" text NOT NULL COLLATE "C",
    "label" text,
    "content" text,
    "stageId" text,
    "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "form_buttons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_FormInputToPubType"(
    "A" text NOT NULL,
    "B" text NOT NULL
);

-- Step 2: Migrate data from form_elements to appropriate tables
-- Migrate pubfield elements to form_inputs
INSERT INTO "form_inputs"("id", "fieldId", "formId", "rank", "component", "config", "required", "createdAt", "updatedAt")
SELECT
    "id",
    "fieldId",
    "formId",
    "rank",
    "component",
    "config",
    "required",
    "createdAt",
    "updatedAt"
FROM
    "form_elements"
WHERE
    "type" = 'pubfield';

-- Migrate structural elements to form_structural_elements
INSERT INTO "form_structural_elements"("id", "formId", "rank", "element", "content", "createdAt", "updatedAt")
SELECT
    "id",
    "formId",
    "rank",
    "element",
    "content",
    "createdAt",
    "updatedAt"
FROM
    "form_elements"
WHERE
    "type" = 'structural';

-- Migrate button elements to form_buttons
INSERT INTO "form_buttons"("id", "formId", "rank", "label", "content", "stageId", "createdAt", "updatedAt")
SELECT
    "id",
    "formId",
    "rank",
    "label",
    "content",
    "stageId",
    "createdAt",
    "updatedAt"
FROM
    "form_elements"
WHERE
    "type" = 'button';

-- Migrate many-to-many relationships for form inputs
INSERT INTO "_FormInputToPubType"("A", "B")
SELECT
    "A",
    "B"
FROM
    "_FormElementToPubType" fe_pt
    JOIN "form_elements" fe ON fe.id = fe_pt."A"
WHERE
    fe."type" = 'pubfield';

-- Step 3: Create indexes and constraints
CREATE UNIQUE INDEX "form_inputs_fieldId_formId_key" ON "form_inputs"("fieldId", "formId");

CREATE UNIQUE INDEX "form_buttons_label_formId_key" ON "form_buttons"("label", "formId");

CREATE UNIQUE INDEX "_FormInputToPubType_AB_unique" ON "_FormInputToPubType"("A", "B");

CREATE INDEX "_FormInputToPubType_B_index" ON "_FormInputToPubType"("B");

-- Step 4: Add foreign key constraints
ALTER TABLE "form_inputs"
    ADD CONSTRAINT "form_inputs_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "pub_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_inputs"
    ADD CONSTRAINT "form_inputs_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_structural_elements"
    ADD CONSTRAINT "form_structural_elements_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_buttons"
    ADD CONSTRAINT "form_buttons_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_buttons"
    ADD CONSTRAINT "form_buttons_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "_FormInputToPubType"
    ADD CONSTRAINT "_FormInputToPubType_A_fkey" FOREIGN KEY ("A") REFERENCES "form_inputs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_FormInputToPubType"
    ADD CONSTRAINT "_FormInputToPubType_B_fkey" FOREIGN KEY ("B") REFERENCES "pub_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Clean up - drop old table and enum
-- Drop foreign key constraints first
ALTER TABLE "_FormElementToPubType"
    DROP CONSTRAINT "_FormElementToPubType_A_fkey";

ALTER TABLE "_FormElementToPubType"
    DROP CONSTRAINT "_FormElementToPubType_B_fkey";

ALTER TABLE "form_elements"
    DROP CONSTRAINT "form_elements_fieldId_fkey";

ALTER TABLE "form_elements"
    DROP CONSTRAINT "form_elements_formId_fkey";

ALTER TABLE "form_elements"
    DROP CONSTRAINT "form_elements_stageId_fkey";

-- Drop old tables
DROP TABLE "_FormElementToPubType";

DROP TABLE "form_elements";

-- Drop unused enum
DROP TYPE "ElementType";

