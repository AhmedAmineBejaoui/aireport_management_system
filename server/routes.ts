import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertFlightSchema, 
  insertGateSchema, 
  insertEmployeeSchema, 
  insertPassengerSchema,
  FlightStatus,
  GateStatus
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes and middleware
  setupAuth(app);
  const router = express.Router();
  
  // Authentication middleware for protected routes
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  };

  // Error handler middleware
  const handleError = (res: Response, error: unknown) => {
    console.error('API Error:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: fromZodError(error).message 
      });
    }
    
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  };

  // Flight routes
  router.get('/flights', async (req: Request, res: Response) => {
    try {
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const sort = req.query.sort as string || 'id';
      const order = req.query.order as string || 'asc';
      const search = req.query.search as string || '';
      
      const flights = await storage.getFlights(offset, limit, sort, order, search);
      const count = await storage.getFlightCount();
      
      res.json({ data: flights, total: count });
    } catch (error) {
      handleError(res, error);
    }
  });

  router.get('/flights/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const flight = await storage.getFlightById(id);
      
      if (!flight) {
        return res.status(404).json({ message: 'Flight not found' });
      }
      
      res.json(flight);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.post('/flights', async (req: Request, res: Response) => {
    try {
      const validatedData = insertFlightSchema.parse(req.body);
      const flight = await storage.createFlight(validatedData);
      res.status(201).json(flight);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.put('/flights/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFlightSchema.partial().parse(req.body);
      
      const updatedFlight = await storage.updateFlight(id, validatedData);
      
      if (!updatedFlight) {
        return res.status(404).json({ message: 'Flight not found' });
      }
      
      res.json(updatedFlight);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.delete('/flights/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFlight(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Flight not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Gate routes
  router.get('/gates', async (req: Request, res: Response) => {
    try {
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const gates = await storage.getGates(offset, limit);
      const count = await storage.getGateCount();
      
      res.json({ data: gates, total: count });
    } catch (error) {
      handleError(res, error);
    }
  });

  router.get('/gates/available', async (req: Request, res: Response) => {
    try {
      const gates = await storage.getAvailableGates();
      res.json(gates);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.get('/gates/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const gate = await storage.getGateById(id);
      
      if (!gate) {
        return res.status(404).json({ message: 'Gate not found' });
      }
      
      res.json(gate);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.post('/gates', async (req: Request, res: Response) => {
    try {
      const validatedData = insertGateSchema.parse(req.body);
      const gate = await storage.createGate(validatedData);
      res.status(201).json(gate);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.put('/gates/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertGateSchema.partial().parse(req.body);
      
      const updatedGate = await storage.updateGate(id, validatedData);
      
      if (!updatedGate) {
        return res.status(404).json({ message: 'Gate not found' });
      }
      
      res.json(updatedGate);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.delete('/gates/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGate(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Gate not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Employee routes
  router.get('/employees', async (req: Request, res: Response) => {
    try {
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const role = req.query.role as string;
      
      const employees = await storage.getEmployees(offset, limit, role);
      const count = await storage.getEmployeeCount();
      
      res.json({ data: employees, total: count });
    } catch (error) {
      handleError(res, error);
    }
  });

  router.get('/employees/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployeeById(id);
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      res.json(employee);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.post('/employees', async (req: Request, res: Response) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.put('/employees/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      
      const updatedEmployee = await storage.updateEmployee(id, validatedData);
      
      if (!updatedEmployee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      res.json(updatedEmployee);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.delete('/employees/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEmployee(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Passenger routes
  router.get('/passengers', async (req: Request, res: Response) => {
    try {
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const flightId = req.query.flightId ? parseInt(req.query.flightId as string) : undefined;
      
      const passengers = await storage.getPassengers(offset, limit, flightId);
      const count = await storage.getPassengerCount();
      
      res.json({ data: passengers, total: count });
    } catch (error) {
      handleError(res, error);
    }
  });

  router.get('/passengers/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const passenger = await storage.getPassengerById(id);
      
      if (!passenger) {
        return res.status(404).json({ message: 'Passenger not found' });
      }
      
      res.json(passenger);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.post('/passengers', async (req: Request, res: Response) => {
    try {
      const validatedData = insertPassengerSchema.parse(req.body);
      const passenger = await storage.createPassenger(validatedData);
      res.status(201).json(passenger);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.put('/passengers/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPassengerSchema.partial().parse(req.body);
      
      const updatedPassenger = await storage.updatePassenger(id, validatedData);
      
      if (!updatedPassenger) {
        return res.status(404).json({ message: 'Passenger not found' });
      }
      
      res.json(updatedPassenger);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.delete('/passengers/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePassenger(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Passenger not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Statistics routes
  router.get('/stats/flights-today', async (_req: Request, res: Response) => {
    try {
      const count = await storage.getFlightsToday();
      res.json({ count });
    } catch (error) {
      handleError(res, error);
    }
  });

  router.get('/stats/flights-status', async (_req: Request, res: Response) => {
    try {
      const data = await storage.getFlightStatusDistribution();
      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.get('/stats/passengers-per-flight', async (_req: Request, res: Response) => {
    try {
      const data = await storage.getPassengersPerFlight();
      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.get('/stats/daily-traffic', async (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const data = await storage.getDailyFlightTraffic(days);
      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.get('/stats/employees-role-count', async (_req: Request, res: Response) => {
    try {
      const data = await storage.getEmployeesByRole();
      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.get('/stats/overview', async (_req: Request, res: Response) => {
    try {
      const flightsToday = await storage.getFlightsToday();
      const passengerCount = await storage.getPassengerCount();
      const flightStatusDistribution = await storage.getFlightStatusDistribution();
      const gateStatusDistribution = await storage.getGateStatusDistribution();
      
      // Using the enum values directly from FlightStatus and GateStatus
      const onTimeCount = flightStatusDistribution.find(item => item.status === 'SCHEDULED')?.count || 0;
      const totalFlights = flightStatusDistribution.reduce((acc, curr) => acc + curr.count, 0);
      const onTimePercentage = totalFlights > 0 ? Math.round((onTimeCount / totalFlights) * 100) : 0;
      
      const availableGatesCount = gateStatusDistribution.find(item => item.status === 'AVAILABLE')?.count || 0;
      const totalGates = gateStatusDistribution.reduce((acc, curr) => acc + curr.count, 0);
      const activeGates = totalGates - availableGatesCount;
      
      res.json({
        flightsToday,
        totalPassengers: passengerCount,
        onTimePercentage,
        activeGates: `${activeGates}/${totalGates}`
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Mount API routes
  app.use('/api', router);

  const httpServer = createServer(app);
  return httpServer;
}
