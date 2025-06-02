import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  Check,
  EllipsisVertical,
  Plus,
  Search,
  Trash2,
  PenLine,
  Users,
  Store,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/supabaseClient';

export default function Stores() {
  const [stores, setStores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [storeAdmins, setStoreAdmins] = useState<any[]>([]);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'Admin' });
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [isAddingNewAdmin, setIsAddingNewAdmin] = useState(false);
  const [storeForNewAdmin, setStoreForNewAdmin] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storeId = localStorage.getItem('store_id');
    const isSuperadmin = localStorage.getItem('superadmin');
  
    if (!storeId && !isSuperadmin) {
      navigate('/login');
    }
  }, [navigate]);
  const { t } = useTranslation();

  // Fetch stores from Supabase
  useEffect(() => {
    const fetchStores = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('stores').select('*');
        if (error) throw error;
        setStores(data || []);
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast.error("Failed to load stores");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, []);

  const filteredStores = stores.filter(store => {
    const matchesSearch = 
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      store.store_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter ? store.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

  // Open admin management dialog
  const handleManageAdmins = async (store: any) => {
    setSelectedStore(store); // ✅
    setStoreForNewAdmin(store); // 🔥 نحفظ نسخة إضافية وقت فتح المودال
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('store_id', store.store_id);

      if (error) throw error;

      setStoreAdmins(data || []);
      setShowAdminDialog(true);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admins');
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error("Please fill in all required fields");
      return;
    }
  
    if (!selectedStore?.store_id) {
      toast.error("No store selected. Please try again.");
      return;
    }
  
    try {
      const { error } = await supabase
        .from('admins')
        .insert({
          store_id: storeForNewAdmin.store_id, // ✅ ربط صحيح
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password,
          role: newAdmin.role,
        });
  
      if (error) {
        console.error('Error adding admin:', error);
        toast.error(error.message || 'Failed to add admin');
        return;
      }
  
      toast.success(`Admin ${newAdmin.name} added successfully`);
      setNewAdmin({ name: '', email: '', password: '', role: 'Admin' });
      setIsAddingNewAdmin(false); // ✅ نغلق فورم الإضافة
      handleManageAdmins(selectedStore); // ✅ إعادة تحميل المشرفين
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Unexpected error while adding admin');
    }
  };
  const handleEditAdmin = (admin: any) => {
    setEditingAdmin(admin);
    setNewAdmin({
      name: admin.name,
      email: admin.email,
      password: '', // Don't show password
      role: admin.role
    });
  };

  const handleUpdateAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const updates: any = {
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      };
      if (newAdmin.password) {
        updates.password = newAdmin.password;
      }

      const { error } = await supabase
        .from('admins')
        .update(updates)
        .eq('id', editingAdmin.id);

      if (error) throw error;

      toast.success('Admin updated successfully');
      handleManageAdmins(selectedStore);
      setEditingAdmin(null);
      setNewAdmin({ name: '', email: '', password: '', role: 'Admin' });
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error('Failed to update admin');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      toast.success('Admin deleted successfully');
      handleManageAdmins(selectedStore);
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Failed to delete admin');
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-neon-green text-black">{t('Active')}</Badge>;
      case 'trial':
        return <Badge className="bg-neon-blue text-black">{t('Trial')}</Badge>;
      case 'canceled':
        return <Badge className="bg-destructive">{t('Canceled')}</Badge>;
      default:
        return <Badge className="bg-muted">{status}</Badge>;
    }
  };

  return (
    <MainLayout isAdmin={true}>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t('Stores')}</h1>
          <div className="flex gap-4">
            <Input
              placeholder={t('Search...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
<Tabs defaultValue="all" onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}>
  <TabsList>
    <TabsTrigger value="all">{t('All')}</TabsTrigger>
    <TabsTrigger value="trial">{t('Trial')}</TabsTrigger> {/* ✅ lowercase trial */}
    <TabsTrigger value="monthly">{t('Monthly')}</TabsTrigger> {/* ✅ lowercase monthly */}
    <TabsTrigger value="canceled">{t('Canceled')}</TabsTrigger> {/* ✅ lowercase canceled */}
  </TabsList>
</Tabs>
          </div>
        </div>
  
        {/* Stores Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Store')}</TableHead>
                <TableHead>{t('Owner')}</TableHead>
                <TableHead>{t('Domain')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead className="text-right">{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    {t('Loading...')}
                  </TableCell>
                </TableRow>
              ) : filteredStores.length > 0 ? (
                filteredStores.map((store) => (
                  <TableRow key={store.store_id}>
                    <TableCell className="font-semibold whitespace-nowrap">{store.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{store.email}</TableCell>
                    <TableCell className="whitespace-nowrap">{store.domain || '-'}</TableCell>
                    <TableCell>{renderStatusBadge(store.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleManageAdmins(store)}>
                        <EllipsisVertical size={20} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    {t('No stores found')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
  
      {/* Admin Management Dialog */}
      {showAdminDialog && (
        <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('Manage Admins for')} {selectedStore?.name}</DialogTitle>
            </DialogHeader>
  
            {/* زر إضافة مشرف جديد */}
            <div className="flex justify-end mb-4">
            <Button variant="default" onClick={() => {
  setEditingAdmin(null);
  setNewAdmin({ name: '', email: '', password: '', role: 'Admin' });
  setIsAddingNewAdmin(true); // 🔥 نفعّل وضع إضافة مشرف جديد
}}>
  <Plus size={16} className="mr-2" /> {t('Add New Admin')}
</Button>
            </div>
  
            {/* قائمة المشرفين */}
            <div className="space-y-3">
              {storeAdmins.length > 0 ? (
                storeAdmins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between border p-3 rounded-lg">
                    <div>
                      <div className="font-bold">{admin.name}</div>
                      <div className="text-muted-foreground text-sm">{admin.email}</div>
                      <div className="text-muted-foreground text-xs">{admin.role}</div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <EllipsisVertical size={20} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditAdmin(admin)}>
                          <PenLine size={16} className="mr-2" />
                          {t('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteAdmin(admin.id)}>
                          <Trash2 size={16} className="mr-2" />
                          {t('Delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground">{t('No admins found')}</div>
              )}
            </div>
  
            {/* Form لإضافة أو تعديل مشرف */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Input
                placeholder={t('Name')}
                value={newAdmin.name}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder={t('Email')}
                value={newAdmin.email}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                placeholder={t('Password')}
                value={newAdmin.password}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                type="password"
              />
              <select
                value={newAdmin.role}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, role: e.target.value }))}
                className="bg-black text-white border p-2 rounded-md"
              >
                <option value="Admin">{t('Admin')}</option>
                <option value="Owner">{t('Owner')}</option>
              </select>
            </div>
  
            <DialogFooter className="mt-6">
              <Button onClick={editingAdmin ? handleUpdateAdmin : handleAddAdmin}>
                {editingAdmin ? t('Update Admin') : t('Add Admin')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
}  