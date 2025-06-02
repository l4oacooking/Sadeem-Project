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
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { supabase } from '@/supabaseClient';

type ProductListProps = {
  isAdmin?: boolean;
};

export default function ProductList({ isAdmin = false }: ProductListProps) {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPausedOnly, setShowPausedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ⛔ Remove any createClient!
  // ✅ Only use your app-wide supabase instance.

  useEffect(() => {
    const checkSessionAndFetch = async () => {
      // Get the current logged in user (waits for auth)
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      console.log('🔎 Supabase user:', user, 'Error:', userErr);

      if (!user) {
        toast.error('You are not logged in.');
        setLoading(false);
        navigate('/login');
        return;
      }

      // Fetch products - RLS will auto-filter for their store_id!
      const { data: products, error } = await supabase
        .from('products')
        .select('*');

      console.log('🟩 Products fetched:', products, 'Error:', error);

      if (error) {
        toast.error('Failed to fetch products: ' + error.message);
        setItems([]);
        setLoading(false);
        return;
      }

      // Defensive: if still empty, display notice
      if (!products || products.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // For each product, fetch associated accounts counts
      const productsWithCounts = await Promise.all(
        products.map(async (product: any) => {
          const { data: accounts, error: accErr } = await supabase
            .from('accounts')
            .select('status, max_users, users')
            .eq('product_id', product.id);

          if (accErr) {
            console.error('Error fetching accounts for product:', product.id, accErr);
            return null;
          }

          const total = accounts?.length || 0;
          const full = (accounts || []).filter(acc => {
            const maxUsers = acc.max_users ?? 1;
            const currentUsers = Array.isArray(acc.users) ? acc.users.length : 0;
            return currentUsers >= maxUsers;
          }).length;

          return {
            id: product.id,
            accountType: product.account_type ?? 'other',
            name: product.name || 'Unnamed Product',
            code: product.product_id,
            maxUsers: product.max_users ?? 1,
            infiniteUsers: product.infinite_users ?? false,
            expiry: product.expire_days ?? 30,
            infiniteExpiry: product.infinite_expiry ?? false,
            twoFA: product.two_fa_enabled ?? false,
            twoFAType: product.two_fa_type || 'none',
            emailProvider: product.email_provider || '',
            status: product.is_paused ? 'paused' : 'active',
            isGiftCard: product.is_gift_card ?? false,
            accountsTotal: total,
            accountsRemaining: full,
          };
        })
      );

      setItems(productsWithCounts.filter(Boolean));
      setLoading(false);
    };

    checkSessionAndFetch();
  }, [navigate]);

  // ...rest of your UI unchanged...
useEffect(() => {
  (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('User:', user);

    // Try a direct, simple fetch
    const { data, error } = await supabase.from('products').select('*');
    console.log('Direct product fetch:', data, error);

    // Show JWT to debug
    const token = (await supabase.auth.getSession()).data?.session?.access_token;
    console.log('Current JWT:', token);
  })();
}, []);
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

        <div className="dashboard-card p-0 overflow-hidden bg-[#101113]">
          <div className="overflow-x-auto">
            <Table className="bg-[#101113]">
              <TableHeader>
                <TableRow className="border-b border-border/40 hover:bg-[#1a1b1e]">
                  <TableHead className="text-gray-400">{t('Account Type')}</TableHead>
                  <TableHead className="text-gray-400">{t('Product Name')}</TableHead>
                  <TableHead className="text-gray-400">{t('Code')}</TableHead>
                  <TableHead className="text-center text-gray-400">{t('Max Users')}</TableHead>
                  <TableHead className="text-center text-gray-400">{t('Expiry (days)')}</TableHead>
                  <TableHead className="text-center text-gray-400">{t('2FA Type')}</TableHead>
                  <TableHead className="text-center text-gray-400">{t('Status')}</TableHead>
                  <TableHead className="text-center text-gray-400">{t('Accounts')}</TableHead>
                  <TableHead className="text-right text-gray-400">{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="hover:bg-[#1a1b1e] bg-[#101113]">
                    <TableCell colSpan={8} className="text-center py-6 text-gray-300">
                      <p>{t('Loading products...')}</p>
                    </TableCell>
                  </TableRow>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.id} className="border-b border-border/40 hover:bg-[#1a1b1e] bg-[#101113]">
                      <TableCell className="text-gray-200 capitalize">
                        {item.accountType}
                      </TableCell>
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
                      <TableCell className="text-center text-gray-200">
                        {item.twoFA ? (
                          <span className="text-xs font-medium capitalize">
                            {item.twoFAType === 'email' ? 'Email' : item.twoFAType}
                          </span>
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
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/products/${item.id}`)}>
                          {t('Manage')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-[#1a1b1e] bg-[#101113]">
                    <TableCell colSpan={8} className="text-center py-6 text-gray-300">
                      <p>{t('No products found')}</p>
                      <Button variant="outline" className="mt-2" onClick={() => navigate('/products/new')}>
                        <Plus size={16} className="mr-2" /> {t('Add Product')}
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
