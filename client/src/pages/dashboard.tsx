import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/layout/app-layout";
import { StatCard } from "@/components/ui/stat-card";
import { ChartCard } from "@/components/ui/chart-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
  PieChart, Pie, Cell, Sector
} from "recharts";
import {
  LayoutDashboard,
  Users,
  Clock,
  DoorOpen,
  Plus,
  Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  OverviewStats,
  FlightStatusDistribution,
  PassengersPerFlight,
  DailyFlightTraffic,
  EmployeeRoleCount,
  Flight
} from "@/lib/api-types";

// Chart colors based on shadcn color variables
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Status colors
const STATUS_COLORS = {
  scheduled: "bg-green-100 text-green-800",
  delayed: "bg-yellow-100 text-yellow-800",
  departed: "bg-blue-100 text-blue-800",
  arrived: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

// Gate status colors
const GATE_COLORS = {
  available: "bg-gray-100 text-gray-800",
  occupied: "bg-green-100 text-green-700",
  maintenance: "bg-yellow-100 text-yellow-700",
  closed: "bg-red-100 text-red-800",
};

export default function Dashboard() {
  const [flightStatusPeriod, setFlightStatusPeriod] = useState("today");
  const [passengersFilter, setPassengersFilter] = useState("top10");
  const [trafficPeriod, setTrafficPeriod] = useState("7days");
  
  // Fetch overview statistics
  const { data: overviewStats, isLoading: isLoadingStats } = useQuery<OverviewStats>({
    queryKey: ["/api/stats/overview"],
  });
  
  // Fetch flight status distribution
  const { data: flightStatus } = useQuery<FlightStatusDistribution[]>({
    queryKey: ["/api/stats/flights-status"],
  });
  
  // Fetch passengers per flight
  const { data: passengersPerFlight } = useQuery<PassengersPerFlight[]>({
    queryKey: ["/api/stats/passengers-per-flight"],
  });
  
  // Fetch daily flight traffic
  const { data: dailyTraffic } = useQuery<DailyFlightTraffic[]>({
    queryKey: ["/api/stats/daily-traffic", trafficPeriod === "7days" ? 7 : trafficPeriod === "30days" ? 30 : 90],
    queryFn: async ({ queryKey }) => {
      const days = queryKey[1] as number;
      const res = await fetch(`/api/stats/daily-traffic?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch daily traffic");
      return res.json();
    },
  });
  
  // Fetch employee role counts
  const { data: employeeRoles } = useQuery<EmployeeRoleCount[]>({
    queryKey: ["/api/stats/employees-role-count"],
  });
  
  // Fetch recent flights
  const { data: recentFlights, isLoading: isLoadingFlights } = useQuery<{ data: Flight[], total: number }>({
    queryKey: ["/api/flights", 0, 5],
    queryFn: async () => {
      const res = await fetch("/api/flights?offset=0&limit=5");
      if (!res.ok) throw new Error("Failed to fetch flights");
      return res.json();
    },
  });
  
  // Format flight status data for chart
  const flightStatusData = flightStatus || [];
  
  // Format passengers per flight data for chart
  const passengersData = passengersPerFlight || [];
  const limitedPassengersData = passengersFilter === "top10" 
    ? [...passengersData].sort((a, b) => b.passengerCount - a.passengerCount).slice(0, 10)
    : passengersData;
  
  // Format daily traffic data for chart
  const trafficData = dailyTraffic || [];
  
  // Format employee roles data for chart
  const rolesData = employeeRoles || [];
  
  // Humanize role names
  const humanizeRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Format the date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  return (
    <AppLayout>
      {/* Stats Overview */}
      <section className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Flights"
            value={isLoadingStats ? "Loading..." : overviewStats?.flightsToday || 0}
            icon={LayoutDashboard}
            trend={{ value: "8.5%", positive: true, label: "vs. yesterday" }}
            iconClassName="bg-blue-100 text-blue-600"
          />
          
          <StatCard
            title="Total Passengers"
            value={isLoadingStats ? "Loading..." : overviewStats?.totalPassengers || 0}
            icon={Users}
            trend={{ value: "12.3%", positive: true, label: "vs. yesterday" }}
            iconClassName="bg-green-100 text-green-600"
          />
          
          <StatCard
            title="On-time Percentage"
            value={isLoadingStats ? "Loading..." : `${overviewStats?.onTimePercentage || 0}%`}
            icon={Clock}
            trend={{ value: "3.2%", positive: false, label: "vs. yesterday" }}
            iconClassName="bg-yellow-100 text-yellow-600"
          />
          
          <StatCard
            title="Active Gates"
            value={isLoadingStats ? "Loading..." : overviewStats?.activeGates || "0/0"}
            icon={DoorOpen}
            trend={{ value: "2 gates", positive: true, label: "vs. yesterday" }}
            iconClassName="bg-purple-100 text-purple-600"
          />
        </div>
      </section>
      
      {/* Charts Section */}
      <section className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Flight Status Distribution"
          filter={{
            value: flightStatusPeriod,
            options: [
              { value: "today", label: "Today" },
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
            ],
            onChange: setFlightStatusPeriod,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={flightStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="status"
              >
                {flightStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        
        <ChartCard
          title="Passengers Per Flight"
          filter={{
            value: passengersFilter,
            options: [
              { value: "top10", label: "Top 10" },
              { value: "all", label: "All Flights" },
            ],
            onChange: setPassengersFilter,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={limitedPassengersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="flightNumber" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="passengerCount" fill={CHART_COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
      
      {/* Additional Charts Section */}
      <section className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Daily Flight Traffic"
          filter={{
            value: trafficPeriod,
            options: [
              { value: "7days", label: "Last 7 Days" },
              { value: "30days", label: "Last 30 Days" },
              { value: "90days", label: "Last 90 Days" },
            ],
            onChange: setTrafficPeriod,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(dateStr) => formatDate(dateStr)}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="arrivals" 
                stroke={CHART_COLORS[0]} 
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="departures" 
                stroke={CHART_COLORS[1]} 
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        
        <ChartCard
          title="Employees by Role"
          action={
            <Link href="/employees">
              <Button variant="link" size="sm">View All</Button>
            </Link>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rolesData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="role"
                label={({ role }) => humanizeRole(role)}
              >
                {rolesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, humanizeRole(name as string)]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
      
      {/* Recent Flights Table */}
      <section className="mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Flights</CardTitle>
            <Link href="/flights">
              <Button variant="link" size="sm">View All Flights</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
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
                  header: "Origin",
                  accessorKey: "origin",
                },
                {
                  header: "Destination",
                  accessorKey: "destination",
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
                      <Link href={`/flights/${item.id}/edit`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="text-destructive">Delete</Button>
                    </div>
                  ),
                },
              ]}
              data={recentFlights?.data || []}
              isLoading={isLoadingFlights}
              totalItems={recentFlights?.total || 0}
              pageSize={5}
              currentPage={1}
              onRowClick={(flight) => {
                console.log("Flight clicked:", flight);
              }}
            />
          </CardContent>
        </Card>
      </section>
      
      {/* Gate Utilization Section */}
      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Gate Utilization</CardTitle>
            <Link href="/gates">
              <Button variant="link" size="sm">View All Gates</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* These would come from the API in a real implementation */}
              <Card className={GATE_COLORS.occupied}>
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold">A1</div>
                  <div className="text-sm">Occupied</div>
                  <div className="mt-1 text-xs">UA2134</div>
                </CardContent>
              </Card>
              
              <Card className={GATE_COLORS.occupied}>
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold">A2</div>
                  <div className="text-sm">Occupied</div>
                  <div className="mt-1 text-xs">DL5432</div>
                </CardContent>
              </Card>
              
              <Card className={GATE_COLORS.available}>
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold">A3</div>
                  <div className="text-sm">Available</div>
                  <div className="mt-1 text-xs">-</div>
                </CardContent>
              </Card>
              
              <Card className={GATE_COLORS.maintenance}>
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold">B1</div>
                  <div className="text-sm">Maintenance</div>
                  <div className="mt-1 text-xs">1hr left</div>
                </CardContent>
              </Card>
              
              <Card className={GATE_COLORS.occupied}>
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold">B2</div>
                  <div className="text-sm">Occupied</div>
                  <div className="mt-1 text-xs">AA1098</div>
                </CardContent>
              </Card>
              
              <Card className={GATE_COLORS.available}>
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold">B3</div>
                  <div className="text-sm">Available</div>
                  <div className="mt-1 text-xs">-</div>
                </CardContent>
              </Card>
              
              <Card className={GATE_COLORS.occupied}>
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold">C1</div>
                  <div className="text-sm">Occupied</div>
                  <div className="mt-1 text-xs">BA7654</div>
                </CardContent>
              </Card>
              
              <Card className={GATE_COLORS.occupied}>
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold">C2</div>
                  <div className="text-sm">Occupied</div>
                  <div className="mt-1 text-xs">LH9012</div>
                </CardContent>
              </Card>
              
              <Card className={GATE_COLORS.occupied}>
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold">C3</div>
                  <div className="text-sm">Occupied</div>
                  <div className="mt-1 text-xs">EK3210</div>
                </CardContent>
              </Card>
              
              <Card className={GATE_COLORS.closed}>
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold">D1</div>
                  <div className="text-sm">Closed</div>
                  <div className="mt-1 text-xs">Construction</div>
                </CardContent>
              </Card>
              
              <Card className={GATE_COLORS.available}>
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold">D2</div>
                  <div className="text-sm">Available</div>
                  <div className="mt-1 text-xs">-</div>
                </CardContent>
              </Card>
              
              <Card className={GATE_COLORS.available}>
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold">D3</div>
                  <div className="text-sm">Available</div>
                  <div className="mt-1 text-xs">-</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}
