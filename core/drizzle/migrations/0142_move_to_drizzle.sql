ALTER TABLE "pub_values" ALTER COLUMN "lastModifiedBy" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_lastModifiedBy_check" CHECK ("lastModifiedBy" ~ '^(user|action-run|api-access-token):[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|d+$|^(unknown|system)|d+$');

DROP DOMAIN "modified_by_type";--> statement-breakpoint