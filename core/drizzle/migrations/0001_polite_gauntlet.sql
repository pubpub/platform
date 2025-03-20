-- SELECT 1 FROM "users";-->statement-breakpoint
-- ALTER TABLE "pub_values" ALTER COLUMN "lastModifiedBy" SET DATA TYPE text;--> statement-breakpoint

-- DROP DOMAIN "modified_by_type";--> statement-breakpoint
-- ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_relatedPubId_pubs_id_fk" FOREIGN KEY ("relatedPubId") REFERENCES "public"."pubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_lastModifiedBy_check" CHECK ("lastModifiedBy" ~ '^(user|action-run|api-access-token):[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|d+$|^(unknown|system)|d+$');