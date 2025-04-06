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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DoorOpen, Plus, Check, X } from "lucide-react";
import type { Gate, GateFormInput, Flight } from "@/lib/api-types";
import { insertGateSchema } from "@shared/schema";

// Status colors for gates
const STATUS_COLORS = {
  available: "bg-gray-100 text-gray-800",
  occupied: "bg-green-100 text-green-700",
  maintenance: "bg-yellow-100 text-yellow-700",
  closed: "bg-red-100 text-red-800",
};

// Gate form schema
const gateFormSchema = z.object({
  gateNumber: z.string().min(1, "Gate number is required"),
  terminal: z.string().min(1, "Terminal is required"),
  status: z.enum(["available", "occupied", "maintenance", "closed"]),
  currentFlightId: z.number().nullable(),
});

export default function Gates() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Set up form for adding gates
  const addForm = useForm<GateFormInput>({
    resolver: zodResolver(gateFormSchema),
    defaultValues: {
      gateNumber: "",
      terminal: "",
      status: "available",
      currentFlightId: null,
    },
  });
  
  // Set up form for editing gates
  const editForm = useForm<GateFormInput>({
    resolver: zodResolver(gateFormSchema),
    defaultValues: {
      gateNumber: "",
      terminal: "",
      status: "available",
      currentFlightId: null,
    },
  });
  
  // Fetch gates
  const { data: gatesData, isLoading: isLoadingGates } = useQuery<{ data: Gate[], total: number }>({
    queryKey: ["/api/gates", (currentPage - 1) * pageSize, pageSize],
    queryFn: async ({ queryKey }) => {
      const [_, offset, limit] = queryKey;
      const url = `/api/gates?offset=${offset}&limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch gates");
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
  
  // Mutation for adding a gate
  const addGateMutation = useMutation({
    mutationFn: async (data: GateFormInput) => {
      const response = await apiRequest("POST", "/api/gates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gates"] });
      setIsAddModalOpen(false);
      addForm.reset();
      toast({
        title: "Gate Added",
        description: "The gate has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add gate",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating a gate
  const updateGateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: GateFormInput }) => {
      const response = await apiRequest("PUT", `/api/gates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gates"] });
      setIsEditModalOpen(false);
      setSelectedGate(null);
      toast({
        title: "Gate Updated",
        description: "The gate has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update gate",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting a gate
  const deleteGateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/gates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gates"] });
      setIsDeleteDialogOpen(false);
      setSelectedGate(null);
      toast({
        title: "Gate Deleted",
        description: "The gate has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete gate",
        variant: "destructive",
      });
    },
  });
  
  // Handle add gate form submission
  const onAddSubmit = (data: GateFormInput) => {
    addGateMutation.mutate(data);
  };
  
  // Handle edit gate form submission
  const onEditSubmit = (data: GateFormInput) => {
    if (selectedGate) {
      updateGateMutation.mutate({ id: selectedGate.id, data });
    }
  };
  
  // Handle delete gate
  const handleDelete = () => {
    if (selectedGate) {
      deleteGateMutation.mutate(selectedGate.id);
    }
  };
  
  // Open edit modal with gate data
  const openEditModal = (gate: Gate) => {
    setSelectedGate(gate);
    editForm.reset({
      gateNumber: gate.gateNumber,
      terminal: gate.terminal,
      status: gate.status,
      currentFlightId: gate.currentFlightId,
    });
    setIsEditModalOpen(true);
  };
  
  // Open delete dialog
  const openDeleteDialog = (gate: Gate) => {
    setSelectedGate(gate);
    setIsDeleteDialogOpen(true);
  };
  
  // Get flight number by ID
  const getFlightNumberById = (flightId: number | null) => {
    if (!flightId) return "-";
    const flight = flightsData?.data.find((f) => f.id === flightId);
    return flight ? flight.flightNumber : "-";
  };
  
  // Format status for display
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <AppLayout>
      {/* Data table with list view */}
      <section className="mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <DoorOpen className="mr-2 h-5 w-5" />
              Gate Management
            </CardTitle>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Gate
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  header: "Gate",
                  accessorKey: "gateNumber",
                  cell: (item) => (
                    <div className="font-medium">{item.gateNumber}</div>
                  ),
                },
                {
                  header: "Terminal",
                  accessorKey: "terminal",
                },
                {
                  header: "Status",
                  accessorKey: "status",
                  cell: (item) => (
                    <Badge className={STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || ""}>
                      {formatStatus(item.status)}
                    </Badge>
                  ),
                },
                {
                  header: "Current Flight",
                  accessorKey: "currentFlightId",
                  cell: (item) => (
                    <div>{getFlightNumberById(item.currentFlightId)}</div>
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
              data={gatesData?.data || []}
              isLoading={isLoadingGates}
              totalItems={gatesData?.total || 0}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </section>
      
      {/* Gate Utilization Grid */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Gate Utilization</CardTitle>
            <CardDescription>Visual overview of gate status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {gatesData?.data.map((gate) => (
                <Card key={gate.id} className={STATUS_COLORS[gate.status as keyof typeof STATUS_COLORS]}>
                  <CardContent className="p-3 text-center">
                    <div className="text-xl font-bold">{gate.gateNumber}</div>
                    <div className="text-sm">{formatStatus(gate.status)}</div>
                    <div className="mt-1 text-xs">
                      {gate.currentFlightId 
                        ? getFlightNumberById(gate.currentFlightId)
                        : "-"}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {isLoadingGates && (
                Array(12).fill(0).map((_, index) => (
                  <Card key={index} className="bg-gray-100">
                    <CardContent className="p-3 text-center">
                      <div className="text-xl font-bold bg-gray-200 h-7 rounded animate-pulse"></div>
                      <div className="text-sm bg-gray-200 h-5 rounded mt-1 animate-pulse"></div>
                      <div className="mt-1 text-xs bg-gray-200 h-4 rounded animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))
              )}
              
              {!isLoadingGates && gatesData?.data.length === 0 && (
                <div className="col-span-full text-center p-4">
                  No gates available. Add a gate to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* Add Gate Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Gate</DialogTitle>
            <DialogDescription>
              Enter the gate details below
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="gateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gate Number</FormLabel>
                      <FormControl>
                        <Input placeholder="A1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="terminal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terminal</FormLabel>
                      <FormControl>
                        <Input placeholder="A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="currentFlightId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Flight</FormLabel>
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
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addGateMutation.isPending}>
                  {addGateMutation.isPending ? "Adding..." : "Add Gate"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Gate Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Gate</DialogTitle>
            <DialogDescription>
              Update the gate details below
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="gateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gate Number</FormLabel>
                      <FormControl>
                        <Input placeholder="A1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="terminal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terminal</FormLabel>
                      <FormControl>
                        <Input placeholder="A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="currentFlightId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Flight</FormLabel>
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
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateGateMutation.isPending}>
                  {updateGateMutation.isPending ? "Updating..." : "Update Gate"}
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
              This will permanently delete gate{" "}
              <strong>{selectedGate?.gateNumber}</strong> in Terminal{" "}
              <strong>{selectedGate?.terminal}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteGateMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteGateMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
