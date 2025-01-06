CREATE OR REPLACE FUNCTION gen_random_slug() RETURNS TEXT AS $$
BEGIN
  RETURN md5(random()::text);
END;
$$ LANGUAGE plpgsql;

-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "slug" TEXT NOT NULL DEFAULT gen_random_slug();

-- CreateIndex
CREATE UNIQUE INDEX "pubs_communityId_slug_key" ON "pubs"("communityId", "slug");
