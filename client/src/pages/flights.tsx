import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppLayout } from "@/layout/app-layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Search, Plus } from "lucide-react";
import type { Flight, FlightFormInput, Gate } from "@/lib/api-types";
import { insertFlightSchema } from "@shared/schema";

// Status colors
const STATUS_COLORS = {
  scheduled: "bg-green-100 text-green-800",
  delayed: "bg-yellow-100 text-yellow-800",
  departed: "bg-blue-100 text-blue-800",
  arrived: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

// Flight form schema
const flightFormSchema = z.object({
  flightNumber: z.string().min(2, "Flight number is required"),
  airline: z.string().min(2, "Airline is required"),
  origin: z.string().min(2, "Origin is required"),
  destination: z.string().min(2, "Destination is required"),
  departureDate: z.string().min(1, "Departure date is required"),
  departureTime: z.string().min(1, "Departure time is required"),
  gateId: z.number().nullable(),
  status: z.enum(["scheduled", "delayed", "departed", "arrived", "cancelled"]),
});

export default function Flights() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;
  
  // Set up form for adding flights
  const addForm = useForm<FlightFormInput>({
    resolver: zodResolver(flightFormSchema),
    defaultValues: {
      flightNumber: "",
      airline: "",
      origin: "",
      destination: "",
      departureDate: new Date().toISOString().split("T")[0],
      departureTime: "12:00",
      gateId: null,
      status: "scheduled",
    },
  });
  
  // Set up form for editing flights
  const editForm = useForm<FlightFormInput>({
    resolver: zodResolver(flightFormSchema),
    defaultValues: {
      flightNumber: "",
      airline: "",
      origin: "",
      destination: "",
      departureDate: "",
      departureTime: "",
      gateId: null,
      status: "scheduled",
    },
  });
  
  // Fetch flights
  const { data: flightsData, isLoading: isLoadingFlights } = useQuery<{ data: Flight[], total: number }>({
    queryKey: ["/api/flights", (currentPage - 1) * pageSize, pageSize, searchQuery],
    queryFn: async ({ queryKey }) => {
      const [_, offset, limit, search] = queryKey;
      const url = `/api/flights?offset=${offset}&limit=${limit}${search ? `&search=${search}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch flights");
      return res.json();
    },
  });
  
  // Fetch available gates for dropdown
  const { data: gatesData } = useQuery<Gate[]>({
    queryKey: ["/api/gates/available"],
  });
  
  // Mutation for adding a flight
  const addFlightMutation = useMutation({
    mutationFn: async (data: FlightFormInput) => {
      const response = await apiRequest("POST", "/api/flights", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flights"] });
      setIsAddModalOpen(false);
      addForm.reset();
      toast({
        title: "Flight Added",
        description: "The flight has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add flight",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating a flight
  const updateFlightMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FlightFormInput }) => {
      const response = await apiRequest("PUT", `/api/flights/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flights"] });
      setIsEditModalOpen(false);
      setSelectedFlight(null);
      toast({
        title: "Flight Updated",
        description: "The flight has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update flight",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting a flight
  const deleteFlightMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/flights/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flights"] });
      setIsDeleteDialogOpen(false);
      setSelectedFlight(null);
      toast({
        title: "Flight Deleted",
        description: "The flight has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete flight",
        variant: "destructive",
      });
    },
  });
  
  // Handle add flight form submission
  const onAddSubmit = (data: FlightFormInput) => {
    addFlightMutation.mutate(data);
  };
  
  // Handle edit flight form submission
  const onEditSubmit = (data: FlightFormInput) => {
    if (selectedFlight) {
      updateFlightMutation.mutate({ id: selectedFlight.id, data });
    }
  };
  
  // Handle delete flight
  const handleDelete = () => {
    if (selectedFlight) {
      deleteFlightMutation.mutate(selectedFlight.id);
    }
  };
  
  // Open edit modal with flight data
  const openEditModal = (flight: Flight) => {
    setSelectedFlight(flight);
    editForm.reset({
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      origin: flight.origin,
      destination: flight.destination,
      departureDate: flight.departureDate,
      departureTime: flight.departureTime,
      gateId: flight.gateId,
      status: flight.status,
    });
    setIsEditModalOpen(true);
  };
  
  // Open delete dialog
  const openDeleteDialog = (flight: Flight) => {
    setSelectedFlight(flight);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    const formData = new FormData(e.currentTarget);
    setSearchQuery(formData.get("search") as string);
  };

  return (
    <AppLayout>
      <section className="mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Plane className="mr-2 h-5 w-5" />
              Flight Management
            </CardTitle>
            <div className="flex items-center space-x-2">
              <form onSubmit={handleSearch} className="flex items-center mr-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search"
                    name="search"
                    placeholder="Search flights..."
                    className="pl-10 w-[200px] lg:w-[300px]"
                    defaultValue={searchQuery}
                  />
                </div>
                <Button type="submit" className="ml-2" variant="secondary">Search</Button>
              </form>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Flight
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  header: "Flight No.",
                  accessorKey: "flightNumber",
                  cell: (item) => (
                    <div className="font-medium">{item.flightNumber}</div>
                  ),
                },
                {
                  header: "Airline",
                  accessorKey: "airline",
                },
                {
                  header: "Origin",
                  accessorKey: "origin",
                },
                {
                  header: "Destination",
                  accessorKey: "destination",
                },
                {
                  header: "Date",
                  accessorKey: "departureDate",
                },
                {
                  header: "Time",
                  accessorKey: "departureTime",
                  cell: (item) => (
                    <div>{item.departureTime.slice(0, 5)}</div>
                  ),
                },
                {
                  header: "Gate",
                  accessorKey: "gateId",
                  cell: (item) => (
                    <div>{item.gateId || "-"}</div>
                  ),
                },
                {
                  header: "Status",
                  accessorKey: "status",
                  cell: (item) => (
                    <Badge className={STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || ""}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  ),
                },
                {
                  header: "Actions",
                  accessorKey: "id",
                  cell: (item) => (
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(item);
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(item);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={flightsData?.data || []}
              isLoading={isLoadingFlights}
              totalItems={flightsData?.total || 0}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </section>
      
      {/* Add Flight Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Flight</DialogTitle>
            <DialogDescription>
              Enter the details of the new flight below
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="flightNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flight Number</FormLabel>
                      <FormControl>
                        <Input placeholder="AA1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="airline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Airline</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select airline" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="American Airlines">American Airlines</SelectItem>
                            <SelectItem value="Delta Airlines">Delta Airlines</SelectItem>
                            <SelectItem value="United Airlines">United Airlines</SelectItem>
                            <SelectItem value="British Airways">British Airways</SelectItem>
                            <SelectItem value="Lufthansa">Lufthansa</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin</FormLabel>
                      <FormControl>
                        <Input placeholder="New York (JFK)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <Input placeholder="Los Angeles (LAX)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="departureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="departureTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="gateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gate</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "no-gate" ? null : parseInt(value))}
                          value={field.value?.toString() || "no-gate"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-gate">No Gate</SelectItem>
                            {gatesData?.map((gate) => (
                              <SelectItem key={gate.id} value={gate.id.toString()}>
                                {gate.gateNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="delayed">Delayed</SelectItem>
                            <SelectItem value="departed">Departed</SelectItem>
                            <SelectItem value="arrived">Arrived</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addFlightMutation.isPending}>
                  {addFlightMutation.isPending ? "Adding..." : "Add Flight"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Flight Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Flight</DialogTitle>
            <DialogDescription>
              Update the flight details below
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="flightNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flight Number</FormLabel>
                      <FormControl>
                        <Input placeholder="AA1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="airline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Airline</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select airline" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="American Airlines">American Airlines</SelectItem>
                            <SelectItem value="Delta Airlines">Delta Airlines</SelectItem>
                            <SelectItem value="United Airlines">United Airlines</SelectItem>
                            <SelectItem value="British Airways">British Airways</SelectItem>
                            <SelectItem value="Lufthansa">Lufthansa</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin</FormLabel>
                      <FormControl>
                        <Input placeholder="New York (JFK)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <Input placeholder="Los Angeles (LAX)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="departureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="departureTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="gateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gate</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "no-gate" ? null : parseInt(value))}
                          value={field.value?.toString() || "no-gate"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-gate">No Gate</SelectItem>
                            {gatesData?.map((gate) => (
                              <SelectItem key={gate.id} value={gate.id.toString()}>
                                {gate.gateNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="delayed">Delayed</SelectItem>
                            <SelectItem value="departed">Departed</SelectItem>
                            <SelectItem value="arrived">Arrived</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateFlightMutation.isPending}>
                  {updateFlightMutation.isPending ? "Updating..." : "Update Flight"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the flight{" "}
              <strong>{selectedFlight?.flightNumber}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteFlightMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFlightMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}