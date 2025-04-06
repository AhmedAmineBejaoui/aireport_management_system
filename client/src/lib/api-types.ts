// API response types for each endpoint
export interface ApiResponse<T> {
    data: T[];
    total: number;
  }
  
  export interface StatResponse {
    count: number;
  }
  
  export interface FlightStatusDistribution {
    status: 'scheduled' | 'delayed' | 'departed' | 'arrived' | 'cancelled';
    count: number;
  }
  
  export interface PassengersPerFlight {
    flightNumber: string;
    passengerCount: number;
  }
  
  export interface DailyFlightTraffic {
    date: string;
    arrivals: number;
    departures: number;
  }
  
  export interface EmployeeRoleCount {
    role: string;
    count: number;
  }
  
  export interface OverviewStats {
    flightsToday: number;
    totalPassengers: number;
    onTimePercentage: number;
    activeGates: string;
  }
  
  // Entity types matching the database schema
  export interface Flight {
    id: number;
    flightNumber: string;
    airline: string;
    origin: string;
    destination: string;
    departureDate: string;
    departureTime: string;
    gateId: number | null;
    status: 'scheduled' | 'delayed' | 'departed' | 'arrived' | 'cancelled';
  }
  
  export interface Gate {
    id: number;
    gateNumber: string;
    terminal: string;
    status: 'available' | 'occupied' | 'maintenance' | 'closed';
    currentFlightId: number | null;
  }
  
  export interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: 'pilot' | 'flight_attendant' | 'gate_agent' | 'ground_staff' | 'security' | 'administration';
    assignedFlightId: number | null;
    assignedGateId: number | null;
  }
  
  export interface Passenger {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    flightId: number | null;
    seatNumber: string | null;
    checkedIn: boolean;
  }
  
  // Form input types
  export interface FlightFormInput {
    flightNumber: string;
    airline: string;
    origin: string;
    destination: string;
    departureDate: string;
    departureTime: string;
    gateId: number | null;
    status: 'scheduled' | 'delayed' | 'departed' | 'arrived' | 'cancelled';
  }
  
  export interface GateFormInput {
    gateNumber: string;
    terminal: string;
    status: 'available' | 'occupied' | 'maintenance' | 'closed';
    currentFlightId: number | null;
  }
  
  export interface EmployeeFormInput {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: 'pilot' | 'flight_attendant' | 'gate_agent' | 'ground_staff' | 'security' | 'administration';
    assignedFlightId: number | null;
    assignedGateId: number | null;
  }
  
  export interface PassengerFormInput {
    firstName: string;
    lastName: string;
    email: string;
    flightId: number | null;
    seatNumber: string | null;
    checkedIn: boolean;
  }
  