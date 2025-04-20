import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
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
  Switch 
} from '@/components/ui/switch';
import {
  AlertCircle,
  Check,
  EllipsisVertical,
  Plus,
  Search,
  Trash2,
  PenLine,
  ToggleLeft,
  ToggleRight,
  Download,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { exportToCSV } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rrmrownqurlhnngqeoqm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJybXJvd25xdXJsaG5uZ3Flb3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NDkxMDUsImV4cCI6MjA1OTEyNTEwNX0.sMBDivG_y_EHyChuAEIMz1mz20GPXGHKL2anEMli00E'
);

type ProductListProps = {
  isAdmin?: boolean;
};

export default function ProductList({ isAdmin = false }: ProductListProps) {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPausedOnly, setShowPausedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Add a function to safely parse localStorage items with error handling
  const safeParseLocalStorage = (key, defaultValue = []) => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error parsing localStorage key "${key}":`, error);
      // If there's a parsing error, clear the corrupted data
      localStorage.removeItem(key);
      toast.error(`Error loading data from localStorage. Resetting corrupted data.`);
      return defaultValue;
    }
  };

  // Modify the fetchItems function to use the safe parse function
  useEffect(() => {
    const fetchProducts = async () => {
      const storeId = localStorage.getItem("store_id");
      if (!storeId) return;
  
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId);
  
      if (error) {
        console.error("❌ Error loading products:", error.message);
        return;
      }
  
      setItems(data); // أو أي متغير يعرض المنتجات في جدول
    };
  
    fetchProducts();
  }, []);
  
  // Also modify the refreshData function
  const refreshData = () => {
    setIsLoading(true);
    try {
      if (isAdmin) {
        // Admin view - fetch stores
        const stores = safeParseLocalStorage('stores');
        setItems(stores);
      } else {
        // Store view - fetch products
        const products = safeParseLocalStorage('products');
        console.log('ProductList Refresh - Loaded products from localStorage:', products);
        
        setItems(products.map((product: any) => ({
          id: product.id,
          name: product.name || 'Unnamed Product',
          code: product.product_id || 'No code',
          maxUsers: product.max_users || product.maxUsers || 1,
          infiniteUsers: product.infinite_users || product.infiniteUsers || false,
          expiry: product.expire_days || product.expireDays || 30,
          infiniteExpiry: product.infinite_expiry || product.infiniteExpiry || false,
          twoFA: product.two_fa_enabled || product.twoFAEnabled || false,
          status: product.is_paused || product.isPaused ? 'paused' : 'active',
          accountsTotal: 0, // These will be calculated when we have accounts
          accountsRemaining: 0,
          isGiftCard: product.is_gift_card || product.isGiftCard || false
        })));
      }
      console.log('Data refreshed from localStorage');
    } catch (error) {
      console.error(`Error refreshing data:`, error);
      toast.error(`Failed to refresh data`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    // Filter by search term
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status
    const matchesStatus = showPausedOnly ? item.status === 'paused' : true;
    
    return matchesSearch && matchesStatus;
  });

  const toggleItemStatus = async (id: string) => {
    try {
      // Find the item to toggle
      const item = items.find(i => i.id === id);
      if (!item) return;

      const newStatus = item.status === 'active' ? 'paused' : 'active';
      
      // Update local state
      setItems(items.map(item => {
        if (item.id === id) {
          return { ...item, status: newStatus };
        }
        return item;
      }));

      toast.success(`${isAdmin ? 'Store' : 'Product'} ${newStatus === 'active' ? 'activated' : 'paused'} successfully`);
    } catch (error) {
      console.error(`Error toggling ${isAdmin ? 'store' : 'product'} status:`, error);
      toast.error(`Failed to update ${isAdmin ? 'store' : 'product'} status`);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      if (confirm(`Are you sure you want to delete this ${isAdmin ? 'store' : 'product'}?`)) {
        // Get existing data from localStorage
        const existingItems = JSON.parse(localStorage.getItem(isAdmin ? 'stores' : 'products') || '[]');
        
        // Filter out the item to delete
        const updatedItems = existingItems.filter((item: any) => item.id !== id);
        
        // Save back to localStorage
        localStorage.setItem(isAdmin ? 'stores' : 'products', JSON.stringify(updatedItems));
        
        // Also delete any associated accounts if it's a product
        if (!isAdmin) {
          const existingAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
          const updatedAccounts = existingAccounts.filter((account: any) => account.product_id !== id);
          localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
        }
        
        // Update local state
        setItems(items.filter(item => item.id !== id));
        
        // Log for debugging
        console.log(`Deleted ${isAdmin ? 'store' : 'product'} with ID:`, id);
        console.log('Updated localStorage:', updatedItems);
        
        toast.success(`${isAdmin ? 'Store' : 'Product'} deleted successfully`);
      }
    } catch (error) {
      console.error(`Error deleting ${isAdmin ? 'store' : 'product'}:`, error);
      toast.error(`Failed to delete ${isAdmin ? 'store' : 'product'}`);
    }
  };

  // New function to export data to CSV
  const exportData = async (itemId: string) => {
    try {
      // Show export started toast
      toast.info(t('alerts.exportStarted'));
      
      // Find the item to export
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      
      if (isAdmin) {
        // Export store data
        exportToCSV([item], `store-${itemId}`, [
          'id', 'name', 'code', 'status'
        ]);
      } else {
        // For products, export product data and accounts
        
        // Get accounts for this product
        const allAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        const productAccounts = allAccounts.filter((account: any) => account.product_id === itemId);
        
        // Prepare accounts with structure matching the requested format
        const accountsData = productAccounts.map((account: any) => {
          // Mock users data - in a real application, this would come from your database
          const mockUsers = account.users || [];
          
          return {
            accounts_info: {
              name: account.name || account.email.split('@')[0],
              email: account.email,
              password: account.password,
              max_users: account.max_users || "1",
              product_id: item.code,
              gift_card: (item.isGiftCard || false).toString(),
              "2fa": !!account.two_fa_secret,
              limit_2fa_per_user: account.limit_2fa || 2,
              totp_secret: account.two_fa_secret || "",
              status: account.status || "active",
              users: mockUsers.map((user: any) => ({
                number: user.number || "",
                timestamp: user.timestamp || new Date().toISOString(),
                code_claimed: user.code_claimed || 1,
                timestamp_code: user.timestamp_code || new Date().toISOString(),
                account_assigned: account.name || account.email.split('@')[0]
              }))
            }
          };
        });
        
        // Convert to JSON and save
        const dataStr = JSON.stringify(accountsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `product-accounts-${item.name}-${itemId}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Show export completed toast
      toast.success(t('alerts.exportComplete'));
    } catch (error) {
      console.error(`Error exporting data:`, error);
      toast.error(t('alerts.error.failedToLoad'));
    }
  };

  // Add a function to clear all data from localStorage
  const clearAllData = () => {
    if (confirm('Are you sure you want to clear ALL product data? This cannot be undone.')) {
      try {
        localStorage.removeItem('products');
        localStorage.removeItem('accounts');
        localStorage.removeItem('stores');
        console.log('All data cleared from localStorage');
        toast.success('All data has been cleared. Refreshing...');
        
        // Refresh data
        setTimeout(refreshData, 500);
      } catch (error) {
        console.error('Error clearing data:', error);
        toast.error('Failed to clear data');
      }
    }
  };

  const pageTitle = isAdmin ? "Stores" : "Products";
  const pageDescription = isAdmin ? "Manage all stores in the system" : "Manage your store products";

  return (
    <MainLayout isAdmin={isAdmin}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t(pageTitle)}</h1>
            <p className="text-muted-foreground">{t(pageDescription)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshData}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
              </svg>
              {t('Refresh')}
            </Button>
            <Button onClick={() => navigate(isAdmin ? '/admin/stores/new' : '/products/new')}>
              <Plus size={16} className="mr-2" /> {isAdmin ? t('Add New Store') : t('Add New Product')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
          <div className="relative w-full sm:w-auto flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isAdmin ? t("Search stores...") : t("Search products...")}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="destructive" size="sm" onClick={clearAllData}>
              <Trash2 className="h-4 w-4 mr-2" />
              Reset Data
            </Button>
            <div className="flex items-center space-x-2">
              <Switch 
                id="paused-only" 
                checked={showPausedOnly}
                onCheckedChange={setShowPausedOnly}
              />
              <label htmlFor="paused-only" className="text-sm font-medium">
                {t('Paused Only')}
              </label>
            </div>
          </div>
        </div>

        <div className="dashboard-card p-0 overflow-hidden bg-[#101113]">
          <div className="overflow-x-auto">
            <Table className="bg-[#101113]">
              <TableHeader>
                <TableRow className="border-b border-border/40 hover:bg-[#1a1b1e]">
                  {isAdmin ? (
                    // Admin view - Stores columns
                    <>
                      <TableHead className="text-gray-400">{t('Product Name')}</TableHead>
                      <TableHead className="text-gray-400">{t('Code')}</TableHead>
                      <TableHead className="text-center text-gray-400">{t('Max Users')}</TableHead>
                      <TableHead className="text-center text-gray-400">{t('Expiry (days)')}</TableHead>
                      <TableHead className="text-center text-gray-400">{t('2FA')}</TableHead>
                      <TableHead className="text-center text-gray-400">{t('Status')}</TableHead>
                      <TableHead className="text-center text-gray-400">{t('Accounts')}</TableHead>
                      <TableHead className="text-right text-gray-400">{t('Actions')}</TableHead>
                    </>
                  ) : (
                    // Store view - Products columns
                    <>
                      <TableHead className="text-gray-400">{t('Product Name')}</TableHead>
                      <TableHead className="text-gray-400">{t('Code')}</TableHead>
                      <TableHead className="text-center text-gray-400">{t('Max Users')}</TableHead>
                      <TableHead className="text-center text-gray-400">{t('Expiry (days)')}</TableHead>
                      <TableHead className="text-center text-gray-400">{t('2FA')}</TableHead>
                      <TableHead className="text-center text-gray-400">{t('Status')}</TableHead>
                      <TableHead className="text-center text-gray-400">{t('Accounts')}</TableHead>
                      <TableHead className="text-right text-gray-400">{t('Actions')}</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="hover:bg-[#1a1b1e] bg-[#101113]">
                    <TableCell colSpan={isAdmin ? 7 : 8} className="text-center py-6 text-gray-300">
                      <p>{isAdmin ? t('Loading stores...') : t('Loading products...')}</p>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="border-b border-border/40 hover:bg-[#1a1b1e] bg-[#101113]">
                      <TableCell className="text-gray-200">
                        <div className="flex items-center gap-2">
                          {item.name}
                          {item.isGiftCard && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neon-purple/20 text-neon-purple">
                              {t('Gift Card')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-200">{item.code}</TableCell>
                      <TableCell className="text-center text-gray-200">
                        {item.infiniteUsers ? (
                          <span className="text-neon-green font-bold" title={t('Infinite')}>
                            {t('Infinity')}
                          </span> 
                        ) : (
                          item.maxUsers
                        )}
                      </TableCell>
                      <TableCell className="text-center text-gray-200">
                        {item.infiniteExpiry ? (
                          <span className="text-neon-green font-bold" title={t('Infinite')}>
                            {t('Infinity')}
                          </span> 
                        ) : (
                          item.expiry
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.twoFA ? (
                          <div className="flex justify-center">
                            <Check size={16} className="text-neon-green" />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'active' ? 'bg-neon-green/20 text-neon-green' : 'bg-amber-500/20 text-amber-500'
                        }`}>
                          {item.status === 'active' ? t('Active') : t('Paused')}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.isGiftCard ? (
                          <span className="text-muted-foreground">{t('N/A')}</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <span className={item.accountsRemaining < 5 ? 'text-destructive' : 'text-gray-200'}>
                              {item.accountsRemaining}
                            </span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-gray-200">{item.accountsTotal}</span>
                            {item.accountsRemaining < 5 && (
                              <AlertCircle size={14} className="text-destructive ml-1" />
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-200">
                              <EllipsisVertical size={16} />
                              <span className="sr-only">{t('Open menu')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#101113] border-border/40">
                            <DropdownMenuItem 
                              className="cursor-pointer text-gray-200 hover:bg-[#1a1b1e] focus:bg-[#1a1b1e]"
                              onClick={() => navigate(isAdmin ? `/admin/stores/${item.id}` : `/products/${item.id}`)}
                            >
                              <PenLine size={16} className="mr-2" />
                              {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer text-gray-200 hover:bg-[#1a1b1e] focus:bg-[#1a1b1e]"
                              onClick={() => toggleItemStatus(item.id)}
                            >
                              {item.status === 'active' ? (
                                <>
                                  <ToggleLeft size={16} className="mr-2" />
                                  {t('Pause')}
                                </>
                              ) : (
                                <>
                                  <ToggleRight size={16} className="mr-2" />
                                  {t('Resume')}
                                </>
                              )}
                            </DropdownMenuItem>
                            
                            {isAdmin ? (
                              <DropdownMenuItem 
                                className="cursor-pointer text-gray-200 hover:bg-[#1a1b1e] focus:bg-[#1a1b1e]"
                                onClick={() => navigate(`/admin/stores/${item.id}/admins`)}
                              >
                                <Users size={16} className="mr-2" />
                                {t('Manage Admins')}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                className="cursor-pointer text-gray-200 hover:bg-[#1a1b1e] focus:bg-[#1a1b1e]"
                                onClick={() => navigate(`/products/${item.id}`)}
                              >
                                <Users size={16} className="mr-2" />
                                {item.isGiftCard ? t('Manage Codes') : t('Manage Accounts')}
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem 
                              className="cursor-pointer text-gray-200 hover:bg-[#1a1b1e] focus:bg-[#1a1b1e]"
                              onClick={() => exportData(item.id)}
                            >
                              <Download size={16} className="mr-2" />
                              {t('Export Data')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer text-destructive hover:bg-[#1a1b1e] focus:bg-[#1a1b1e]"
                              onClick={() => deleteItem(item.id)}
                            >
                              <Trash2 size={16} className="mr-2" />
                              {t('Delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-[#1a1b1e] bg-[#101113]">
                    <TableCell colSpan={isAdmin ? 7 : 8} className="text-center py-6 text-gray-300">
                      <p>{isAdmin ? t('No stores found') : t('No products found')}</p>
                      <Button variant="outline" className="mt-2" onClick={() => navigate(isAdmin ? '/admin/stores/new' : '/products/new')}>
                        <Plus size={16} className="mr-2" /> {isAdmin ? t('Add Store') : t('Add Product')}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
