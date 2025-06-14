CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"role" text NOT NULL,
	"assigned_flight_id" integer,
	"assigned_gate_id" integer,
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "flight_employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"flight_id" integer NOT NULL,
	"employee_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" serial PRIMARY KEY NOT NULL,
	"flight_number" varchar(10) NOT NULL,
	"airline" text NOT NULL,
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"departure_date" date NOT NULL,
	"departure_time" time NOT NULL,
	"gate_id" integer,
	"status" text NOT NULL,
	CONSTRAINT "flights_flight_number_unique" UNIQUE("flight_number")
);
--> statement-breakpoint
CREATE TABLE "gates" (
	"id" serial PRIMARY KEY NOT NULL,
	"gate_number" varchar(10) NOT NULL,
	"terminal" text NOT NULL,
	"status" text NOT NULL,
	"current_flight_id" integer,
	CONSTRAINT "gates_gate_number_unique" UNIQUE("gate_number")
);
--> statement-breakpoint
CREATE TABLE "passengers" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"flight_id" integer,
	"seat_number" text,
	"checked_in" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_assigned_flight_id_flights_id_fk" FOREIGN KEY ("assigned_flight_id") REFERENCES "public"."flights"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_assigned_gate_id_gates_id_fk" FOREIGN KEY ("assigned_gate_id") REFERENCES "public"."gates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_employees" ADD CONSTRAINT "flight_employees_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_employees" ADD CONSTRAINT "flight_employees_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flights" ADD CONSTRAINT "flights_gate_id_gates_id_fk" FOREIGN KEY ("gate_id") REFERENCES "public"."gates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE no action ON UPDATE no action;