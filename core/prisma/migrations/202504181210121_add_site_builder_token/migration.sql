-- Enable the pgcrypto extension for cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- Add isSiteBuilderToken field to api_access_tokens
ALTER TABLE "api_access_tokens" ADD COLUMN "isSiteBuilderToken" BOOLEAN NOT NULL DEFAULT false;

-- Add unique index for one token per community
CREATE UNIQUE INDEX "api_access_tokens_is_site_builder_token_idx" ON "api_access_tokens" ("isSiteBuilderToken", "communityId") WHERE "isSiteBuilderToken" = true;


-- create site builder tokens for existing communities
WITH existing_communities AS (
    SELECT id FROM communities
), new_access_tokens AS (
  INSERT INTO api_access_tokens ("isSiteBuilderToken", "communityId", "token", "expiration", "name", "description") 
  SELECT true, id, encode(gen_random_bytes(16), 'base64'), NOW() + INTERVAL '100 years', 'Site Builder Token', 'Token for building PubPub sites. Cannot be removed.' 
  FROM existing_communities
  RETURNING id
)
INSERT INTO api_access_permissions ("apiAccessTokenId", scope, "accessType" )
    SELECT new_access_tokens.id, 'community'::"ApiAccessScope", 'read'::"ApiAccessType" FROM new_access_tokens
    UNION ALL
    SELECT new_access_tokens.id, 'pub'::"ApiAccessScope", 'read'::"ApiAccessType" FROM new_access_tokens
    UNION ALL
    SELECT new_access_tokens.id, 'stage'::"ApiAccessScope", 'read'::"ApiAccessType" FROM new_access_tokens
    UNION ALL
    SELECT new_access_tokens.id, 'member'::"ApiAccessScope", 'read'::"ApiAccessType" FROM new_access_tokens;

