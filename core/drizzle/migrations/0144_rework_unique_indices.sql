DROP INDEX "api_access_tokens_token_key";--> statement-breakpoint
DROP INDEX "communities_slug_key";--> statement-breakpoint
DROP INDEX "pub_fields_slug_key";--> statement-breakpoint
DROP INDEX "users_email_key";--> statement-breakpoint
DROP INDEX "users_slug_key";--> statement-breakpoint
ALTER TABLE "api_access_tokens" ADD CONSTRAINT "api_access_tokens_token_key" UNIQUE("token");--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_slug_key" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "pub_fields" ADD CONSTRAINT "pub_fields_slug_key" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_slug_key" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE("email");