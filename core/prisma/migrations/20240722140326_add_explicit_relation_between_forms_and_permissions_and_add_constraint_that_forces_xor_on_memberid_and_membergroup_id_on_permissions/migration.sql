-- CreateTable
CREATE TABLE
    "form_to_permissions" (
        "formId" TEXT NOT NULL,
        "permissionId" TEXT NOT NULL
    );

-- CreateIndex
CREATE UNIQUE INDEX "form_to_permissions_formId_permissionId_key" ON "form_to_permissions" ("formId", "permissionId");

-- AddForeignKey
ALTER TABLE "form_to_permissions" ADD CONSTRAINT "form_to_permissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_to_permissions" ADD CONSTRAINT "form_to_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Force permissions to have either a memberId or a memberGroupId, but not both
ALTER TABLE "permissions" ADD CONSTRAINT "memberId_xor_memberGroupId" CHECK (
    (
        "memberId" IS NOT NULL
        AND "memberGroupId" IS NULL
    )
    OR (
        "memberId" IS NULL
        AND "memberGroupId" IS NOT NULL
    )
);