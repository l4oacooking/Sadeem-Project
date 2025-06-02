import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  BarChart3,
  Package,
  MessageSquare,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  Users,
  Activity,
  Download,
  Wrench,
  Book
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { exportToCSV } from '@/lib/utils';
import { toast } from 'sonner';

type SidebarProps = {
  isAdmin?: boolean;
  avatar?: string;
};

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { t, rtl, language, toggleLanguage } = useTranslation();

  // Determine if on mobile and collapse sidebar by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
const storeNavItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
  { label: 'Analytics', icon: <BarChart3 size={20} />, href: '/analytics' },
  { label: 'Products', icon: <Package size={20} />, href: '/products' },
  { label: 'Admins', icon: <Users size={20} />, href: '/admins' },
  { label: 'Knowledge Base', icon: <Book size={20} />, href: '/knowledge' },
  { label: 'Support', icon: <MessageSquare size={20} />, href: '/support' }, // 👈 أضف هذا السطر
];

  const adminNavItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, href: '/admin/analytics' },
    { label: 'Stores', icon: <Store size={20} />, href: '/admin/stores' },
    { label: 'System Health', icon: <Activity size={20} />, href: '/admin/system' },
    { label: 'Admin Tools', icon: <Wrench size={20} />, href: '/admin/tools' },
    { label: 'Knowledge Base', icon: <Book size={20} />, href: '/admin/knowledge' },
  ];

  const navItems = isAdmin ? adminNavItems : storeNavItems;

  const exportAllData = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      toast.info(t('alerts.exportStarted'));
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      if (products.length === 0) {
        toast.info(t('No products found'));
        return;
      }
      const allAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      if (allAccounts.length === 0) {
        toast.info(t('No accounts found'));
        return;
      }
      const exportData = [];
      const accountsByProduct = {};
      allAccounts.forEach((account) => {
        if (!accountsByProduct[account.product_id]) {
          accountsByProduct[account.product_id] = [];
        }
        accountsByProduct[account.product_id].push(account);
      });
      Object.keys(accountsByProduct).forEach((productId) => {
        const product = products.find((p: any) => p.id === productId);
        if (!product) return;
        const productAccounts = accountsByProduct[productId].map((account: any) => {
          const mockUsers = account.users || [];
          return {
            accounts_info: {
              name: account.name || account.email.split('@')[0],
              email: account.email,
              password: account.password,
              max_users: account.max_users || "1",
              product_id: product.product_id,
              gift_card: (product.is_gift_card || false).toString(),
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
        exportData.push(...productAccounts);
      });
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'all-accounts-export.json');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t('alerts.exportComplete'));
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(t('alerts.error.failedToLoad'));
    }
  };

  // 👇 Add your logo image (put the logo in the public or src/assets directory, or import statically)
  const logoUrl = '/logo.png'; // If placed in public directory

  return (
    <div
      className={cn(
        "flex flex-col h-screen fixed top-0 z-40 bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        rtl ? "right-0" : "left-0"
      )}
      style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Logo and Title */}
      <div className="flex flex-col items-center justify-center p-4 border-b border-sidebar-border relative">
        {/* Logo */}
        <img
          src={logoUrl}
          alt="Sadeem Logo"
          className={`transition-all duration-300 rounded-xl shadow-lg mb-2 ${collapsed ? "w-8 h-8" : "w-20 h-20"}`}
          style={{ objectFit: 'contain' }}
        />
        {/* Panel Title */}
        <h1 className={cn("text-xl font-semibold text-white text-center", collapsed && "hidden")}>
          {isAdmin ? t("Admin Panel") : t("Store Panel")}
        </h1>
        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent absolute top-2 right-2"
        >
          {rtl ?
            (collapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />) :
            (collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />)
          }
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/admin' && item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center py-2 px-3 rounded-md transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <div className="flex items-center">
                <div className={cn(isActive && "text-sidebar-primary")}>{item.icon}</div>
                {!collapsed && (
                  <span className={cn("text-sm font-medium", rtl ? "mr-3" : "ml-3")}>{t(item.label)}</span>
                )}
              </div>
              {isActive && !collapsed && (
                <div className={cn(
                  "absolute w-1 h-8 bg-sidebar-primary",
                  rtl ? "left-0 rounded-r-md" : "right-0 rounded-l-md"
                )}></div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Link
          to="/settings"
          className={cn(
            "flex items-center py-2 px-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200",
            location.pathname === '/settings' && "bg-sidebar-accent text-sidebar-primary"
          )}
        >
          <Settings size={20} />
          {!collapsed && <span className={cn("text-sm font-medium", rtl ? "mr-3" : "ml-3")}>{t("Settings")}</span>}
        </Link>

        {/* Download Option for Store Owner */}
        {!isAdmin && (
          <Link
            to="#"
            onClick={exportAllData}
            className={cn(
              "flex items-center py-2 px-3 mt-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
            )}
          >
            <Download size={20} />
            {!collapsed && <span className={cn("text-sm font-medium", rtl ? "mr-3" : "ml-3")}>{t("Export Data")}</span>}
          </Link>
        )}

        {/* System Health Link for Admin */}
        {isAdmin && (
          <Link
            to="/admin/system"
            className={cn(
              "flex items-center py-2 px-3 mt-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200",
              location.pathname === '/admin/system' && "bg-sidebar-accent text-sidebar-primary"
            )}
          >
            <Shield size={20} />
            {!collapsed && <span className={cn("text-sm font-medium", rtl ? "mr-3" : "ml-3")}>{t("Security")}</span>}
          </Link>
        )}
      </div>
    </div>
  );
}
