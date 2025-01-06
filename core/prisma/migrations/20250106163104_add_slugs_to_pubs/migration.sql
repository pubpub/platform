CREATE OR REPLACE FUNCTION gen_random_slug() RETURNS TEXT AS $$
BEGIN
  RETURN substr(md5(random()::text), 1, 10);
END;
$$ LANGUAGE plpgsql;

CREATE DOMAIN slug AS TEXT CHECK (VALUE ~ '^[a-z0-9-]+$');

-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "slug" slug NOT NULL DEFAULT gen_random_slug();

-- CreateIndex
CREATE UNIQUE INDEX "pubs_communityId_slug_key" ON "pubs"("communityId", "slug");
