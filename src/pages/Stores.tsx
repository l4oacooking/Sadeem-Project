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
  Package,
  BadgeAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import MainLayout from '@/components/layout/MainLayout';

// Function to check if using demo account
const isDemoAccount = () => {
  const storeId = localStorage.getItem('store_id');
  return storeId === 'new' || storeId === 'demo';
};

// Mock data only for demo accounts
const getDemoStores = () => {
  return [
    {
      id: "store-1",
      name: "Neon Tech Store",
      code: "NTS001",
      status: "active",
      products: 12,
      admins: 3,
      dateCreated: "2023-11-15T10:30:00Z"
    },
    {
      id: "store-2",
      name: "Digital Solutions",
      code: "DS002",
      status: "trial",
      products: 8,
      admins: 2,
      dateCreated: "2023-12-05T14:45:00Z"
    },
    {
      id: "store-3",
      name: "Cyber Gadgets",
      code: "CG003",
      status: "canceled",
      products: 0,
      admins: 1,
      dateCreated: "2023-10-20T09:15:00Z"
    },
    {
      id: "store-4",
      name: "Future Devices",
      code: "FD004",
      status: "active",
      products: 24,
      admins: 5,
      dateCreated: "2023-09-30T16:20:00Z"
    }
  ];
};

// Mock admins data only for demo accounts
const getDemoAdmins = (storeId: string) => {
  const demoAdmins = {
    "store-1": [
      { id: "admin-1", name: "John Doe", email: "john@example.com", role: "Owner" },
      { id: "admin-2", name: "Jane Smith", email: "jane@example.com", role: "Admin" },
      { id: "admin-3", name: "Mike Johnson", email: "mike@example.com", role: "Admin" }
    ],
    "store-2": [
      { id: "admin-4", name: "Sarah Williams", email: "sarah@example.com", role: "Owner" },
      { id: "admin-5", name: "Alex Brown", email: "alex@example.com", role: "Admin" }
    ],
    "store-3": [
      { id: "admin-6", name: "David Lee", email: "david@example.com", role: "Owner" }
    ],
    "store-4": [
      { id: "admin-7", name: "Emily Chen", email: "emily@example.com", role: "Owner" },
      { id: "admin-8", name: "Robert Taylor", email: "robert@example.com", role: "Admin" },
      { id: "admin-9", name: "Lisa Wang", email: "lisa@example.com", role: "Admin" },
      { id: "admin-10", name: "James Wilson", email: "james@example.com", role: "Admin" },
      { id: "admin-11", name: "Patricia Moore", email: "patricia@example.com", role: "Admin" }
    ]
  };
  
  return demoAdmins[storeId] || [];
};

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
  
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch stores data
  useEffect(() => {
    const fetchStores = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call
        // For now, only show mock data for demo accounts
        if (isDemoAccount()) {
          // Simulating API call with timeout
          await new Promise(resolve => setTimeout(resolve, 500));
          setStores(getDemoStores());
        } else {
          // For real accounts, return empty array until connected to real backend
          setStores([]);
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast.error("Failed to load stores");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, []);

  // Filter stores based on search term and status filter
  const filteredStores = stores.filter(store => {
    const matchesSearch = 
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      store.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status if a status filter is selected
    const matchesStatus = statusFilter ? store.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

  // Handler for opening the admin management dialog
  const handleManageAdmins = (store: any) => {
    setSelectedStore(store);
    // Fetch admins for the selected store
    // In a real app, this would be an API call
    if (isDemoAccount()) {
      setStoreAdmins(getDemoAdmins(store.id));
    } else {
      // For real accounts, return empty array until connected to real backend
      setStoreAdmins([]);
    }
    setShowAdminDialog(true);
  };

  // Handler for adding a new admin
  const handleAddAdmin = () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Create new admin
    const newAdminWithId = {
      id: `admin-${Date.now()}`,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role
    };

    // Add admin to store
    setStoreAdmins([...storeAdmins, newAdminWithId]);
    
    // Reset form
    setNewAdmin({ name: '', email: '', password: '', role: 'Admin' });
    
    toast.success(`Admin ${newAdminWithId.name} added successfully`);
  };

  // Handler for editing an admin
  const handleEditAdmin = (admin: any) => {
    setEditingAdmin(admin);
    setNewAdmin({
      name: admin.name,
      email: admin.email,
      password: '', // Don't show password in form
      role: admin.role
    });
  };

  // Handler for updating an admin
  const handleUpdateAdmin = () => {
    if (!newAdmin.name || !newAdmin.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Update admin
    setStoreAdmins(storeAdmins.map(admin => {
      if (admin.id === editingAdmin.id) {
        return {
          ...admin,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
          // Only update password if a new one is provided
          ...(newAdmin.password ? { password: newAdmin.password } : {})
        };
      }
      return admin;
    }));
    
    // Reset form
    setNewAdmin({ name: '', email: '', password: '', role: 'Admin' });
    setEditingAdmin(null);
    
    toast.success(`Admin updated successfully`);
  };

  // Handler for deleting an admin
  const handleDeleteAdmin = (adminId: string) => {
    setStoreAdmins(storeAdmins.filter(admin => admin.id !== adminId));
    toast.success(`Admin deleted successfully`);
  };

  // Render status badge based on store status
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
    <div>
      <MainLayout isAdmin={true}>
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">{t('Stores')}</h1>
              <p className="text-muted-foreground">{t('Manage all stores in the system')}</p>
            </div>
          </div>

          {/* Show demo account notice if using the demo account */}
          {isDemoAccount() && (
            <div className="rounded-md bg-yellow-500/10 p-3 text-yellow-600 border border-yellow-200 dark:border-yellow-900 dark:text-yellow-400">
              <p className="text-sm">{t("Demo Mode: The data shown is sample data. Changes will not persist after page refresh.")}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
            <div className="relative w-full sm:w-auto flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("Search stores...")}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Tabs defaultValue="all" onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}>
                <TabsList>
                  <TabsTrigger value="all">{t('All')}</TabsTrigger>
                  <TabsTrigger value="active">{t('Active')}</TabsTrigger>
                  <TabsTrigger value="trial">{t('Trial')}</TabsTrigger>
                  <TabsTrigger value="canceled">{t('Canceled')}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="dashboard-card p-0 overflow-hidden bg-[#101113]">
            <div className="overflow-x-auto">
              <Table className="bg-[#101113]">
                <TableHeader>
                  <TableRow className="border-b border-border/40 hover:bg-[#1a1b1e]">
                    <TableHead className="text-gray-400">{t('Store Name')}</TableHead>
                    <TableHead className="text-gray-400">{t('Store ID')}</TableHead>
                    <TableHead className="text-center text-gray-400">{t('Products')}</TableHead>
                    <TableHead className="text-center text-gray-400">{t('Admins')}</TableHead>
                    <TableHead className="text-center text-gray-400">{t('Status')}</TableHead>
                    <TableHead className="text-right text-gray-400">{t('Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <div className="flex justify-center">
                          <div className="animate-spin w-6 h-6 border-2 border-neon-blue border-t-transparent rounded-full"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredStores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <div className="flex flex-col items-center justify-center">
                          <Store size={48} className="text-gray-500 mb-2" />
                          <p className="text-gray-500">{t('No stores found')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStores.map((store) => (
                      <TableRow key={store.id} className="border-b border-border/40 hover:bg-[#1a1b1e]">
                        <TableCell className="font-medium text-white">
                          <div className="flex items-center gap-2">
                            <Store size={18} className="text-neon-blue" />
                            {store.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">{store.code}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Package size={16} className="text-neon-green" />
                            <span>{store.products}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users size={16} className="text-neon-purple" />
                            <span>{store.admins}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {renderStatusBadge(store.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <EllipsisVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/stores/${store.id}`)}>
                                <PenLine size={16} className="mr-2" />
                                {t('Edit Store')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManageAdmins(store)}>
                                <Users size={16} className="mr-2" />
                                {t('Manage Admins')}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setStores(stores.filter(s => s.id !== store.id));
                                  toast.success(`Store ${store.name} deleted`);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 size={16} className="mr-2" />
                                {t('Delete Store')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Admin Management Dialog */}
          <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('Manage Admins')} - {selectedStore?.name}</DialogTitle>
                <DialogDescription>
                  {t('Add, edit, or remove admin users for this store.')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 gap-6 mt-4">
                {/* Admin Form */}
                <div className="p-4 border rounded-md bg-black/20">
                  <h3 className="text-lg font-medium mb-3">
                    {editingAdmin ? t('Edit Admin') : t('Add New Admin')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-name">{t('Name')}</Label>
                      <Input 
                        id="admin-name"
                        value={newAdmin.name} 
                        onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                        placeholder={t('Enter admin name')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">{t('Email')}</Label>
                      <Input 
                        id="admin-email"
                        type="email"
                        value={newAdmin.email} 
                        onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                        placeholder={t('Enter admin email')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">{t('Password')}</Label>
                      <Input 
                        id="admin-password"
                        type="password"
                        value={newAdmin.password} 
                        onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                        placeholder={editingAdmin ? t('Leave blank to keep current password') : t('Enter admin password')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-role">{t('Role')}</Label>
                      <select
                        id="admin-role"
                        className="w-full px-3 py-2 bg-background border border-input rounded-md"
                        value={newAdmin.role}
                        onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                      >
                        <option value="Admin">{t('Admin')}</option>
                        <option value="Owner">{t('Owner')}</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    {editingAdmin ? (
                      <>
                        <Button variant="outline" onClick={() => {
                          setEditingAdmin(null);
                          setNewAdmin({ name: '', email: '', password: '', role: 'Admin' });
                        }}>
                          {t('Cancel')}
                        </Button>
                        <Button onClick={handleUpdateAdmin}>
                          {t('Update Admin')}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleAddAdmin}>
                        {t('Add Admin')}
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Admins Table */}
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-3">{t('Current Admins')}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('Name')}</TableHead>
                        <TableHead>{t('Email')}</TableHead>
                        <TableHead>{t('Role')}</TableHead>
                        <TableHead className="text-right">{t('Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {storeAdmins.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            {t('No admins found')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        storeAdmins.map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell className="font-medium">{admin.name}</TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>
                              <Badge variant={admin.role === 'Owner' ? 'default' : 'outline'}>
                                {admin.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditAdmin(admin)}
                                >
                                  <PenLine size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-destructive hover:text-destructive" 
                                  onClick={() => handleDeleteAdmin(admin.id)}
                                  disabled={admin.role === 'Owner'} // Can't delete the owner
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setShowAdminDialog(false)}>
                  {t('Close')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </MainLayout>
    </div>
  );
} 