import { 
    users, type User, type InsertUser,
    flights, type Flight, type InsertFlight,
    gates, type Gate, type InsertGate,
    employees, type Employee, type InsertEmployee,
    passengers, type Passenger, type InsertPassenger,
    flightEmployees, type FlightEmployee, type InsertFlightEmployee,
    FlightStatus, GateStatus
  } from "@shared/schema";
  import { db } from "./db";
  import { eq, count, sql, inArray, and, desc, asc, like } from "drizzle-orm";
  
  // Storage interface for CRUD operations
  export interface IStorage {
    // User operations
    getUser(id: number): Promise<User | undefined>;
    getUserByUsername(username: string): Promise<User | undefined>;
    createUser(user: InsertUser): Promise<User>;
  
    // Flight operations
    getFlights(offset?: number, limit?: number, sort?: string, order?: string, search?: string): Promise<Flight[]>;
    getFlightById(id: number): Promise<Flight | undefined>;
    getFlightByNumber(flightNumber: string): Promise<Flight | undefined>;
    createFlight(flight: InsertFlight): Promise<Flight>;
    updateFlight(id: number, flight: Partial<InsertFlight>): Promise<Flight | undefined>;
    deleteFlight(id: number): Promise<boolean>;
    getFlightCount(): Promise<number>;
  
    // Gate operations
    getGates(offset?: number, limit?: number): Promise<Gate[]>;
    getGateById(id: number): Promise<Gate | undefined>;
    getGateByNumber(gateNumber: string): Promise<Gate | undefined>;
    createGate(gate: InsertGate): Promise<Gate>;
    updateGate(id: number, gate: Partial<InsertGate>): Promise<Gate | undefined>;
    deleteGate(id: number): Promise<boolean>;
    getGateCount(): Promise<number>;
    getAvailableGates(): Promise<Gate[]>;
  
    // Employee operations
    getEmployees(offset?: number, limit?: number, role?: string): Promise<Employee[]>;
    getEmployeeById(id: number): Promise<Employee | undefined>;
    createEmployee(employee: InsertEmployee): Promise<Employee>;
    updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
    deleteEmployee(id: number): Promise<boolean>;
    getEmployeeCount(): Promise<number>;
    getEmployeesByRole(): Promise<{ role: string; count: number }[]>;
  
    // Passenger operations
    getPassengers(offset?: number, limit?: number, flightId?: number): Promise<Passenger[]>;
    getPassengerById(id: number): Promise<Passenger | undefined>;
    createPassenger(passenger: InsertPassenger): Promise<Passenger>;
    updatePassenger(id: number, passenger: Partial<InsertPassenger>): Promise<Passenger | undefined>;
    deletePassenger(id: number): Promise<boolean>;
    getPassengerCount(): Promise<number>;
    getPassengersPerFlight(): Promise<{ flightNumber: string; passengerCount: number }[]>;
  
    // Statistics
    getFlightsToday(): Promise<number>;
    getFlightStatusDistribution(): Promise<{ status: keyof typeof FlightStatus; count: number }[]>;
    getGateStatusDistribution(): Promise<{ status: keyof typeof GateStatus; count: number }[]>;
    getDailyFlightTraffic(days: number): Promise<{ date: string; arrivals: number; departures: number }[]>;
  }
  
  export class DatabaseStorage implements IStorage {
    // User operations
    async getUser(id: number): Promise<User | undefined> {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    }
  
    async getUserByUsername(username: string): Promise<User | undefined> {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    }
  
    async createUser(insertUser: InsertUser): Promise<User> {
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      return user;
    }
  
    // Flight operations
    async getFlights(offset = 0, limit = 10, sort = 'id', order = 'asc', search = ''): Promise<Flight[]> {
      let query = db.select().from(flights);
      
      if (search) {
        query = query.where(
          sql`${flights.flightNumber} ILIKE ${'%' + search + '%'} OR 
              ${flights.origin} ILIKE ${'%' + search + '%'} OR 
              ${flights.destination} ILIKE ${'%' + search + '%'}`
        );
      }
      
      if (sort && order) {
        const sortColumn = sort as keyof typeof flights;
        if (order === 'desc') {
          query = query.orderBy(desc(flights[sortColumn]));
        } else {
          query = query.orderBy(asc(flights[sortColumn]));
        }
      }
      
      return await query.limit(limit).offset(offset);
    }
  
    async getFlightById(id: number): Promise<Flight | undefined> {
      const [flight] = await db.select().from(flights).where(eq(flights.id, id));
      return flight;
    }
  
    async getFlightByNumber(flightNumber: string): Promise<Flight | undefined> {
      const [flight] = await db.select().from(flights).where(eq(flights.flightNumber, flightNumber));
      return flight;
    }
  
    async createFlight(insertFlight: InsertFlight): Promise<Flight> {
      const [flight] = await db
        .insert(flights)
        .values(insertFlight)
        .returning();
      return flight;
    }
  
    async updateFlight(id: number, flightUpdate: Partial<InsertFlight>): Promise<Flight | undefined> {
      const [updatedFlight] = await db
        .update(flights)
        .set(flightUpdate)
        .where(eq(flights.id, id))
        .returning();
      return updatedFlight;
    }
  
    async deleteFlight(id: number): Promise<boolean> {
      const [deletedFlight] = await db
        .delete(flights)
        .where(eq(flights.id, id))
        .returning();
      return !!deletedFlight;
    }
  
    async getFlightCount(): Promise<number> {
      const [result] = await db
        .select({ count: count() })
        .from(flights);
      return result.count;
    }
  
    // Gate operations
    async getGates(offset = 0, limit = 10): Promise<Gate[]> {
      return await db.select().from(gates).limit(limit).offset(offset);
    }
  
    async getGateById(id: number): Promise<Gate | undefined> {
      const [gate] = await db.select().from(gates).where(eq(gates.id, id));
      return gate;
    }
  
    async getGateByNumber(gateNumber: string): Promise<Gate | undefined> {
      const [gate] = await db.select().from(gates).where(eq(gates.gateNumber, gateNumber));
      return gate;
    }
  
    async createGate(insertGate: InsertGate): Promise<Gate> {
      const [gate] = await db
        .insert(gates)
        .values(insertGate)
        .returning();
      return gate;
    }
  
    async updateGate(id: number, gateUpdate: Partial<InsertGate>): Promise<Gate | undefined> {
      const [updatedGate] = await db
        .update(gates)
        .set(gateUpdate)
        .where(eq(gates.id, id))
        .returning();
      return updatedGate;
    }
  
    async deleteGate(id: number): Promise<boolean> {
      const [deletedGate] = await db
        .delete(gates)
        .where(eq(gates.id, id))
        .returning();
      return !!deletedGate;
    }
  
    async getGateCount(): Promise<number> {
      const [result] = await db
        .select({ count: count() })
        .from(gates);
      return result.count;
    }
  
    async getAvailableGates(): Promise<Gate[]> {
      return await db
        .select()
        .from(gates)
        .where(eq(gates.status, GateStatus.AVAILABLE));
    }
  
    // Employee operations
    async getEmployees(offset = 0, limit = 10, role?: string): Promise<Employee[]> {
      let query = db.select().from(employees);
      
      if (role) {
        query = query.where(eq(employees.role, role));
      }
      
      return await query.limit(limit).offset(offset);
    }
  
    async getEmployeeById(id: number): Promise<Employee | undefined> {
      const [employee] = await db.select().from(employees).where(eq(employees.id, id));
      return employee;
    }
  
    async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
      const [employee] = await db
        .insert(employees)
        .values(insertEmployee)
        .returning();
      return employee;
    }
  
    async updateEmployee(id: number, employeeUpdate: Partial<InsertEmployee>): Promise<Employee | undefined> {
      const [updatedEmployee] = await db
        .update(employees)
        .set(employeeUpdate)
        .where(eq(employees.id, id))
        .returning();
      return updatedEmployee;
    }
  
    async deleteEmployee(id: number): Promise<boolean> {
      const [deletedEmployee] = await db
        .delete(employees)
        .where(eq(employees.id, id))
        .returning();
      return !!deletedEmployee;
    }
  
    async getEmployeeCount(): Promise<number> {
      const [result] = await db
        .select({ count: count() })
        .from(employees);
      return result.count;
    }
  
    async getEmployeesByRole(): Promise<{ role: string; count: number }[]> {
      return await db
        .select({
          role: employees.role,
          count: count(),
        })
        .from(employees)
        .groupBy(employees.role);
    }
  
    // Passenger operations
    async getPassengers(offset = 0, limit = 10, flightId?: number): Promise<Passenger[]> {
      let query = db.select().from(passengers);
      
      if (flightId) {
        query = query.where(eq(passengers.flightId, flightId));
      }
      
      return await query.limit(limit).offset(offset);
    }
  
    async getPassengerById(id: number): Promise<Passenger | undefined> {
      const [passenger] = await db.select().from(passengers).where(eq(passengers.id, id));
      return passenger;
    }
  
    async createPassenger(insertPassenger: InsertPassenger): Promise<Passenger> {
      const [passenger] = await db
        .insert(passengers)
        .values(insertPassenger)
        .returning();
      return passenger;
    }
  
    async updatePassenger(id: number, passengerUpdate: Partial<InsertPassenger>): Promise<Passenger | undefined> {
      const [updatedPassenger] = await db
        .update(passengers)
        .set(passengerUpdate)
        .where(eq(passengers.id, id))
        .returning();
      return updatedPassenger;
    }
  
    async deletePassenger(id: number): Promise<boolean> {
      const [deletedPassenger] = await db
        .delete(passengers)
        .where(eq(passengers.id, id))
        .returning();
      return !!deletedPassenger;
    }
  
    async getPassengerCount(): Promise<number> {
      const [result] = await db
        .select({ count: count() })
        .from(passengers);
      return result.count;
    }
  
    async getPassengersPerFlight(): Promise<{ flightNumber: string; passengerCount: number }[]> {
      const results = await db
        .select({
          flightId: passengers.flightId,
          passengerCount: count(),
        })
        .from(passengers)
        .groupBy(passengers.flightId);
  
      // Get flight numbers for each flight ID
      const flightIds = results.map(r => r.flightId).filter(Boolean) as number[];
      
      if (flightIds.length === 0) {
        return [];
      }
      
      const flightDetails = await db
        .select({
          id: flights.id,
          flightNumber: flights.flightNumber,
        })
        .from(flights)
        .where(inArray(flights.id, flightIds));
      
      // Map flight IDs to flight numbers
      const flightMap = new Map(flightDetails.map(f => [f.id, f.flightNumber]));
      
      return results
        .filter(r => r.flightId !== null)
        .map(r => ({
          flightNumber: flightMap.get(r.flightId!) || 'Unknown',
          passengerCount: r.passengerCount,
        }));
    }
  
    // Statistics operations
    async getFlightsToday(): Promise<number> {
      const today = new Date().toISOString().split('T')[0];
      
      const [result] = await db
        .select({ count: count() })
        .from(flights)
        .where(eq(flights.departureDate, today));
      
      return result.count;
    }
  
    async getFlightStatusDistribution(): Promise<{ status: keyof typeof FlightStatus; count: number }[]> {
      return await db
        .select({
          status: flights.status,
          count: count(),
        })
        .from(flights)
        .groupBy(flights.status);
    }
  
    async getGateStatusDistribution(): Promise<{ status: keyof typeof GateStatus; count: number }[]> {
      return await db
        .select({
          status: gates.status,
          count: count(),
        })
        .from(gates)
        .groupBy(gates.status);
    }
  
    async getDailyFlightTraffic(days: number = 7): Promise<{ date: string; arrivals: number; departures: number }[]> {
      // This is a simplified implementation
      // In a real system, we'd use SQL date functions to group by date
      
      // For this example, we'll generate date ranges and count flights
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1);
      
      // Format dates to ISO strings like '2023-01-01'
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Get all flights in date range
      const flightData = await db
        .select({
          date: flights.departureDate,
          status: flights.status,
        })
        .from(flights)
        .where(
          and(
            sql`${flights.departureDate} >= ${startDateStr}`,
            sql`${flights.departureDate} <= ${endDateStr}`
          )
        );
      
      // Create a map for each date in range
      const dateMap: Record<string, { arrivals: number; departures: number }> = {};
      
      // Initialize all dates
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateMap[dateStr] = { arrivals: 0, departures: 0 };
      }
      
      // Count flights by date and status
      flightData.forEach(flight => {
        const dateStr = flight.date;
        if (dateMap[dateStr]) {
          if (flight.status === FlightStatus.ARRIVED) {
            dateMap[dateStr].arrivals++;
          } else if (flight.status === FlightStatus.DEPARTED) {
            dateMap[dateStr].departures++;
          }
        }
      });
      
      // Convert map to array sorted by date
      return Object.entries(dateMap)
        .map(([date, counts]) => ({
          date,
          ...counts
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
  }
  
  export class MemStorage implements IStorage {
    private usersData: Map<number, User>;
    private flightsData: Map<number, Flight>;
    private gatesData: Map<number, Gate>;
    private employeesData: Map<number, Employee>;
    private passengersData: Map<number, Passenger>;
    private flightEmployeesData: Map<number, FlightEmployee>;
    
    private userId: number = 1;
    private flightId: number = 1;
    private gateId: number = 1;
    private employeeId: number = 1;
    private passengerId: number = 1;
    private flightEmployeeId: number = 1;
  
    constructor() {
      this.usersData = new Map();
      this.flightsData = new Map();
      this.gatesData = new Map();
      this.employeesData = new Map();
      this.passengersData = new Map();
      this.flightEmployeesData = new Map();
      
      // Initialize with some sample data
      this.initializeData();
    }
  
    private initializeData() {
      // Initialize gates
      const gateA1 = this.createGate({
        gateNumber: "A1",
        terminal: "A",
        status: "occupied",
        currentFlightId: null
      });
      
      const gateA2 = this.createGate({
        gateNumber: "A2",
        terminal: "A",
        status: "available",
        currentFlightId: null
      });
      
      const gateB1 = this.createGate({
        gateNumber: "B1",
        terminal: "B",
        status: "maintenance",
        currentFlightId: null
      });
      
      // Initialize flights
      const flight1 = this.createFlight({
        flightNumber: "AA1234",
        airline: "American Airlines",
        origin: "New York (JFK)",
        destination: "Los Angeles (LAX)",
        departureDate: new Date().toISOString().split('T')[0],
        departureTime: "10:30:00",
        gateId: gateA1.id,
        status: "scheduled"
      });
      
      const flight2 = this.createFlight({
        flightNumber: "UA2567",
        airline: "United Airlines",
        origin: "Chicago (ORD)",
        destination: "San Francisco (SFO)",
        departureDate: new Date().toISOString().split('T')[0],
        departureTime: "11:45:00",
        gateId: null,
        status: "delayed"
      });
      
      // Initialize employees
      this.createEmployee({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@airport.com",
        phone: "123-456-7890",
        role: "pilot",
        assignedFlightId: flight1.id,
        assignedGateId: null
      });
      
      this.createEmployee({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@airport.com",
        phone: "123-456-7891",
        role: "flight_attendant",
        assignedFlightId: flight1.id,
        assignedGateId: null
      });
      
      // Initialize passengers
      this.createPassenger({
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@example.com",
        flightId: flight1.id,
        seatNumber: "12A",
        checkedIn: true
      });
      
      this.createPassenger({
        firstName: "Bob",
        lastName: "Brown",
        email: "bob@example.com",
        flightId: flight1.id,
        seatNumber: "12B",
        checkedIn: false
      });
      
      // Update gate with current flight
      this.updateGate(gateA1.id, {
        currentFlightId: flight1.id
      });
    }
  
    // User operations
    async getUser(id: number): Promise<User | undefined> {
      return this.usersData.get(id);
    }
  
    async getUserByUsername(username: string): Promise<User | undefined> {
      return Array.from(this.usersData.values()).find(
        (user) => user.username === username
      );
    }
  
    async createUser(insertUser: InsertUser): Promise<User> {
      const id = this.userId++;
      const user: User = { ...insertUser, id };
      this.usersData.set(id, user);
      return user;
    }
  
    // Flight operations
    async getFlights(offset = 0, limit = 10, sort = 'id', order = 'asc', search = ''): Promise<Flight[]> {
      let flights = Array.from(this.flightsData.values());
      
      if (search) {
        const searchLower = search.toLowerCase();
        flights = flights.filter(
          (flight) =>
            flight.flightNumber.toLowerCase().includes(searchLower) ||
            flight.origin.toLowerCase().includes(searchLower) ||
            flight.destination.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort flights
      flights.sort((a, b) => {
        const aValue = a[sort as keyof Flight];
        const bValue = b[sort as keyof Flight];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return order === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        if (aValue !== undefined && bValue !== undefined) {
          return order === 'asc' 
            ? Number(aValue) - Number(bValue) 
            : Number(bValue) - Number(aValue);
        }
        
        return 0;
      });
      
      return flights.slice(offset, offset + limit);
    }
  
    async getFlightById(id: number): Promise<Flight | undefined> {
      return this.flightsData.get(id);
    }
  
    async getFlightByNumber(flightNumber: string): Promise<Flight | undefined> {
      return Array.from(this.flightsData.values()).find(
        (flight) => flight.flightNumber === flightNumber
      );
    }
  
    async createFlight(insertFlight: InsertFlight): Promise<Flight> {
      const id = this.flightId++;
      const flight: Flight = { ...insertFlight, id };
      this.flightsData.set(id, flight);
      return flight;
    }
  
    async updateFlight(id: number, flightUpdate: Partial<InsertFlight>): Promise<Flight | undefined> {
      const flight = this.flightsData.get(id);
      if (!flight) return undefined;
      
      const updatedFlight = { ...flight, ...flightUpdate };
      this.flightsData.set(id, updatedFlight);
      return updatedFlight;
    }
  
    async deleteFlight(id: number): Promise<boolean> {
      return this.flightsData.delete(id);
    }
  
    async getFlightCount(): Promise<number> {
      return this.flightsData.size;
    }
  
    // Gate operations
    async getGates(offset = 0, limit = 10): Promise<Gate[]> {
      return Array.from(this.gatesData.values()).slice(offset, offset + limit);
    }
  
    async getGateById(id: number): Promise<Gate | undefined> {
      return this.gatesData.get(id);
    }
  
    async getGateByNumber(gateNumber: string): Promise<Gate | undefined> {
      return Array.from(this.gatesData.values()).find(
        (gate) => gate.gateNumber === gateNumber
      );
    }
  
    async createGate(insertGate: InsertGate): Promise<Gate> {
      const id = this.gateId++;
      const gate: Gate = { ...insertGate, id };
      this.gatesData.set(id, gate);
      return gate;
    }
  
    async updateGate(id: number, gateUpdate: Partial<InsertGate>): Promise<Gate | undefined> {
      const gate = this.gatesData.get(id);
      if (!gate) return undefined;
      
      const updatedGate = { ...gate, ...gateUpdate };
      this.gatesData.set(id, updatedGate);
      return updatedGate;
    }
  
    async deleteGate(id: number): Promise<boolean> {
      return this.gatesData.delete(id);
    }
  
    async getGateCount(): Promise<number> {
      return this.gatesData.size;
    }
  
    async getAvailableGates(): Promise<Gate[]> {
      return Array.from(this.gatesData.values()).filter(
        (gate) => gate.status === GateStatus.AVAILABLE
      );
    }
  
    // Employee operations
    async getEmployees(offset = 0, limit = 10, role?: string): Promise<Employee[]> {
      let employees = Array.from(this.employeesData.values());
      
      if (role) {
        employees = employees.filter((employee) => employee.role === role);
      }
      
      return employees.slice(offset, offset + limit);
    }
  
    async getEmployeeById(id: number): Promise<Employee | undefined> {
      return this.employeesData.get(id);
    }
  
    async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
      const id = this.employeeId++;
      const employee: Employee = { ...insertEmployee, id };
      this.employeesData.set(id, employee);
      return employee;
    }
  
    async updateEmployee(id: number, employeeUpdate: Partial<InsertEmployee>): Promise<Employee | undefined> {
      const employee = this.employeesData.get(id);
      if (!employee) return undefined;
      
      const updatedEmployee = { ...employee, ...employeeUpdate };
      this.employeesData.set(id, updatedEmployee);
      return updatedEmployee;
    }
  
    async deleteEmployee(id: number): Promise<boolean> {
      return this.employeesData.delete(id);
    }
  
    async getEmployeeCount(): Promise<number> {
      return this.employeesData.size;
    }
  
    async getEmployeesByRole(): Promise<{ role: string; count: number }[]> {
      const roleCounts: Record<string, number> = {};
      
      Array.from(this.employeesData.values()).forEach((employee) => {
        roleCounts[employee.role] = (roleCounts[employee.role] || 0) + 1;
      });
      
      return Object.entries(roleCounts).map(([role, count]) => ({ role, count }));
    }
  
    // Passenger operations
    async getPassengers(offset = 0, limit = 10, flightId?: number): Promise<Passenger[]> {
      let passengers = Array.from(this.passengersData.values());
      
      if (flightId) {
        passengers = passengers.filter((passenger) => passenger.flightId === flightId);
      }
      
      return passengers.slice(offset, offset + limit);
    }
  
    async getPassengerById(id: number): Promise<Passenger | undefined> {
      return this.passengersData.get(id);
    }
  
    async createPassenger(insertPassenger: InsertPassenger): Promise<Passenger> {
      const id = this.passengerId++;
      const passenger: Passenger = { ...insertPassenger, id };
      this.passengersData.set(id, passenger);
      return passenger;
    }
  
    async updatePassenger(id: number, passengerUpdate: Partial<InsertPassenger>): Promise<Passenger | undefined> {
      const passenger = this.passengersData.get(id);
      if (!passenger) return undefined;
      
      const updatedPassenger = { ...passenger, ...passengerUpdate };
      this.passengersData.set(id, updatedPassenger);
      return updatedPassenger;
    }
  
    async deletePassenger(id: number): Promise<boolean> {
      return this.passengersData.delete(id);
    }
  
    async getPassengerCount(): Promise<number> {
      return this.passengersData.size;
    }
  
    async getPassengersPerFlight(): Promise<{ flightNumber: string; passengerCount: number }[]> {
      const flightPassengerCounts: Record<number, number> = {};
      
      Array.from(this.passengersData.values()).forEach((passenger) => {
        if (passenger.flightId) {
          flightPassengerCounts[passenger.flightId] = (flightPassengerCounts[passenger.flightId] || 0) + 1;
        }
      });
      
      return Object.entries(flightPassengerCounts).map(([flightIdStr, count]) => {
        const flightId = parseInt(flightIdStr);
        const flight = this.flightsData.get(flightId);
        return {
          flightNumber: flight ? flight.flightNumber : 'Unknown',
          passengerCount: count
        };
      });
    }
  
    // Statistics operations
    async getFlightsToday(): Promise<number> {
      const today = new Date().toISOString().split('T')[0];
      
      return Array.from(this.flightsData.values()).filter(
        (flight) => flight.departureDate === today
      ).length;
    }
  
    async getFlightStatusDistribution(): Promise<{ status: keyof typeof FlightStatus; count: number }[]> {
      const statusCounts: Record<string, number> = {};
      
      Array.from(this.flightsData.values()).forEach((flight) => {
        statusCounts[flight.status] = (statusCounts[flight.status] || 0) + 1;
      });
      
      return Object.entries(statusCounts).map(([status, count]) => ({ 
        status: status as keyof typeof FlightStatus, 
        count 
      }));
    }
  
    async getGateStatusDistribution(): Promise<{ status: keyof typeof GateStatus; count: number }[]> {
      const statusCounts: Record<string, number> = {};
      
      Array.from(this.gatesData.values()).forEach((gate) => {
        statusCounts[gate.status] = (statusCounts[gate.status] || 0) + 1;
      });
      
      return Object.entries(statusCounts).map(([status, count]) => ({ 
        status: status as keyof typeof GateStatus, 
        count 
      }));
    }
  
    async getDailyFlightTraffic(days: number = 7): Promise<{ date: string; arrivals: number; departures: number }[]> {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1);
      
      // Format dates to ISO strings like '2023-01-01'
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Create a map for each date in range
      const dateMap: Record<string, { arrivals: number; departures: number }> = {};
      
      // Initialize all dates
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateMap[dateStr] = { arrivals: 0, departures: 0 };
      }
      
      // Count flights by date and status
      Array.from(this.flightsData.values()).forEach(flight => {
        if (flight.departureDate >= startDateStr && flight.departureDate <= endDateStr) {
          if (flight.status === FlightStatus.ARRIVED) {
            dateMap[flight.departureDate].arrivals++;
          } else if (flight.status === FlightStatus.DEPARTED) {
            dateMap[flight.departureDate].departures++;
          }
        }
      });
      
      // Convert map to array sorted by date
      return Object.entries(dateMap)
        .map(([date, counts]) => ({
          date,
          ...counts
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
  }
  
  // Choose which storage implementation to use
  // For development, we can use MemStorage
  // For production, we would use DatabaseStorage
  export const storage = new DatabaseStorage();
  