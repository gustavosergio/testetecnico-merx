ALTER TABLE trainers ADD COLUMN password_hash TEXT;
--> statement-breakpoint
ALTER TABLE trainers ADD COLUMN salt TEXT;
--> statement-breakpoint
ALTER TABLE trainers ADD COLUMN avatar_id INTEGER NOT NULL DEFAULT 25;
--> statement-breakpoint
ALTER TABLE trainers ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE trainers ADD COLUMN window_end INTEGER NOT NULL DEFAULT 0;
