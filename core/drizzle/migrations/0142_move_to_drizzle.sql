DROP INDEX "unique_action_chaining_events";--> statement-breakpoint
ALTER TABLE "pub_values" ALTER COLUMN "lastModifiedBy" SET DATA TYPE text;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_action_chaining_events" ON "rules" USING btree ("actionInstanceId" text_ops,"event" text_ops,"sourceActionInstanceId" text_ops) WHERE ("sourceActionInstanceId" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_lastModifiedBy_check" CHECK ("lastModifiedBy" ~ '^(user|action-run|api-access-token):[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|d+$|^(unknown|system)|d+$');

DROP DOMAIN "modified_by_type";--> statement-breakpoint