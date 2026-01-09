
import { useState } from 'react';
import { useVendorManagement } from '@/hooks/useVendorManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  Search, 
  Package, 
  DollarSign, 
  ShoppingCart, 
  Ticket, 
  TrendingUp,
  Boxes,
  Store,
  Users,
  MapPin,
  Star,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const VendorManagement = () => {
  const { 
    vendors, 
    selectedVendor, 
    loading, 
    detailsLoading, 
    selectVendorQuick,
    clearSelectedVendor 
  } = useVendorManagement();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVendors = vendors.filter(vendor =>
    vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.templeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedVendor) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={clearSelectedVendor} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Vendors List
        </Button>

        {detailsLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <>
            {/* Vendor Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedVendor.businessName}</CardTitle>
                    <CardDescription className="mt-1">
                      Temple: {selectedVendor.templeName} | Email: {selectedVendor.email}
                      {selectedVendor.phone && ` | Phone: ${selectedVendor.phone}`}
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="text-sm">
                    {selectedVendor.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Joined: {format(new Date(selectedVendor.createdAt), 'PPP')}
                </p>
              </CardHeader>
            </Card>

            {/* Temple Information Card */}
            {selectedVendor.temple ? (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    Vendor's Temple
                  </CardTitle>
                  <CardDescription>Temple created and managed by this vendor</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6">
                    {selectedVendor.temple.imageUrl && (
                      <img 
                        src={selectedVendor.temple.imageUrl} 
                        alt={selectedVendor.temple.name}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold">{selectedVendor.temple.name}</h3>
                        <p className="text-sm text-muted-foreground">Deity: {selectedVendor.temple.deity}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {selectedVendor.temple.district}, {selectedVendor.temple.province}, {selectedVendor.temple.country}
                      </div>
                      <div className="flex items-center gap-4">
                        {selectedVendor.temple.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">{selectedVendor.temple.rating.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">
                              ({selectedVendor.temple.reviewCount || 0} reviews)
                            </span>
                          </div>
                        )}
                        <Badge variant={selectedVendor.temple.isActive ? "default" : "secondary"} className="gap-1">
                          {selectedVendor.temple.isActive ? (
                            <><CheckCircle className="h-3 w-3" /> Active</>
                          ) : (
                            <><XCircle className="h-3 w-3" /> Inactive</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No temple created by this vendor yet</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Products</p>
                      <p className="text-2xl font-bold">{selectedVendor.stats.totalProducts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-accent/10">
                      <Boxes className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Variants / Stock</p>
                      <p className="text-2xl font-bold">{selectedVendor.stats.totalVariants} / {selectedVendor.stats.totalStock}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-500/10">
                      <ShoppingCart className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sales</p>
                      <p className="text-2xl font-bold">{selectedVendor.stats.totalSales}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-yellow-500/10">
                      <DollarSign className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">${selectedVendor.stats.totalRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-purple-500/10">
                      <Ticket className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Temple Bookings</p>
                      <p className="text-2xl font-bold">{selectedVendor.stats.totalBookings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-orange-500/10">
                      <TrendingUp className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Orders</p>
                      <p className="text-2xl font-bold">{selectedVendor.stats.pendingOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-emerald-500/10">
                      <ShoppingCart className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed Orders</p>
                      <p className="text-2xl font-bold">{selectedVendor.stats.completedOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <Store className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Temple ID</p>
                      <p className="text-sm font-mono truncate max-w-[120px]" title={selectedVendor.templeId || 'N/A'}>
                        {selectedVendor.templeId ? selectedVendor.templeId.slice(0, 8) + '...' : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Monthly Sales Line Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Sales Trend</CardTitle>
                  <CardDescription>Sales and revenue over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={selectedVendor.monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="sales" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Sales"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        name="Revenue ($)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue</CardTitle>
                  <CardDescription>Revenue breakdown by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={selectedVendor.monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Product Categories Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Categories</CardTitle>
                  <CardDescription>Distribution of products by category</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedVendor.productCategories.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={selectedVendor.productCategories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="category"
                        >
                          {selectedVendor.productCategories.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No products found
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Status Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Status Distribution</CardTitle>
                  <CardDescription>Breakdown of orders by status</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedVendor.orderStatuses.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={selectedVendor.orderStatuses}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="status"
                        >
                          {selectedVendor.orderStatuses.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No orders found
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Vendor Management
              </CardTitle>
              <CardDescription>
                View and manage all approved vendors with detailed analytics
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? 'No vendors match your search.' : 'No approved vendors found.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Temple Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Products</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.businessName}</TableCell>
                    <TableCell>{vendor.templeName}</TableCell>
                    <TableCell className="text-muted-foreground">{vendor.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{vendor.totalProducts}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${vendor.totalRevenue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(vendor.createdAt), 'PP')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => selectVendorQuick(vendor)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorManagement;