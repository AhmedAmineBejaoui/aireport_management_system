import { pgTable, text, serial, integer, date, time, timestamp, boolean, varchar, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Keep the existing users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Flight status enum
export const FlightStatus = {
  SCHEDULED: "scheduled",
  DELAYED: "delayed",
  DEPARTED: "departed",
  ARRIVED: "arrived",
  CANCELLED: "cancelled",
} as const;

// Gate status enum
export const GateStatus = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  MAINTENANCE: "maintenance",
  CLOSED: "closed",
} as const;

// Employee roles enum
export const EmployeeRole = {
  PILOT: "pilot",
  FLIGHT_ATTENDANT: "flight_attendant",
  GATE_AGENT: "gate_agent",
  GROUND_STAFF: "ground_staff",
  SECURITY: "security",
  ADMINISTRATION: "administration",
} as const;

// Flights table
export const flights = pgTable("flights", {
  id: serial("id").primaryKey(),
  flightNumber: varchar("flight_number", { length: 10 }).notNull().unique(),
  airline: text("airline").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  departureDate: date("departure_date").notNull(),
  departureTime: time("departure_time").notNull(),
  gateId: integer("gate_id").references(() => gates.id),
  status: text("status").notNull().$type<keyof typeof FlightStatus>(),
});

// Gates table
export const gates = pgTable("gates", {
  id: serial("id").primaryKey(),
  gateNumber: varchar("gate_number", { length: 10 }).notNull().unique(),
  terminal: text("terminal").notNull(),
  status: text("status").notNull().$type<keyof typeof GateStatus>(),
  currentFlightId: integer("current_flight_id"),
});

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").notNull().$type<keyof typeof EmployeeRole>(),
  assignedFlightId: integer("assigned_flight_id").references(() => flights.id),
  assignedGateId: integer("assigned_gate_id").references(() => gates.id),
});

// Passengers table
export const passengers = pgTable("passengers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  flightId: integer("flight_id").references(() => flights.id),
  seatNumber: text("seat_number"),
  checkedIn: boolean("checked_in").default(false),
});

// Flight-Employee assignment table
export const flightEmployees = pgTable("flight_employees", {
  id: serial("id").primaryKey(),
  flightId: integer("flight_id").notNull().references(() => flights.id),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
});

// Create insert schemas
export const insertFlightSchema = createInsertSchema(flights)
  .omit({ id: true });

export const insertGateSchema = createInsertSchema(gates)
  .omit({ id: true });

export const insertEmployeeSchema = createInsertSchema(employees)
  .omit({ id: true });

export const insertPassengerSchema = createInsertSchema(passengers)
  .omit({ id: true });

export const insertFlightEmployeeSchema = createInsertSchema(flightEmployees)
  .omit({ id: true });

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Flight = typeof flights.$inferSelect;
export type InsertFlight = z.infer<typeof insertFlightSchema>;

export type Gate = typeof gates.$inferSelect;
export type InsertGate = z.infer<typeof insertGateSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Passenger = typeof passengers.$inferSelect;
export type InsertPassenger = z.infer<typeof insertPassengerSchema>;

export type FlightEmployee = typeof flightEmployees.$inferSelect;
export type InsertFlightEmployee = z.infer<typeof insertFlightEmployeeSchema>;
