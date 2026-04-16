CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
