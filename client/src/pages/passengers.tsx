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
import { Checkbox } from "@/components/ui/checkbox";
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
  FormDescription,
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
import { Users, Search, Plus, CheckCircle, XCircle } from "lucide-react";
import type { Passenger, PassengerFormInput, Flight } from "@/lib/api-types";
import { insertPassengerSchema } from "@shared/schema";

// Passenger form schema
const passengerFormSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  flightId: z.number().nullable(),
  seatNumber: z.string().nullable(),
  checkedIn: z.boolean().default(false),
});

export default function Passengers() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFlightId, setSelectedFlightId] = useState<number | null>(null);
  const pageSize = 10;
  
  // Set up form for adding passengers
  const addForm = useForm<PassengerFormInput>({
    resolver: zodResolver(passengerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      flightId: null,
      seatNumber: "",
      checkedIn: false,
    },
  });
  
  // Set up form for editing passengers
  const editForm = useForm<PassengerFormInput>({
    resolver: zodResolver(passengerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      flightId: null,
      seatNumber: "",
      checkedIn: false,
    },
  });
  
  // Fetch passengers
  const { data: passengersData, isLoading: isLoadingPassengers } = useQuery<{ data: Passenger[], total: number }>({
    queryKey: ["/api/passengers", (currentPage - 1) * pageSize, pageSize, selectedFlightId],
    queryFn: async ({ queryKey }) => {
      const [_, offset, limit, flightId] = queryKey;
      const url = `/api/passengers?offset=${offset}&limit=${limit}${flightId ? `&flightId=${flightId}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch passengers");
      return res.json();
    },
  });
  
  // Fetch flights for dropdown
  const { data: flightsData } = useQuery<{ data: Flight[], total: number }>({
    queryKey: ["/api/flights", 0, 100],
    queryFn: async () => {
      const res = await fetch("/api/flights?offset=0&limit=100");
      if (!res.ok) throw new Error("Failed to fetch flights");
      return res.json();
    },
  });
  
  // Mutation for adding a passenger
  const addPassengerMutation = useMutation({
    mutationFn: async (data: PassengerFormInput) => {
      const response = await apiRequest("POST", "/api/passengers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passengers"] });
      setIsAddModalOpen(false);
      addForm.reset();
      toast({
        title: "Passenger Added",
        description: "The passenger has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add passenger",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating a passenger
  const updatePassengerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PassengerFormInput }) => {
      const response = await apiRequest("PUT", `/api/passengers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passengers"] });
      setIsEditModalOpen(false);
      setSelectedPassenger(null);
      toast({
        title: "Passenger Updated",
        description: "The passenger has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update passenger",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting a passenger
  const deletePassengerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/passengers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passengers"] });
      setIsDeleteDialogOpen(false);
      setSelectedPassenger(null);
      toast({
        title: "Passenger Deleted",
        description: "The passenger has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete passenger",
        variant: "destructive",
      });
    },
  });
  
  // Handle add passenger form submission
  const onAddSubmit = (data: PassengerFormInput) => {
    addPassengerMutation.mutate(data);
  };
  
  // Handle edit passenger form submission
  const onEditSubmit = (data: PassengerFormInput) => {
    if (selectedPassenger) {
      updatePassengerMutation.mutate({ id: selectedPassenger.id, data });
    }
  };
  
  // Handle delete passenger
  const handleDelete = () => {
    if (selectedPassenger) {
      deletePassengerMutation.mutate(selectedPassenger.id);
    }
  };
  
  // Open edit modal with passenger data
  const openEditModal = (passenger: Passenger) => {
    setSelectedPassenger(passenger);
    editForm.reset({
      firstName: passenger.firstName,
      lastName: passenger.lastName,
      email: passenger.email,
      flightId: passenger.flightId,
      seatNumber: passenger.seatNumber,
      checkedIn: passenger.checkedIn,
    });
    setIsEditModalOpen(true);
  };
  
  // Open delete dialog
  const openDeleteDialog = (passenger: Passenger) => {
    setSelectedPassenger(passenger);
    setIsDeleteDialogOpen(true);
  };
  
  // Get flight number by ID
  const getFlightNumberById = (flightId: number | null) => {
    if (!flightId) return "-";
    const flight = flightsData?.data.find((f) => f.id === flightId);
    return flight ? flight.flightNumber : "-";
  };

  return (
    <AppLayout>
      <section className="mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Passenger Management
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select
                value={selectedFlightId?.toString() || "all-flights"}
                onValueChange={(value) => setSelectedFlightId(value === "all-flights" ? null : parseInt(value))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by flight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-flights">All Flights</SelectItem>
                  {flightsData?.data.map((flight) => (
                    <SelectItem key={flight.id} value={flight.id.toString()}>
                      {flight.flightNumber} ({flight.origin} → {flight.destination})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Passenger
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  header: "Name",
                  accessorKey: "firstName",
                  cell: (item) => (
                    <div className="font-medium">{item.firstName} {item.lastName}</div>
                  ),
                },
                {
                  header: "Email",
                  accessorKey: "email",
                },
                {
                  header: "Flight",
                  accessorKey: "flightId",
                  cell: (item) => (
                    <div>{getFlightNumberById(item.flightId)}</div>
                  ),
                },
                {
                  header: "Seat",
                  accessorKey: "seatNumber",
                  cell: (item) => (
                    <div>{item.seatNumber || "-"}</div>
                  ),
                },
                {
                  header: "Checked In",
                  accessorKey: "checkedIn",
                  cell: (item) => (
                    <div className="flex justify-center">
                      {item.checkedIn ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
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
              data={passengersData?.data || []}
              isLoading={isLoadingPassengers}
              totalItems={passengersData?.total || 0}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </section>
      
      {/* Add Passenger Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Passenger</DialogTitle>
            <DialogDescription>
              Enter the passenger details below
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="flightId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flight</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "no-flight" ? null : parseInt(value))}
                          value={field.value?.toString() || "no-flight"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select flight" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-flight">No Flight</SelectItem>
                            {flightsData?.data.map((flight) => (
                              <SelectItem key={flight.id} value={flight.id.toString()}>
                                {flight.flightNumber} ({flight.origin} → {flight.destination})
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
                  name="seatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seat Number</FormLabel>
                      <FormControl>
                        <Input placeholder="A12" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addForm.control}
                name="checkedIn"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Checked In</FormLabel>
                      <FormDescription>
                        Mark if the passenger has already checked in
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addPassengerMutation.isPending}>
                  {addPassengerMutation.isPending ? "Adding..." : "Add Passenger"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Passenger Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Passenger</DialogTitle>
            <DialogDescription>
              Update the passenger details below
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="flightId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flight</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "no-flight" ? null : parseInt(value))}
                          value={field.value?.toString() || "no-flight"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select flight" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-flight">No Flight</SelectItem>
                            {flightsData?.data.map((flight) => (
                              <SelectItem key={flight.id} value={flight.id.toString()}>
                                {flight.flightNumber} ({flight.origin} → {flight.destination})
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
                  name="seatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seat Number</FormLabel>
                      <FormControl>
                        <Input placeholder="A12" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="checkedIn"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Checked In</FormLabel>
                      <FormDescription>
                        Mark if the passenger has already checked in
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePassengerMutation.isPending}>
                  {updatePassengerMutation.isPending ? "Updating..." : "Update Passenger"}
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
              This will permanently delete the passenger{" "}
              <strong>{selectedPassenger?.firstName} {selectedPassenger?.lastName}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deletePassengerMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePassengerMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
