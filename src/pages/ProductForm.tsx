import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import MainLayout from '@/components/layout/MainLayout';
import { toast } from 'sonner';
import { ArrowLeft, Trash, Plus, Edit, Check, AlertCircle, Users as UsersIcon, Eye, EyeOff } from 'lucide-react';
import TwoFactorValidation from '@/components/TwoFactorValidation';
import UserManagementDialog from '@/components/UserManagementDialog';
import { useTranslation } from '@/hooks/use-translation';
import { supabase } from '../supabaseClient'; // Ensure this import is at the top

// Function to check if using demo account
const isDemoAccount = () => {
  const storeId = localStorage.getItem('store_id');
  return storeId === 'new' || storeId === 'demo';
};

// Define form schema for product or store
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  sallaUrl: z.string().min(1, { message: "Salla product URL is required" }),
  maxUsers: z.coerce.number().min(1, { message: "Max users must be at least 1" }).optional().nullable(),
  infiniteUsers: z.boolean().default(false),
  expireDays: z.coerce.number().min(1, { message: "Expire days must be at least 1" }).optional().nullable(),
  infiniteExpiry: z.boolean().default(false),
  twoFAEnabled: z.boolean().default(false),
  limitTwoFAPerUser: z.boolean().default(false),
  twoFALimit: z.coerce.number().min(1, { message: "2FA limit must be at least 1" }).optional().nullable(),
  customReply: z.string().optional(),
  isPaused: z.boolean().default(false),
  isGiftCard: z.boolean().default(false),
  enableFileDelivery: z.boolean().default(false),
  
  // ✅ الجديد:
  deliverAsFile: z.boolean().default(false),
  file: z
    .instanceof(File)
    .optional()
    .refine(
      (file) =>
        !file || (file.size <= 2 * 1024 * 1024 && /\.(pdf|docx)$/i.test(file.name)),
      {
        message: "File must be a PDF or DOCX and ≤ 2MB",
      }
    ),
})
.refine((data) => {
  // Only require twoFALimit if twoFAEnabled and limitTwoFAPerUser are both true
  if (data.twoFAEnabled && data.limitTwoFAPerUser) {
    return data.twoFALimit !== undefined && data.twoFALimit !== null && data.twoFALimit >= 1;
  }
  return true;
}, {
  message: "2FA limit is required when 2FA is enabled and limited per user",
  path: ["twoFALimit"]
})
.refine((data) => {
  // Gift cards cannot have 2FA enabled
  return !(data.isGiftCard && data.twoFAEnabled);
}, {
  message: "Gift cards cannot have 2FA enabled",
  path: ["twoFAEnabled"]
})
.refine((data) => {
  // Gift cards cannot have infinite users
  return !(data.isGiftCard && data.infiniteUsers);
}, {
  message: "Gift cards cannot have infinite users",
  path: ["infiniteUsers"]
})
.refine((data) => {
  // Gift cards must have max users set to 1
  return !data.isGiftCard || (data.isGiftCard && data.maxUsers === 1);
}, {
  message: "Gift cards can only have 1 max user",
  path: ["maxUsers"]
});
const [file, setFile] = useState<File | null>(null);

