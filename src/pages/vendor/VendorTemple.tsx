import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, MapPin, ExternalLink, Package, Loader2, Edit } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useVendorTemple } from '@/hooks/useVendorTemple';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VendorTempleForm from '@/components/vendor/VendorTempleForm';

const VendorTemple = () => {
  const { user } = useAuth();
  const { temple, application, loading, refetch } = useVendorTemple(user?.id);
  const { products } = useProducts({ vendorId: user?.id, status: 'approved' });
  const [isEditing, setIsEditing] = useState(false);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!temple) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Temple</h1>
            <p className="text-muted-foreground">Create your temple to start selling products</p>
          </div>
          
          <VendorTempleForm 
            onSuccess={refetch} 
            businessName={application?.business_name}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (isEditing) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Temple</h1>
            <p className="text-muted-foreground">Update your temple information</p>
          </div>
          
          <VendorTempleForm 
            onSuccess={() => {
              setIsEditing(false);
              refetch();
            }}
            onCancel={() => setIsEditing(false)}
            temple={temple}
            isEditing
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Temple</h1>
            <p className="text-muted-foreground">Manage your temple and products</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Temple
            </Button>
            <Link to={`/temples/${temple.id}`}>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Public Page
              </Button>
            </Link>
          </div>
        </div>

        {/* Temple Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-3 gap-0">
              {/* Temple Image */}
              <div className="relative h-48 md:h-full md:min-h-[200px] bg-muted">
                {temple.image_url ? (
                  <img
                    src={temple.image_url}
                    alt={temple.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Building className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Temple Details */}
              <div className="md:col-span-2 p-6">
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{temple.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" />
                        {temple.district}, {temple.province}
                      </CardDescription>
                    </div>
                    <Badge className="bg-success/10 text-success">Active</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {temple.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {temple.description}
                    </p>
                  )}
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Stats */}
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span className="text-sm">Products Listed</span>
                      </div>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {products.length}
                      </p>
                    </div>
                    
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building className="h-4 w-4" />
                        <span className="text-sm">Business Name</span>
                      </div>
                      <p className="mt-1 text-lg font-semibold text-foreground truncate">
                        {application?.business_name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/vendor/products">
                      <Button className="gap-2">
                        <Package className="h-4 w-4" />
                        Manage Products
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold text-foreground">{products.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <Building className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Temple Status</p>
                    <p className="text-lg font-semibold text-success">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                    <MapPin className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="text-sm font-medium text-foreground truncate">{temple.district}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VendorTemple;
