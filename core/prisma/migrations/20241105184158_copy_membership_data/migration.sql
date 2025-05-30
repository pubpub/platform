BEGIN;

INSERT INTO "community_memberships" ("id", "role", "communityId", "userId", "createdAt", "updatedAt")
    SELECT "id", "role", "communityId", "userId", "createdAt", "updatedAt" FROM "members"
    ON CONFLICT ("id") DO NOTHING;

INSERT INTO "form_memberships" ("formId", "userId")
    SELECT "formId", "userId" FROM "form_to_permissions"
    JOIN "permissions"
        ON "permissions"."id" = "form_to_permissions"."permissionId"
    JOIN "members"
        ON "members"."id" = "permissions"."memberId"
    ON CONFLICT DO NOTHING;

COMMIT;