export default function ProductForm({ isAdmin = false }: ProductFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [activeTab, setActiveTab] = useState('details');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    email: '',
    password: '',
    twoFASecret: '',
    status: 'active',
    maxUsers: 1,
    code: ''
  });
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editedAccount, setEditedAccount] = useState<any>(null);
  const [validating2FA, setValidating2FA] = useState(false);
  const [accountToValidate, setAccountToValidate] = useState<any>(null);
  // User management state
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const { t } = useTranslation();

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: getDefaultStoreValues(),
  });

  // Fetch data for editing
  useEffect(() => {
    if (isEditing) {
      const fetchData = async () => {
        try {
          if (isAdmin) {
            if (!isDemoAccount()) {
              form.reset(getDefaultStoreValues());
              setAccounts([]);
              return;
            }
            
            const stores = JSON.parse(localStorage.getItem('stores') || '[]');
            const store = stores.find((s: any) => s.id === id);
            
            if (store) {
              form.reset({
                name: store.name,
                sallaUrl: store.salla_url,
                maxUsers: store.max_users,
                infiniteUsers: store.infinite_users,
                expireDays: store.expire_days,
                infiniteExpiry: store.infinite_expiry,
                twoFAEnabled: store.two_fa_enabled,
                limitTwoFAPerUser: store.limit_two_fa_per_user,
                twoFALimit: store.two_fa_limit,
                customReply: store.custom_reply,
                isPaused: store.is_paused,
                isGiftCard: store.is_gift_card || false
              });
            } else {
              toast.error('Store not found');
              navigate('/admin/stores');
            }
          } else {
            if (!isDemoAccount()) {
              form.reset(getDefaultStoreValues());
              setAccounts([]);
              return;
            }
            
            // Debug localStorage
            console.log('LocalStorage keys:', Object.keys(localStorage));
            
            // Get products from localStorage
            const productsStr = localStorage.getItem('products');
            console.log('Raw products from localStorage:', productsStr);
            
            const products = JSON.parse(productsStr || '[]');
            console.log('Parsed products from localStorage:', products);
            console.log('All products:', products.map(p => ({id: p.id, name: p.name})));
            
            // Find the product by ID
            const product = products.find((p: any) => p.id === id);
            console.log('Looking for product with ID:', id);
            console.log('Found product:', product);
            
            if (product) {
              // Determine if it's a gift card
              const isGiftCard = product.is_gift_card || product.isGiftCard || false;
              console.log('Product is gift card:', isGiftCard);
              
              // Create a normalized representation of the product data
              // Handle both snake_case and camelCase properties to ensure we get all values
              const formValues = {
                name: product.name || '',
                sallaUrl: product.salla_url || product.sallaUrl || '',
                maxUsers: isGiftCard ? 1 : (product.max_users ?? product.maxUsers ?? 1),
                infiniteUsers: product.infinite_users ?? product.infiniteUsers ?? false,
                expireDays: product.expire_days ?? product.expireDays ?? 30,
                infiniteExpiry: product.infinite_expiry ?? product.infiniteExpiry ?? false,
                twoFAEnabled: isGiftCard ? false : (product.two_fa_enabled ?? product.twoFAEnabled ?? false),
                limitTwoFAPerUser: product.limit_two_fa_per_user ?? product.limitTwoFAPerUser ?? false,
                twoFALimit: product.two_fa_limit ?? product.twoFALimit ?? 3,
                customReply: product.custom_reply || product.customReply || '',
                isPaused: product.is_paused ?? product.isPaused ?? false,
                isGiftCard: isGiftCard
              };
              
              // Reset the form with the values
              console.log('Resetting form with values:', formValues);
              form.reset(formValues);
              
              // Fetch accounts for this product
              const allAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
              const productAccounts = allAccounts.filter((account: any) => account.product_id === id);
              console.log('Found accounts for product:', productAccounts);
              setAccounts(productAccounts);
            } else {
              toast.error('Product not found');
              navigate('/products');
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          toast.error('Failed to load data');
        }
      };

      fetchData();
      
      // Set up an interval to automatically reload data every 2 seconds when editing
      const autoReloadInterval = setInterval(() => {
        if (isEditing) {
          console.log("Auto-reloading product data...");
          reloadProduct(false); // Pass false to prevent showing toast messages on auto-reload
        }
      }, 2000);
      
      // Clean up the interval when component unmounts
      return () => {
        clearInterval(autoReloadInterval);
      };
    } else {
      // For new product/store, set default values
      form.reset(getDefaultStoreValues());
    }
  }, [isEditing, isAdmin, form, id, navigate]);

  // Update the accounts display when isGiftCard changes
  useEffect(() => {
    // Only update if we're actually on the accounts tab
    const isGiftCardMode = form.watch('isGiftCard');
    console.log('Gift card mode:', isGiftCardMode);
    
    // No need to force re-renders by changing tabs
  }, [form.watch('isGiftCard')]);

  // Make sure we save form changes even when submitting directly
  const onSubmit = async (values: z.infer<typeof formSchema>, skipNavigation: boolean = false) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            name: values.name,
            salla_url: values.sallaUrl,
            max_users: values.maxUsers,
            infinite_users: values.infiniteUsers,
            expire_days: values.expireDays,
            infinite_expiry: values.infiniteExpiry,
            two_fa_enabled: values.twoFAEnabled,
            limit_two_fa_per_user: values.limitTwoFAPerUser,
            two_fa_limit: values.twoFALimit,
            custom_reply: values.customReply,
            is_paused: values.isPaused,
            is_gift_card: values.isGiftCard,
          },
        ]);

      if (error) {
        toast.error('Error saving product');
      } else {
        toast.success('Product saved successfully');
        if (!skipNavigation) navigate('/products');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  // This version is used with form.handleSubmit
  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    await onSubmit(values, false);
  };

  const handleDeleteItem = () => {
    if (confirm(`Are you sure you want to delete this ${isAdmin ? 'store' : 'product'}?`)) {
      try {
        // Get existing products from localStorage
        const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
        
        // Filter out the product to delete
        const updatedProducts = existingProducts.filter((product: any) => product.id !== id);
        
        // Save the updated products array
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        
        console.log('Deleted product with ID:', id);
        console.log('Updated products in localStorage:', updatedProducts);
        
        // Also delete any associated accounts
        if (!isAdmin) {
          const existingAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
          const updatedAccounts = existingAccounts.filter((account: any) => account.product_id !== id);
          localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
          console.log('Deleted associated accounts for product ID:', id);
        }
        
        toast.success(`${isAdmin ? 'Store' : 'Product'} deleted successfully`);
        navigate(isAdmin ? '/admin/stores' : '/products');
      } catch (error) {
        console.error('Error deleting:', error);
        toast.error(`Failed to delete ${isAdmin ? 'store' : 'product'}`);
      }
    }
  };

  const handleAddAccount = async () => {
    try {
      const isGiftCard = form.watch('isGiftCard');
      
      // Add validation for account fields
      if (isGiftCard) {
        if (!newAccount.code) {
          toast.error(t('Gift card code is required'));
          return;
        }
      } else {
        if (!newAccount.email || !newAccount.password) {
          toast.error(t('Email and password are required'));
          return;
        }
      }

      // When adding an account, check if it has a 2FA secret that needs validation
      if (newAccount.twoFASecret && !isGiftCard && form.watch('twoFAEnabled')) {
        console.log("Starting 2FA validation process with secret:", newAccount.twoFASecret);
        setAccountToValidate({
          ...newAccount,
          // Initialize an empty users array for new accounts
          users: []
        });
        setValidating2FA(true);
        return;
      }

      // If no 2FA secret or it's a gift card, proceed with saving
      await saveAccount({
        ...newAccount,
        // Initialize an empty users array for new accounts
        users: []
      });
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error('Failed to add account');
    }
  };

  const saveAccount = async (accountData: any) => {
    const isGiftCard = form.watch('isGiftCard');
    
    // Create new account with mock ID
    const newAccountWithId = {
      id: `account-${Date.now()}`,
      product_id: id || 'new',
      store_id: 'store-1', // This will come from the session later
      email: isGiftCard ? '' : accountData.email,
      password: isGiftCard ? '' : accountData.password,
      two_fa_secret: isGiftCard ? '' : accountData.twoFASecret,
      code: isGiftCard ? accountData.code : '',
      status: accountData.status,
      max_users: accountData.maxUsers,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Add users array
      users: accountData.users || []
    };
    
    // Save to local storage
    const existingAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    localStorage.setItem('accounts', JSON.stringify([...existingAccounts, newAccountWithId]));
    
    // Update accounts state
    setAccounts([...accounts, newAccountWithId]);
    setIsAddingAccount(false);
    setNewAccount({
      email: '',
      password: '',
      twoFASecret: '',
      code: '',
      status: 'active',
      maxUsers: 1
    });
    
    toast.success('Account added successfully');
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      // Remove from local storage
      const existingAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      const updatedAccounts = existingAccounts.filter((account: any) => account.id !== accountId);
      localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
      
      // Remove account from state
      setAccounts(accounts.filter(account => account.id !== accountId));
      toast.success('Account removed successfully');
    } catch (error) {
      console.error('Error removing account:', error);
      toast.error('Failed to remove account');
    }
  };

  // Add function to edit account
  const handleEditAccount = (accountId: string, updatedData: any) => {
    try {
      // Find the existing account to preserve users if not provided in updatedData
      const existingAccount = accounts.find(acc => acc.id === accountId);
      const updatedUserData = {
        ...updatedData,
        // Make sure users data is preserved, either from updated data or existing account
        users: updatedData.users || (existingAccount ? existingAccount.users || [] : [])
      };
      
      // Update in local storage
      const existingAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      const updatedAccounts = existingAccounts.map((account: any) => 
        account.id === accountId ? { ...account, ...updatedUserData } : account
      );
      localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
      
      // Update in state
      setAccounts(accounts.map(account => 
        account.id === accountId ? { ...account, ...updatedUserData } : account
      ));
      
      toast.success('Account updated successfully');
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Failed to update account');
    }
  };

  // Helper function to extract product ID from Salla URL
  const extractSallaProductId = (url: string) => {
    console.log('extractSallaProductId called with:', url);
    
    if (!url) {
      console.log('No URL provided to extractSallaProductId');
      return 'fallback-id';
    }
    
    try {
      // Handle basic format: https://salla.sa/store-name/product-name/p123456789
      const basicMatch = url.match(/\/p(\d+)$/);
      if (basicMatch) {
        console.log('URL matched basic pattern, extracted ID:', basicMatch[1]);
        return basicMatch[1];
      }
      
      // Handle query parameter format: ?product=123456789
      try {
        const urlObj = new URL(url);
        const productParam = urlObj.searchParams.get('product');
        if (productParam) {
          console.log('URL contained product parameter, extracted ID:', productParam);
          return productParam;
        }
      } catch (urlError) {
        console.warn('Error parsing URL:', urlError);
        // Continue with other extraction methods
      }
      
      // Handle other potential formats
      const pathSegments = url.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1];
      
      // If last segment starts with p and has numbers
      if (lastSegment && lastSegment.startsWith('p') && /\d/.test(lastSegment)) {
        const numericPart = lastSegment.replace(/^p/, '');
        if (numericPart) {
          console.log('Extracted numeric part from last segment:', numericPart);
          return numericPart;
        }
      }
      
      // If URL contains numbers, use those as a fallback
      const numericParts = url.match(/\d+/g);
      if (numericParts && numericParts.length > 0) {
        console.log('Using last numeric part as fallback:', numericParts[numericParts.length - 1]);
        return numericParts[numericParts.length - 1]; // Use the last numeric part
      }
      
      // No numeric ID found, generate a random one
      const fallbackId = `manual-${Date.now()}`;
      console.log('No ID patterns found, using fallback ID:', fallbackId);
      return fallbackId;
    } catch (error) {
      console.error('Error extracting product ID from URL:', error);
      // Return a timestamp as fallback
      return `fallback-${Date.now()}`;
    }
  };

  // Add this function to handle starting account edit
  const startEditAccount = (account: any) => {
    const isGiftCard = form.watch('isGiftCard');
    
    setEditingAccount(account.id);
    setEditedAccount({
      email: account.email || '',
      password: account.password || '',
      twoFASecret: account.two_fa_secret || '',
      code: account.code || '',
      maxUsers: account.max_users || 1,
      status: account.status || 'active',
      // Add users data
      users: account.users || []
    });
  };

  // Add this function to handle saving account edits
  const saveAccountEdit = () => {
    if (!editingAccount || !editedAccount) return;
    const isGiftCard = form.watch('isGiftCard');
    
    handleEditAccount(editingAccount, {
      email: isGiftCard ? '' : editedAccount.email,
      password: isGiftCard ? '' : editedAccount.password,
      two_fa_secret: isGiftCard ? '' : editedAccount.twoFASecret,
      code: isGiftCard ? editedAccount.code : '',
      max_users: editedAccount.maxUsers,
      status: editedAccount.status,
      // Preserve users data
      users: editedAccount.users || []
    });
    
    setEditingAccount(null);
    setEditedAccount(null);
  };

  // Add this function to handle canceling account edit
  const cancelAccountEdit = () => {
    setEditingAccount(null);
    setEditedAccount(null);
  };

  // Handle 2FA toggle
  const handle2FAToggle = (enabled: boolean) => {
    console.log("2FA toggled:", enabled);
    form.setValue('twoFAEnabled', enabled);
  };

  // Add this function to handle gift card toggle
  const handleGiftCardToggle = (enabled: boolean) => {
    if (enabled) {
      // If enabling gift card, disable 2FA and set max users to 1
      form.setValue('twoFAEnabled', false);
      form.setValue('maxUsers', 1);
      form.setValue('infiniteUsers', false);
      form.setValue('infiniteExpiry', false);
      form.setValue('expireDays', 30);
      
      // Convert existing accounts to gift card codes if any exist
      if (accounts.length > 0) {
        const updatedAccounts = accounts.map(account => {
          // For existing regular accounts, if they have no code, create one from email
          const code = account.code || 
                      (account.email ? `GC-${account.email.split('@')[0]}-${Date.now().toString().slice(-4)}` : 
                      `GC-${Date.now()}`);
          
          return {
            ...account,
            code: code,
            // Clear regular account fields for gift cards
            email: '',
            password: '',
            two_fa_secret: ''
          };
        });
        
        // Update accounts in state and localStorage
        setAccounts(updatedAccounts);
        
        // Update in localStorage
        const allAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        const updatedAllAccounts = allAccounts.map(account => 
          accounts.some(a => a.id === account.id) ? 
            updatedAccounts.find(ua => ua.id === account.id) : 
            account
        );
        localStorage.setItem('accounts', JSON.stringify(updatedAllAccounts));
        
        toast.success(t('Converted accounts to gift card codes'));
      }
    }
    form.setValue('isGiftCard', enabled);
  };

  // Handle infinite users toggle
  const handleInfiniteUsersToggle = (enabled: boolean) => {
    if (enabled) {
      // If enabling infinite users, clear the max users value
      form.setValue('maxUsers', null);
    } else {
      // If disabling infinite users, set a default value
      form.setValue('maxUsers', 1);
    }
    form.setValue('infiniteUsers', enabled);
  };

  // Handle infinite expiry toggle
  const handleInfiniteExpiryToggle = (enabled: boolean) => {
    if (enabled) {
      // If enabling infinite expiry, clear the expiry days value
      form.setValue('expireDays', null);
    } else {
      // If disabling infinite expiry, set a default value
      form.setValue('expireDays', 30);
    }
    form.setValue('infiniteExpiry', enabled);
  };

  // Check if an account is a gift card code
  const isGiftCardAccount = (account: any) => {
    return form.watch('isGiftCard') || account.code;
  };

  // Update an account's user list
  const handleUpdateUsers = (accountId: string, updatedUsers: User[]) => {
    try {
      // Update in local storage
      const existingAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      const updatedAccounts = existingAccounts.map((account: any) => 
        account.id === accountId ? { ...account, users: updatedUsers } : account
      );
      localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
      
      // Update in state
      setAccounts(accounts.map(account => 
        account.id === accountId ? { ...account, users: updatedUsers } : account
      ));
      
      // Update selected account if it's currently being displayed
      if (selectedAccount && selectedAccount.id === accountId) {
        setSelectedAccount({ ...selectedAccount, users: updatedUsers });
      }
      
      toast.success('Account users updated successfully');
    } catch (error) {
      console.error('Error updating account users:', error);
      toast.error('Failed to update account users');
    }
  };

  // Delete a user from an account
  const handleDeleteUser = (accountId: string, userNumber: string) => {
    try {
      const account = accounts.find(a => a.id === accountId);
      if (!account || !account.users) return;
      
      const updatedUsers = account.users.filter((user: User) => user.number !== userNumber);
      handleUpdateUsers(accountId, updatedUsers);
      
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Reset 2FA limit for a user
  const handleResetUserTwoFALimit = (accountId: string, userNumber: string) => {
    try {
      const account = accounts.find(a => a.id === accountId);
      if (!account || !account.users) return;
      
      const updatedUsers = account.users.map((user: User) => {
        if (user.number === userNumber) {
          return {
            ...user,
            code_claimed: 1, // Reset to 1
            timestamp_code: new Date().toISOString() // Update timestamp
          };
        }
        return user;
      });
      
      handleUpdateUsers(accountId, updatedUsers);
      
      toast.success('User 2FA limit reset successfully');
    } catch (error) {
      console.error('Error resetting user 2FA limit:', error);
      toast.error('Failed to reset user 2FA limit');
    }
  };

  // Open the user management dialog
  const openUserManagement = (account: any) => {
    setSelectedAccount(account);
    // Initialize users array if it doesn't exist
    if (!account.users) {
      handleUpdateUsers(account.id, []);
    }
    setShowUserManagement(true);
  };

  const formTitle = isAdmin
    ? isEditing ? 'Edit Store' : 'Create New Store'
    : isEditing ? 'Edit Product' : 'Create New Product';

  function getDefaultStoreValues() {
    if (isDemoAccount()) {
      return {
        name: 'Demo Store',
        sallaUrl: 'https://example.salla.sa/product/123456',
        maxUsers: 100,
        infiniteUsers: false,
        expireDays: 30,
        infiniteExpiry: false,
        twoFAEnabled: true,
        limitTwoFAPerUser: true,
        twoFALimit: 3,
        customReply: 'Thank you for your purchase! Your account details will be sent to you shortly.',
        isPaused: false,
        isGiftCard: false
      };
    }
    
    return {
      name: '',
      sallaUrl: '',
      maxUsers: 1,
      infiniteUsers: false,
      expireDays: 30,
      infiniteExpiry: false,
      twoFAEnabled: false,
      limitTwoFAPerUser: false,
      twoFALimit: null,
      customReply: '',
      isPaused: false,
      isGiftCard: false
    };
  }

  useEffect(() => {
    // When the component is initially loaded and we're not editing an existing product,
    // make sure the form is properly reset with default values
    if (!isEditing) {
      console.log("New product form - resetting to defaults");
      const defaultValues = getDefaultStoreValues();
      console.log("Default values:", defaultValues);
      form.reset(defaultValues);
    }
  }, []);

  // Force reload the stored product on refresh or when returning to the form
  const reloadProduct = async (showToast: boolean = true) => {
    if (isEditing) {
      try {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const product = products.find((p: any) => p.id === id);
        
        if (product) {
          console.log("Reloading product data:", product);
          // Create a consistent mapping of data
          const formData = {
            name: product.name || '',
            sallaUrl: product.salla_url || product.sallaUrl || '',
            maxUsers: product.max_users ?? product.maxUsers ?? 1,
            infiniteUsers: product.infinite_users ?? product.infiniteUsers ?? false,
            expireDays: product.expire_days ?? product.expireDays ?? 30,
            infiniteExpiry: product.infinite_expiry ?? product.infiniteExpiry ?? false,
            twoFAEnabled: product.two_fa_enabled ?? product.twoFAEnabled ?? false,
            limitTwoFAPerUser: product.limit_two_fa_per_user ?? product.limitTwoFAPerUser ?? false,
            twoFALimit: product.two_fa_limit ?? product.twoFALimit ?? 3,
            customReply: product.custom_reply || product.customReply || '',
            isPaused: product.is_paused ?? product.isPaused ?? false,
            isGiftCard: product.is_gift_card ?? product.isGiftCard ?? false
          };
          
          console.log("Resetting form with data:", formData);
          form.reset(formData);
          
          // Also reload accounts
          const allAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
          const productAccounts = allAccounts.filter((account: any) => account.product_id === id);
          setAccounts(productAccounts);
          
          if (showToast) {
            toast.success('Product data reloaded');
          }
        }
      } catch (error) {
        console.error('Error reloading product:', error);
        if (showToast) {
          toast.error('Failed to reload product data');
        }
      }
    }
  };

  // Add effect to refresh when the window gets focus
  useEffect(() => {
    if (isEditing) {
      // Define the event handler
      const handleWindowFocus = () => {
        console.log("Window focused, automatically reloading product data");
        reloadProduct(false);
      };
      
      // Add event listener for window focus
      window.addEventListener('focus', handleWindowFocus);
      
      // Clean up
      return () => {
        window.removeEventListener('focus', handleWindowFocus);
      };
    }
  }, [isEditing, id]);

  return (
    <MainLayout isAdmin={isAdmin}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(isAdmin ? '/admin/stores' : '/products')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{t(formTitle)}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing && (
              <Button variant="destructive" onClick={handleDeleteItem}>
                <Trash className="h-4 w-4 mr-2" />
                {t('Delete')}
              </Button>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="details">{t('Details')}</TabsTrigger>
            {isEditing && !isAdmin && (
              <TabsTrigger value="accounts">
                {form.watch('isGiftCard') ? t('Codes') : t('Accounts')}
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 mt-6">
            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit(handleFormSubmit)} 
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{t('Basic Information')}</CardTitle>
                    <CardDescription>
                      {t(isAdmin ? 'Configure the basic settings for your store' : 'Configure the basic settings for your product')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('Name')}</FormLabel>
                          <FormControl>
                            <Input placeholder={isAdmin ? t("Store name") : t("Product name")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sallaUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('Product URL in Salla - رابط المنتج في سلة')}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://salla.sa/store-name/product-name/p123456789" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('Enter the Salla product URL to automatically extract the product code')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
          <FormField
  control={form.control}
  name="enableFileDelivery"
  render={({ field }) => (
    <FormItem>
      <FormLabel>تسليم ملف؟</FormLabel>
      <FormControl>
        <Switch
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <FormDescription>إذا فعلت هذا، سيتم تسليم ملف بدل الحساب</FormDescription>
    </FormItem>
  )}
/>

{form.watch("enableFileDelivery") && (
  <div className="mt-4">
    <FormLabel>رفع الملف</FormLabel>
    <Input
      type="file"
      accept=".pdf,.doc,.docx"
      onChange={(e) => {
        const uploaded = e.target.files?.[0];
        if (uploaded && uploaded.size <= 2 * 1024 * 1024) {
          setFile(uploaded);
        } else {
          toast({ title: "حجم الملف يجب ألا يزيد عن 2 ميغابايت" });
          e.target.value = ''; // clear input
        }
      }}
    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="infiniteUsers"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  {t('Infinite Users')}
                                </FormLabel>
                                <FormDescription>
                                  {t('Allow unlimited users for this product')}
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    handleInfiniteUsersToggle(checked);
                                  }}
                                  disabled={form.watch('isGiftCard')}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="maxUsers"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('Max Users')}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  {...field} 
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                  disabled={form.watch('infiniteUsers') || form.watch('isGiftCard')}
                                />
                              </FormControl>
                              <FormDescription>
                                {form.watch('infiniteUsers') 
                                  ? t('Unlimited users allowed') 
                                  : t('Maximum number of users allowed')}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="infiniteExpiry"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  {t('Never Expires')}
                                </FormLabel>
                                <FormDescription>
                                  {t('Product never expires')}
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    handleInfiniteExpiryToggle(checked);
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="expireDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('Expire Days')}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  {...field} 
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                  disabled={form.watch('infiniteExpiry')}
                                />
                              </FormControl>
                              <FormDescription>
                                {form.watch('infiniteExpiry') 
                                  ? t('Product never expires') 
                                  : t('Number of days until expiration')}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>{t('Advanced Settings')}</CardTitle>
                    <CardDescription>
                      {t(isAdmin ? 'Configure additional options for your store' : 'Configure additional options for your product')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isGiftCard"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('Gift Card Product')}
                            </FormLabel>
                            <FormDescription>
                              {t('Enable if this product is a gift card (code only, no email/password)')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                handleGiftCardToggle(checked);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="twoFAEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('Enable Two-Factor Authentication')}
                            </FormLabel>
                            <FormDescription>
                              {t(isAdmin ? 'Require 2FA for this store' : 'Require 2FA for this product')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                handle2FAToggle(checked);
                              }}
                              disabled={form.watch('isGiftCard')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="limitTwoFAPerUser"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('Limit 2FA Per User')}
                            </FormLabel>
                            <FormDescription>
                              {t('Limit how many 2FA codes a user can get')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!form.watch('twoFAEnabled')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {form.watch('limitTwoFAPerUser') && form.watch('twoFAEnabled') && (
                      <FormField
                        control={form.control}
                        name="twoFALimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('2FA Code Limit')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                {...field} 
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                              />
                            </FormControl>
                            <FormDescription>
                              {t('Maximum number of 2FA codes a user can get')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
                
                <div className="flex justify-end gap-4">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => navigate(isAdmin ? '/admin/stores' : '/products')}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button 
                    variant="secondary"
                    type="button" 
                    onClick={() => {
                      // Save current form state without leaving the page
                      const values = form.getValues();
                      onSubmit(values as z.infer<typeof formSchema>, true);
                      // Prevent navigation to list page
                      return false;
                    }}
                  >
                    {t('Save')}
                  </Button>
                  <Button type="submit">
                    {isEditing ? t('Update') : t('Create')}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          {isEditing && !isAdmin && (
            <TabsContent value="accounts" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{form.watch('isGiftCard') ? t('Manage Gift Card Codes') : t('Manage Accounts')}</span>
                    <Button 
                      size="sm" 
                      onClick={() => setIsAddingAccount(true)}
                      disabled={isAddingAccount}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {form.watch('isGiftCard') ? t('Add Code') : t('Add Account')}
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {form.watch('isGiftCard') 
                      ? t('Add and manage gift card codes for this product') 
                      : t('Add and manage accounts for this product')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {form.watch('isGiftCard') ? (
                            <TableHead>{t('Gift Card Code')}</TableHead>
                          ) : (
                            <>
                              <TableHead>{t('Email')}</TableHead>
                              <TableHead>{t('Password')}</TableHead>
                              <TableHead>{t('2FA Secret')}</TableHead>
                            </>
                          )}
                          <TableHead>{t('Status')}</TableHead>
                          <TableHead className="text-right">{t('Actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isAddingAccount && (
                          <TableRow>
                            {form.watch('isGiftCard') ? (
                              <TableCell>
                                <Input
                                  value={newAccount.code}
                                  onChange={(e) => setNewAccount({...newAccount, code: e.target.value})}
                                  placeholder={t('Enter gift card code')}
                                />
                              </TableCell>
                            ) : (
                              <>
                                <TableCell>
                                  <Input
                                    value={newAccount.email}
                                    onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                                    placeholder={t('Email')}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="relative">
                                    <Input
                                      value={newAccount.password}
                                      onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                                      placeholder={t('Password')}
                                      type={showPassword ? "text" : "password"}
                                      className="pr-10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                      {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={newAccount.twoFASecret}
                                    onChange={(e) => setNewAccount({...newAccount, twoFASecret: e.target.value})}
                                    placeholder={`${t('2FA Secret')} (${t('optional')})`}
                                  />
                                </TableCell>
                              </>
                            )}
                            <TableCell>
                              <select
                                value={newAccount.status}
                                onChange={(e) => setNewAccount({...newAccount, status: e.target.value})}
                                className="w-full p-2 border rounded bg-background text-foreground border-border"
                              >
                                <option value="active">{t('Active')}</option>
                                <option value="paused">{t('Paused')}</option>
                                <option value="full">{t('Full')}</option>
                              </select>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="icon" variant="ghost" onClick={() => handleAddAccount()}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setIsAddingAccount(false)}>
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        
                        {accounts.length > 0 ? (
                          accounts.map((account) => (
                            <TableRow key={account.id}>
                              {isGiftCardAccount(account) ? (
                                <TableCell>
                                  {editingAccount === account.id ? (
                                    <Input
                                      value={editedAccount.code}
                                      onChange={(e) => setEditedAccount({...editedAccount, code: e.target.value})}
                                      placeholder={t('Enter gift card code')}
                                    />
                                  ) : (
                                    account.code
                                  )}
                                </TableCell>
                              ) : (
                                <>
                                  <TableCell>
                                    {editingAccount === account.id ? (
                                      <Input
                                        value={editedAccount.email}
                                        onChange={(e) => setEditedAccount({...editedAccount, email: e.target.value})}
                                        placeholder="Email"
                                      />
                                    ) : (
                                      account.email
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {editingAccount === account.id ? (
                                      <div className="relative">
                                        <Input
                                          value={editedAccount.password}
                                          onChange={(e) => setEditedAccount({...editedAccount, password: e.target.value})}
                                          placeholder="Password"
                                          type={showEditPassword ? "text" : "password"}
                                          className="pr-10"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setShowEditPassword(!showEditPassword)}
                                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                          {showEditPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                          ) : (
                                            <Eye className="h-4 w-4" />
                                          )}
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="password-mask">••••••••</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {editingAccount === account.id ? (
                                      <Input
                                        value={editedAccount.twoFASecret}
                                        onChange={(e) => setEditedAccount({...editedAccount, twoFASecret: e.target.value})}
                                        placeholder="2FA Secret (optional)"
                                      />
                                    ) : (
                                      account.two_fa_secret ? (
                                        <span className="password-mask">••••••</span>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )
                                    )}
                                  </TableCell>
                                </>
                              )}
                              <TableCell>
                                {editingAccount === account.id ? (
                                  <select
                                    value={editedAccount.status}
                                    onChange={(e) => setEditedAccount({...editedAccount, status: e.target.value})}
                                    className="w-full p-2 border rounded bg-background text-foreground border-border"
                                  >
                                    <option value="active">{t('Active')}</option>
                                    <option value="paused">{t('Paused')}</option>
                                    <option value="full">{t('Full')}</option>
                                  </select>
                                ) : (
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    account.status === 'active' ? 'bg-emerald-900 text-emerald-100 border border-emerald-700' :
                                    account.status === 'paused' ? 'bg-amber-900 text-amber-100 border border-amber-700' :
                                    'bg-rose-900 text-rose-100 border border-rose-700'
                                  }`}>
                                    {account.status}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {editingAccount === account.id ? (
                                    <>
                                      <Button size="icon" variant="ghost" onClick={saveAccountEdit}>
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button size="icon" variant="ghost" onClick={cancelAccountEdit}>
                                        <Trash className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button size="icon" variant="ghost" onClick={() => startEditAccount(account)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDeleteAccount(account.id)}
                                      >
                                        <Trash className="h-4 w-4 text-destructive" />
                                      </Button>
                                      {/* Add View Users button for regular accounts (not gift cards) */}
                                      {!isGiftCardAccount(account) && (
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => openUserManagement(account)}
                                          title={t('View Users')}
                                        >
                                          <UsersIcon className="h-4 w-4 text-blue-400" />
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={form.watch('isGiftCard') ? 3 : 5} className="text-center py-6">
                              <p>{form.watch('isGiftCard') ? t('No gift card codes found') : t('No accounts found')}</p>
                              <Button
                                variant="outline"
                                className="mt-2"
                                onClick={() => setIsAddingAccount(true)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                {form.watch('isGiftCard') ? t('Add Code') : t('Add Account')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
      {/* Add the 2FA validation modal for new accounts */}
      <TwoFactorValidation
        isOpen={validating2FA}
        onClose={() => {
          setValidating2FA(false);
          setAccountToValidate(null);
        }}
        onValidate={async (isValid) => {
          // Handle account 2FA validation
          if (isValid && accountToValidate) {
            await saveAccount(accountToValidate);
          }
          setValidating2FA(false);
          setAccountToValidate(null);
        }}
        secret={accountToValidate?.twoFASecret || ''}
      />
      
      {/* Add the user management dialog */}
      {selectedAccount && (
        <UserManagementDialog
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
          accountName={selectedAccount.email || selectedAccount.code || ''}
          accountId={selectedAccount.id}
          users={selectedAccount.users || []}
          onDeleteUser={handleDeleteUser}
          onResetUserTwoFALimit={handleResetUserTwoFALimit}
          onUpdateUsers={handleUpdateUsers}
        />
      )}
      
      {isDemoAccount() && (
        <div className="rounded-md bg-yellow-500/10 p-3 text-yellow-600 border border-yellow-200 dark:border-yellow-900 dark:text-yellow-400 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <p className="text-sm">{t("Demo Mode: The data shown is sample data. In a real environment, this would display actual product data from your store.")}</p>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
