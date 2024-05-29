-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "pub_type_id" TEXT NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_inputs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "field_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "order" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,
    "is_submit" BOOLEAN NOT NULL,

    CONSTRAINT "form_inputs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_pub_type_id_fkey" FOREIGN KEY ("pub_type_id") REFERENCES "pub_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_inputs" ADD CONSTRAINT "form_inputs_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "pub_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_inputs" ADD CONSTRAINT "form_inputs_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Only allow one is_submit = true column per form_id
CREATE UNIQUE INDEX form_inputs_is_submit_unique ON "form_inputs" ("form_id") WHERE "is_submit" = true;