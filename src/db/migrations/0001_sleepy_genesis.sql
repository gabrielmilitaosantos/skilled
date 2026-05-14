CREATE INDEX "skills_author_id_idx" ON "skills" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "skills_created_at_idx" ON "skills" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "skills_tags_idx" ON "skills" USING gin ("tags");