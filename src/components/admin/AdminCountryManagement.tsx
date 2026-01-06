import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Ban, 
  CheckCircle, 
  Loader2,
  Search
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Country {
  country_code: string;
  country_name: string;
  currency_code: string;
  tax_name: string;
  tax_percentage: number;
  vendor_id_label: string;
  is_blocked: boolean;
}

const AdminCountryManagement = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [formData, setFormData] = useState<Partial<Country>>({
    country_code: "",
    country_name: "",
    currency_code: "",
    tax_name: "VAT",
    tax_percentage: 0,
    vendor_id_label: "Tax ID"
  });

  const fetchCountries = async () => {
    setLoading(true);
    const { data, error } = await (supabase
      .from("countries_config" as any)
      .select("*")
      .order("country_name", { ascending: true }) as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCountries(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  // Add அல்லது Edit மோடாலைத் திறக்க
  const handleOpenModal = (country?: Country) => {
    if (country) {
      setEditingCountry(country);
      setFormData(country);
    } else {
      setEditingCountry(null);
      setFormData({
        country_code: "",
        country_name: "",
        currency_code: "",
        tax_name: "VAT",
        tax_percentage: 0,
        vendor_id_label: "Tax ID"
      });
    }
    setIsModalOpen(true);
  };

  // தரவுகளைச் சேமிக்க (Insert or Update)
  const handleSaveCountry = async () => {
    if (!formData.country_code || !formData.country_name) {
      toast({ title: "Validation Error", description: "Code and Name are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await (supabase
      .from("countries_config" as any)
      .upsert({ 
        ...formData,
        country_code: formData.country_code?.toUpperCase() 
      } as any) as any);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Country saved successfully" });
      setIsModalOpen(false);
      fetchCountries();
    }
    setLoading(false);
  };

  const toggleBlock = async (code: string, currentStatus: boolean) => {
    const { error } = await (supabase
      .from("countries_config" as any)
      .update({ is_blocked: !currentStatus } as any)
      .eq("country_code", code) as any);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status Updated", description: `Country ${!currentStatus ? 'Blocked' : 'Unblocked'}` });
      fetchCountries();
    }
  };

  const deleteCountry = async (code: string) => {
    if (!confirm("Are you sure? This will remove the country and its settings.")) return;

    const { error } = await (supabase
      .from("countries_config" as any)
      .delete()
      .eq("country_code", code) as any);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Country removed" });
      fetchCountries();
    }
  };

  const filteredCountries = countries.filter(c => 
    c.country_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.country_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Country & Regional Settings</h1>
          <p className="text-muted-foreground">Manage global access, taxes, and currencies.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="h-4 w-4" /> Add New Country
        </Button>
      </div>

      <div className="flex items-center relative max-w-sm">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name or code..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Country Name</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Tax Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && countries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredCountries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No countries found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCountries.map((c) => (
                <TableRow key={c.country_code} className={c.is_blocked ? "bg-muted/30" : ""}>
                  <TableCell className="font-mono font-bold">{c.country_code}</TableCell>
                  <TableCell className="font-medium">{c.country_name}</TableCell>
                  <TableCell>{c.currency_code}</TableCell>
                  <TableCell className="text-xs">
                    {c.tax_name}: {c.tax_percentage}%
                  </TableCell>
                  <TableCell>
                    {c.is_blocked ? (
                      <span className="text-destructive flex items-center gap-1 text-xs font-bold">
                        <Ban className="h-3 w-3" /> BLOCKED
                      </span>
                    ) : (
                      <span className="text-green-600 flex items-center gap-1 text-xs font-bold">
                        <CheckCircle className="h-3 w-3" /> ACTIVE
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(c)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={c.is_blocked ? "text-green-600" : "text-orange-500"}
                      onClick={() => toggleBlock(c.country_code, c.is_blocked)}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCountry(c.country_code)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Modal Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCountry ? "Edit Country" : "Add New Country"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Code</Label>
              <Input 
                className="col-span-3" 
                placeholder="e.g. IN, LK" 
                disabled={!!editingCountry}
                value={formData.country_code}
                onChange={(e) => setFormData({...formData, country_code: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input 
                className="col-span-3" 
                value={formData.country_name}
                onChange={(e) => setFormData({...formData, country_name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Currency</Label>
              <Input 
                className="col-span-3" 
                value={formData.currency_code}
                onChange={(e) => setFormData({...formData, currency_code: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tax (%)</Label>
              <Input 
                type="number"
                className="col-span-3" 
                value={formData.tax_percentage}
                onChange={(e) => setFormData({...formData, tax_percentage: Number(e.target.value)})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCountry}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCountryManagement;