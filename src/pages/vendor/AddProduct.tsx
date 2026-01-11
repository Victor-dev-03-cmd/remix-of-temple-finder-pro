import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import ProductForm from '@/components/vendor/ProductForm';

const AddProduct = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/vendor/products')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Add New Product</h1>
            <p className="text-muted-foreground">Create a new product listing for your temple</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <ProductForm 
            onSuccess={() => navigate('/vendor/products')} 
            onCancel={() => navigate('/vendor/products')}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddProduct;
