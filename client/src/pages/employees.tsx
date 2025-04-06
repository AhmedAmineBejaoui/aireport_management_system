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
import { UserRound, Search, Plus, Briefcase } from "lucide-react";
import type { Employee, EmployeeFormInput, Flight, Gate } from "@/lib/api-types";
import { insertEmployeeSchema } from "@shared/schema";

// Role colors for badges
const ROLE_COLORS = {
  pilot: "bg-blue-100 text-blue-800",
  flight_attendant: "bg-purple-100 text-purple-800",
  gate_agent: "bg-green-100 text-green-800",
  ground_staff: "bg-yellow-100 text-yellow-800",
  security: "bg-red-100 text-red-800",
  administration: "bg-gray-100 text-gray-800",
};

// Employee form schema
const employeeFormSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().nullable(),
  role: z.enum(["pilot", "flight_attendant", "gate_agent", "ground_staff", "security", "administration"]),
  assignedFlightId: z.number().nullable(),
  assignedGateId: z.number().nullable(),
});

export default function Employees() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const pageSize = 10;
  
  // Set up form for adding employees
  const addForm = useForm<EmployeeFormInput>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "gate_agent",
      assignedFlightId: null,
      assignedGateId: null,
    },
  });
  
  // Set up form for editing employees
  const editForm = useForm<EmployeeFormInput>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "gate_agent",
      assignedFlightId: null,
      assignedGateId: null,
    },
  });
  
  // Fetch employees
  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery<{ data: Employee[], total: number }>({
    queryKey: ["/api/employees", (currentPage - 1) * pageSize, pageSize, selectedRole],
    queryFn: async ({ queryKey }) => {
      const [_, offset, limit, role] = queryKey;
      const url = `/api/employees?offset=${offset}&limit=${limit}${role ? `&role=${role}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch employees");
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
  
  // Fetch gates for dropdown
  const { data: gatesData } = useQuery<{ data: Gate[], total: number }>({
    queryKey: ["/api/gates", 0, 100],
    queryFn: async () => {
      const res = await fetch("/api/gates?offset=0&limit=100");
      if (!res.ok) throw new Error("Failed to fetch gates");
      return res.json();
    },
  });
  
  // Mutation for adding an employee
  const addEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormInput) => {
      const response = await apiRequest("POST", "/api/employees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsAddModalOpen(false);
      addForm.reset();
      toast({
        title: "Employee Added",
        description: "The employee has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add employee",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating an employee
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EmployeeFormInput }) => {
      const response = await apiRequest("PUT", `/api/employees/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
      toast({
        title: "Employee Updated",
        description: "The employee has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update employee",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting an employee
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
      toast({
        title: "Employee Deleted",
        description: "The employee has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete employee",
        variant: "destructive",
      });
    },
  });
  
  // Handle add employee form submission
  const onAddSubmit = (data: EmployeeFormInput) => {
    addEmployeeMutation.mutate(data);
  };
  
  // Handle edit employee form submission
  const onEditSubmit = (data: EmployeeFormInput) => {
    if (selectedEmployee) {
      updateEmployeeMutation.mutate({ id: selectedEmployee.id, data });
    }
  };
  
  // Handle delete employee
  const handleDelete = () => {
    if (selectedEmployee) {
      deleteEmployeeMutation.mutate(selectedEmployee.id);
    }
  };
  
  // Open edit modal with employee data
  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    editForm.reset({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      assignedFlightId: employee.assignedFlightId,
      assignedGateId: employee.assignedGateId,
    });
    setIsEditModalOpen(true);
  };
  
  // Open delete dialog
  const openDeleteDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };
  
  // Get flight number by ID
  const getFlightNumberById = (flightId: number | null) => {
    if (!flightId) return "-";
    const flight = flightsData?.data.find((f) => f.id === flightId);
    return flight ? flight.flightNumber : "-";
  };
  
  // Get gate number by ID
  const getGateNumberById = (gateId: number | null) => {
    if (!gateId) return "-";
    const gate = gatesData?.data.find((g) => g.id === gateId);
    return gate ? gate.gateNumber : "-";
  };
  
  // Format role for display
  const formatRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <AppLayout>
      <section className="mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <UserRound className="mr-2 h-5 w-5" />
              Employee Management
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select
                value={selectedRole || "all-roles"}
                onValueChange={(value) => setSelectedRole(value === "all-roles" ? null : value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-roles">All Roles</SelectItem>
                  <SelectItem value="pilot">Pilot</SelectItem>
                  <SelectItem value="flight_attendant">Flight Attendant</SelectItem>
                  <SelectItem value="gate_agent">Gate Agent</SelectItem>
                  <SelectItem value="ground_staff">Ground Staff</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="administration">Administration</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
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
                  header: "Phone",
                  accessorKey: "phone",
                  cell: (item) => (
                    <div>{item.phone || "-"}</div>
                  ),
                },
                {
                  header: "Role",
                  accessorKey: "role",
                  cell: (item) => (
                    <Badge className={ROLE_COLORS[item.role as keyof typeof ROLE_COLORS] || ""}>
                      {formatRole(item.role)}
                    </Badge>
                  ),
                },
                {
                  header: "Assigned Flight",
                  accessorKey: "assignedFlightId",
                  cell: (item) => (
                    <div>{getFlightNumberById(item.assignedFlightId)}</div>
                  ),
                },
                {
                  header: "Assigned Gate",
                  accessorKey: "assignedGateId",
                  cell: (item) => (
                    <div>{getGateNumberById(item.assignedGateId)}</div>
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
              data={employeesData?.data || []}
              isLoading={isLoadingEmployees}
              totalItems={employeesData?.total || 0}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </section>
      
      {/* Add Employee Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter the employee details below
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@airport.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="123-456-7890" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pilot">Pilot</SelectItem>
                          <SelectItem value="flight_attendant">Flight Attendant</SelectItem>
                          <SelectItem value="gate_agent">Gate Agent</SelectItem>
                          <SelectItem value="ground_staff">Ground Staff</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="administration">Administration</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="assignedFlightId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Flight</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "no-flight" ? null : parseInt(value))}
                          value={field.value?.toString() || "no-flight"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select flight" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-flight">No Assignment</SelectItem>
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
                  name="assignedGateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Gate</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "no-gate" ? null : parseInt(value))}
                          value={field.value?.toString() || "no-gate"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-gate">No Assignment</SelectItem>
                            {gatesData?.data.map((gate) => (
                              <SelectItem key={gate.id} value={gate.id.toString()}>
                                {gate.gateNumber} (Terminal {gate.terminal})
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
                <Button type="submit" disabled={addEmployeeMutation.isPending}>
                  {addEmployeeMutation.isPending ? "Adding..." : "Add Employee"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Employee Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update the employee details below
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@airport.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="123-456-7890" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pilot">Pilot</SelectItem>
                          <SelectItem value="flight_attendant">Flight Attendant</SelectItem>
                          <SelectItem value="gate_agent">Gate Agent</SelectItem>
                          <SelectItem value="ground_staff">Ground Staff</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="administration">Administration</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="assignedFlightId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Flight</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "no-flight" ? null : parseInt(value))}
                          value={field.value?.toString() || "no-flight"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select flight" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-flight">No Assignment</SelectItem>
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
                  name="assignedGateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Gate</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "no-gate" ? null : parseInt(value))}
                          value={field.value?.toString() || "no-gate"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-gate">No Assignment</SelectItem>
                            {gatesData?.data.map((gate) => (
                              <SelectItem key={gate.id} value={gate.id.toString()}>
                                {gate.gateNumber} (Terminal {gate.terminal})
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
                <Button type="submit" disabled={updateEmployeeMutation.isPending}>
                  {updateEmployeeMutation.isPending ? "Updating..." : "Update Employee"}
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
              This will permanently delete the employee{" "}
              <strong>{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteEmployeeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEmployeeMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
