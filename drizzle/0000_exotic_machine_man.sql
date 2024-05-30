CREATE TABLE `permission` (
	`id` text PRIMARY KEY NOT NULL,
	`can_create_music_ids` integer DEFAULT false NOT NULL,
	`can_manage_music_ids` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text(32) NOT NULL,
	`email` text(128) NOT NULL,
	`permissions_id` text NOT NULL,
	FOREIGN KEY (`permissions_id`) REFERENCES `permission`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);