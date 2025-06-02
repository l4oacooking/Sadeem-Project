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
import { ArrowLeft, Trash, Plus, Edit, Check, X, AlertCircle, Users as UsersIcon, Eye, EyeOff, ShoppingCart } from 'lucide-react';
import { Label } from '@/components/ui/label';  
import TwoFactorValidation from '@/components/TwoFactorValidation';
import UserManagementDialog from '@/components/UserManagementDialog';
import { useTranslation } from '@/hooks/use-translation';
import { supabase } from '../supabaseClient'; // Ensure this import is at the top
import CryptoJS from 'crypto-js';
import { encrypt, decrypt } from '@/lib/crypto';
import { Navigate } from 'react-router-dom';
import sendOutOfStockAlert from '@/api/send-email';
import ProductPicker from '@/components/ProductPicker';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const storeId = localStorage.getItem('store_id');
  if (!storeId) {
    return <Navigate to="/login" replace />;
  }
  return children;
};
const toggleItemStyle = "w-full border border-white rounded-md bg-black text-white hover:bg-white/5";

const ENCRYPTION_KEY ='789b4694b0df4c1b8535aaca7e1fe217c5523714277c3dc366b536b6e3d208be';
interface ProductFormProps {
  isAdmin?: boolean;
}

// Define the User type
interface User {
  number: string;
  code_claimed?: number;
  timestamp_code?: string;
}


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
  twoFAType: z.enum(['email', 'totp']).default('totp'),  // Two-factor authentication type (Email or TOTP)
  emailProvider: z.string().min(1, { message: "Please select an email provider" }),  // Email provider is now required
  email: z.string()
  .refine(value => value.includes('@') && value.includes('.'), {
    message: "Must contain @ and a domain (.)"
  })
  .optional(),
  account_type: z.enum(['PlayStation", "Steam", "Chatgpt", "Spotify", "Canva", "GamePass']).default('steam'),
  enableFileDelivery: z.boolean().default(false),
  
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
  fileUrl: z.string().optional(), // ✅ this is the Supabase file URL you saved
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
async function checkIfAllAccountsFull(productId: string, storeId: string) {
  const { data: allAccounts, error } = await supabase
    .from('accounts')
    .select('status')
    .eq('product_id', productId)
    .eq('store_id', storeId);

  if (error) return;

  const allFull = allAccounts.length > 0 && allAccounts.every(acc => acc.status === 'full');

  if (allFull) {
    const { data: existingAlert } = await supabase
      .from('alerts')
      .select('id')
      .eq('store_id', storeId)
      .eq('product_id', productId)
      .eq('type', 'out_of_stock')
      .eq('dismissed', false)
      .maybeSingle();

    if (!existingAlert) {
      await supabase.from('alerts').insert([
        {
          store_id: storeId,
          product_id: productId,
          type: 'out_of_stock',
          message: 'تنبيه: المنتج نفدت حساباته تماماً.',
        },
      ]);
      // TODO: send email + WhatsApp notification here
    }
  }
}

export default function ProductForm({ isAdmin = false }: ProductFormProps) {
  const navigate = useNavigate();
useEffect(() => {
  const storeId = localStorage.getItem('store_id');
  const isSuperadmin = localStorage.getItem('superadmin');
  if (!storeId && !isSuperadmin) {
    navigate('/login');
  }
  
}, [navigate]);
  const { id } = useParams();
  const isEditing = !!id;
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number, name: string, image: string } | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [accountType, setAccountType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false); 
const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
const [visibleAppPasswords, setVisibleAppPasswords] = useState<Record<string, boolean>>({});
const [showEditAppPassword, setShowEditAppPassword] = useState(false);
  const [twoFAType, setTwoFAType] = useState('');
  const [emailProvider, setEmailProvider] = useState('');
  const [twoFAEmailSender, setTwoFAEmailSender] = useState('');
  const [newAccount, setNewAccount] = useState({
    
    email: '',
    password: '',
    twoFASecret: '',
    appPassword: '', // ✅ جديد
    twoFAEmail: '', // ✅ جديد
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

const { t, language, rtl } = useTranslation();

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      twoFAType: 'totp',  // Default value for 2FA type
      platform: 'steam', // Default platform
      emailProvider: '', // Default empty email provider
    },
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
              const storeId = localStorage.getItem('store_id');
                    const { data, error } = await supabase
                      .from('products')
                      .select('*')
                      .eq('id', id)
                      .single();

              if (error || !data) {
                toast.error('Product not found in Supabase');
                navigate('/products');
                return;
              }

              form.reset({
                
                name: data.name,
                sallaUrl: data.salla_url,
                maxUsers: data.max_users ?? 1,
                infiniteUsers: data.infinite_users,
                expireDays: data.expire_days,
                infiniteExpiry: data.infinite_expiry,
                twoFAEnabled: data.two_fa_enabled,
                limitTwoFAPerUser: data.limit_two_fa_per_user,
                twoFALimit: data.two_fa_limit,
                customReply: data.custom_reply,
                isPaused: data.is_paused,
                twoFAType: data.two_fa_type ?? 'totp',
                emailProvider: data.email_provider ?? '',
                email: data.two_fa_email_sender ?? '', 
                account_type: data.account_type ?? 'steam',
                isGiftCard: data.is_gift_card,
                enableFileDelivery: data.enable_file_delivery || false,
                file: undefined, // ❌ don't try to fake a File
                fileUrl: data.file_url || undefined, // leave file blank initially
              });
              return;
            }

            const productsStr = localStorage.getItem('products');
            const products = JSON.parse(productsStr || '[]');
            const product = products.find((p: any) => p.id === id);

            if (product) {
              const isGiftCard = product.is_gift_card || product.isGiftCard || false;
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
              form.reset(formValues);

              const allAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
              const productAccounts = allAccounts
              .filter((account: any) => account.product_id === id)
              .map((account: any) => ({
                ...account,
                email: account.email ? decrypt(account.email) : '',
                password: account.password ? decrypt(account.password) : '',
                two_fa_secret: account.two_fa_secret ? decrypt(account.two_fa_secret) : '',
              }));
            
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
    } else {
      form.reset(getDefaultStoreValues());
    }
  }, [isEditing, isAdmin, form, id, navigate]);
      // Set up an interval to automatically reload data every 2 seconds when editing
      const autoReloadInterval = setInterval(() => {
        console.log("Auto-reloading product data...");
        reloadProduct(false);
      }, 200000);
    
  // Update the accounts display when isGiftCard changes
  useEffect(() => {
    // Only update if we're actually on the accounts tab
    const isGiftCardMode = form.watch('isGiftCard');
    console.log('Gift card mode:', isGiftCardMode);
    
    // No need to force re-renders by changing tabs
  }, [form.watch('isGiftCard')]);

  // Make sure we save form changes even when submitting directly
  function extractProductId(sallaUrl: string) {
    const match = sallaUrl.match(/p(\d+)$/);
    return match ? match[1] : '';
  }
async function uploadFileToSupabase(file: File, productId: string) {
  const storeId = localStorage.getItem('store_id');
  const fileExt = file.name.split('.').pop();
  const filePath = `${storeId}/${productId}/${Date.now()}.${fileExt}`;
  if (!file) throw new Error("No file selected!");

  console.log("Uploading file:", file.name, file.type, file.size);
  const { error } = await supabase.storage
    .from('productfiles') // bucket name
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw new Error('File upload failed');
  }

  // هذا الذي يخزن في file_url (مجرد المسار، وليس رابط كامل)
  return filePath;
}
const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
  try {
    await onSubmit(values);
    toast.success('Product created successfully!');
    navigate('/products');
  } catch (error) {
    console.error('Submission error:', error);
    toast.error('Failed to create product. Please check your inputs.');
  }
};
// إضافة أو تحديث المنتج، مع رفع أو حذف الملف حسب الحالة
const onSubmit = async (values: z.infer<typeof formSchema>, skipNavigation: boolean = false) => {
  try {
    const storeId = localStorage.getItem('store_id');
    const productId = id; // إذا كنت تعدل منتج موجود

    let uploadedFileUrl = values.fileUrl ?? null;
    let maxUsersToSave = values.infiniteUsers ? null : (values.maxUsers ?? 1);
    // (1) رفع ملف جديد إذا فعّلت file delivery ورفعت ملف جديد
    if (values.enableFileDelivery && file && !uploadedFileUrl) {
      try {
        uploadedFileUrl = await uploadFileToSupabase(file, id ?? 'new');
        form.setValue('fileUrl', uploadedFileUrl); // مهم للواجهة فقط
      } catch (err) {
        toast.error('File upload failed, please try again');
        return; // أوقف العملية
      }
    }

    // (2) حذف الملف من Supabase إذا عطّلت file delivery أو حذفته
    if (!values.enableFileDelivery && values.fileUrl) {
      await supabase.storage.from('productfiles').remove([values.fileUrl]);
      uploadedFileUrl = null; // امسح المتغير قبل الحفظ
      form.setValue('fileUrl', null);
    }

    // (3) تحديث منتج موجود
    if (productId) {
      const { error } = await supabase
        .from('products')
        .update({
          name: values.name,
          salla_url: values.sallaUrl,
          max_users: maxUsersToSave,
          infinite_users: values.infiniteUsers,
          expire_days: values.expireDays,
          infinite_expiry: values.infiniteExpiry,
          two_fa_enabled: values.twoFAEnabled,
          limit_two_fa_per_user: values.limitTwoFAPerUser,
          two_fa_limit: values.twoFALimit,
          custom_reply: values.customReply,
          is_paused: values.isPaused,
          is_gift_card: values.isGiftCard,
          enable_file_delivery: values.enableFileDelivery,
          file_url: uploadedFileUrl || null, // دائما استخدم المسار المحدث
          two_fa_type: values.twoFAType,
          email_provider: values.emailProvider,
          two_fa_email_sender: values.email,
          account_type: values.account_type,
        })
        .eq('id', productId);

      if (error) {
        console.error('Supabase update error:', error);
        toast.error('Error updating product: ' + error.message);
        return;
      }
 if (maxUsersToSave !== null) {
    const { error: accountsUpdateError } = await supabase
      .from('accounts')
      .update({ max_users: maxUsersToSave })
      .eq('product_id', productId);

    if (accountsUpdateError) {
      toast.error('حدث خطأ أثناء تحديث عدد المستخدمين للحسابات');
      // فقط سجل الخطأ، لا توقف العملية
      console.error('Accounts max_users update error:', accountsUpdateError);
    }
  }
      toast.success('Product updated successfully');
    } else {
      // (4) إضافة منتج جديد
      const extractedProductId = extractSallaProductId(values.sallaUrl);

      const { data, error } = await supabase
        .from('products')
        .insert([{
          store_id: storeId,
          product_id: extractedProductId,
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
          enable_file_delivery: values.enableFileDelivery,
          file_url: uploadedFileUrl || null,
          two_fa_type: values.twoFAType,
          email_provider: values.emailProvider,
          two_fa_email_sender: values.email,
        }])
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        toast.error('Error creating product: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        toast.error('Failed to receive product data after insert.');
        return;
      }

      toast.success('Product created successfully');
      navigate('/products', { replace: true });
    }

    if (!skipNavigation) {
      navigate('/products');
    }
  } catch (error) {
    console.error('Error:', error);
    toast.error('An unexpected error occurred');
  }
};

// حذف منتج مع حذف الملف من Supabase لو كان موجود
const handleDeleteItem = async (productId: string) => {
  const confirmed = window.confirm('هل أنت متأكد من حذف هذا المنتج؟');
  if (!confirmed) return;

  // Get store_id (from session/localStorage or JWT if needed)
  const storeId = localStorage.getItem('store_id');

  // Optional: log it for debugging
  console.log('Deleting product', productId, 'with store_id', storeId);

  // Call Supabase to delete the product
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('store_id', storeId);

  if (error) {
    console.error('Error deleting product:', error);
    alert('خطأ أثناء حذف المنتج: ' + error.message);
    return;
  }

  alert('تم حذف المنتج بنجاح');
    navigate('/products', { replace: true });
};
// لإرسال الرابط المباشر للعميل (مثال)
function getDirectFileUrl(fileUrl: string | null) {
  if (!fileUrl) return null;
  return `https://rrmrownqurlhnngqeoqm.supabase.co/storage/v1/object/public/productfiles/${fileUrl}`;
}
  const handleAddAccount = async () => {
    try {
      const isGiftCard = form.watch('isGiftCard');
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
  
      if (newAccount.twoFASecret && !isGiftCard && form.watch('twoFAEnabled')) {
        setAccountToValidate({
          ...newAccount,
          users: [],
        });
        setValidating2FA(true);
        return;
      }
  
      await saveAccount({
        ...newAccount,
        users: []
      });
  
      await checkOutOfStockAlert(id!, storeId!, form.getValues().name);
  
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error('Failed to add account');
    }
  };
  
/* ───────────────────── saveAccount (جديد) ───────────────────── */
const saveAccount = async (accountData: any) => {
  const isGiftCard = form.watch("isGiftCard");
  const storeId   = localStorage.getItem("store_id");

  /* ► 1. تكوين الحمولة المُشفَّرة لإرسالها إلى Supabase */
  const payload = {
    product_id   : id,
    store_id     : storeId,
    email        : isGiftCard ? "" : encrypt(accountData.email),
    password     : isGiftCard ? "" : encrypt(accountData.password),
    two_fa_secret:
      isGiftCard
        ? ""
        : form.watch("twoFAType") === "totp"
        ? encrypt(accountData.twoFASecret)
        : "",
    fa_email     : form.watch("twoFAType") === "email" ? accountData.twoFAEmail : "",
    fa_app_pass  : form.watch("twoFAType") === "email" ? accountData.appPassword : "",
    fa_type      : form.watch("twoFAType"),
    code         : isGiftCard ? encrypt(accountData.code) : "",
    status       : accountData.status,
    max_users    : form.watch("maxUsers") || 1,
    created_at   : new Date().toISOString(),
    updated_at   : new Date().toISOString(),
    users        : accountData.users || [],
  };

  /* ► 2. الحفظ في Supabase واسترجاع الـ id الجديد */
  const { data, error } = await supabase
    .from("accounts")
    .insert([payload])
    .select("id")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    toast.error("Error saving account: " + error.message);
    return;
  }

  /* ► 3. إنشاء نسخة محليّة (plain / مفكَّكة التشفير) للعرض */
  const localAccount = {
    ...payload,
    id          : data.id,
    email       : accountData.email,
    password    : accountData.password,
    two_fa_secret:
      form.watch("twoFAType") === "totp" ? accountData.twoFASecret : "",
    twoFAEmail  : form.watch("twoFAType") === "email" ? accountData.twoFAEmail : "",
    appPassword : form.watch("twoFAType") === "email" ? accountData.appPassword : "",
  };

  /* ► 4. تحديث الحالة والـ UI */
  setAccounts((prev) => [...prev, localAccount]);
  setIsAddingAccount(false);
  setNewAccount({
    email: "",
    password: "",
    twoFASecret: "",
    twoFAEmail: "",
    appPassword: "",
    code: "",
    status: "active",
    maxUsers: 1,
  });
  toast.success("Account added successfully");
};

/* ────────────────── handleEditAccount (جديد) ────────────────── */
const handleEditAccount = async (accountId: string, updatedData: any) => {
  try {
    const isGiftCard = form.watch("isGiftCard");

    /* ► 1. تكوين البيانات المُشفَّرة لإرسالها إلى Supabase */
    const payload = {
      email        : isGiftCard ? "" : encrypt(updatedData.email),
      password     : isGiftCard ? "" : encrypt(updatedData.password),
      two_fa_secret:
        isGiftCard
          ? ""
          : form.watch("twoFAType") === "totp"
          ? encrypt(updatedData.twoFASecret)
          : "",
      fa_email     : form.watch("twoFAType") === "email" ? updatedData.twoFAEmail : "",
      fa_app_pass  : form.watch("twoFAType") === "email" ? updatedData.appPassword : "",
      fa_type      : form.watch("twoFAType"),
      code         : isGiftCard ? encrypt(updatedData.code) : "",
      status       : updatedData.status,
      max_users    : updatedData.maxUsers,
      users        : updatedData.users || [],
      updated_at   : new Date().toISOString(),
    };

    /* ► 2. تحديث الصفّ في Supabase */
    const { error } = await supabase
      .from("accounts")
      .update(payload)
      .eq("id", accountId);

    if (error) {
      console.error("Error updating account:", error);
      toast.error("Failed to update account");
      return;
    }

    /* ► 3. نسخة محليّة مفكَّكة التشفير لتحديث الجدول فورًا */
    const localAccount = {
      ...updatedData,
      id: accountId,
      twoFAEmail : updatedData.twoFAEmail,
      appPassword: updatedData.appPassword,
      two_fa_secret:
        form.watch("twoFAType") === "totp" ? updatedData.twoFASecret : "",
    };

    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, ...localAccount } : acc))
    );

    toast.success("Account updated successfully");
  } catch (err) {
    console.error("Error updating account:", err);
    toast.error("Failed to update account");
  }
};
async function checkOutOfStockAlert(productId: string, storeId: string, productName: string) {
  const { data: accounts, error: fetchError } = await supabase
    .from('accounts')
    .select('status')
    .eq('product_id', productId)
    .eq('store_id', storeId);

  if (fetchError) {
    console.error('Error checking out-of-stock:', fetchError);
    return;
  }

  const allFull = accounts.every((a) => a.status === 'full');

  if (allFull) {
    // 1. Check if alert already exists
    const { data: existingAlert } = await supabase
      .from('alerts')
      .select('id')
      .eq('store_id', storeId)
      .eq('product_id', productId)
      .eq('type', 'out_of_stock')
      .eq('dismissed', false)
      .maybeSingle();

    if (!existingAlert) {
      // 2. Insert dashboard alert
      await supabase.from('alerts').insert([
        {
          store_id: storeId,
          product_id: productId,
          type: 'out_of_stock',
          message: `تنبيه: المنتج "${productName}" نفد من الحسابات.`
        }
      ]);

      // 3. Get store email from Supabase
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('email, name')
        .eq('id', storeId)
        .single();

      if (storeData && storeData.email) {
        // 4. Send email using Next.js API route
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: storeData.email,
            subject: `تنبيه: منتجك "${productName}" نفد من الحسابات`,
            text: `مرحبًا ${storeData.name}،\n\nنود إعلامك بأن المنتج "${productName}" قد نفدت منه الحسابات بالكامل.\n\nالرجاء تعبئة المخزون في أقرب وقت لتجنب توقف المبيعات.`,
          }),
        });
      }
    }
  }
}
 
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
    console.log('🔍 Editing account:', account);       // ✅ داخل الدالة
    console.log('📧 2FA Email:', account.twoFAEmail);  // ✅
    console.log('🔑 App Password:', account.appPassword);  // ✅
      setEditingAccount(account.id);
      setEditedAccount({
    email: account.email || '',
    password: account.password || '',
    twoFASecret: account.two_fa_secret || '',
    code: account.code || '',
twoFAEmail: account.twoFAEmail || account.fa_email || '',
appPassword: account.appPassword || account.fa_app_pass || '',
    maxUsers: account.max_users || 1,
    status: account.status || 'active',
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
      twoFAEmail: editedAccount.twoFAEmail,   // ⭐️ مضاف
      appPassword: editedAccount.appPassword,
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
  const handleUpdateUsers = async (accountId: string, updatedUsers: any[]) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ users: updatedUsers })
        .eq('id', accountId);
  
      if (error) {
        console.error('Supabase update error:', error);
        toast.error('Failed to update users in Supabase');
        return;
      }
  
      setAccounts(prev =>
        prev.map(acc => acc.id === accountId ? { ...acc, users: updatedUsers } : acc)
      );
  
      toast.success('Users updated successfully');
    } catch (error) {
      console.error('Error updating users:', error);
      toast.error('Error updating users');
    }
  };
  // Delete a user from an account
  const handleDeleteUser = async (accountId: string, userNumber: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account || !account.users) return;
  
    const updatedUsers = account.users.filter((u) => u.number !== userNumber);
    await handleUpdateUsers(accountId, updatedUsers);
  };
  // Reset 2FA limit for a user
  const handleResetUserTwoFALimit = async (accountId: string, userNumber: string) => {
    try {
      const account = accounts.find((a) => a.id === accountId);
      if (!account || !account.users) return;
  
      const updatedUsers = account.users.map((user: User) => {
        if (user.number === userNumber) {
          return {
            ...user,
            code_claimed: 0, // ✅ إعادة التعيين إلى 0
            timestamp_code: new Date().toISOString(),
          };
        }
        return user;
      });
  
      const { error } = await supabase
        .from('accounts')
        .update({ users: updatedUsers })
        .eq('id', accountId);
  
      if (error) {
        console.error('Error updating user limit in Supabase:', error);
        toast.error('Failed to update user limit');
        return;
      }
  
      // تحديث الحالة المحلية
      setAccounts(
        accounts.map((acc) =>
          acc.id === accountId ? { ...acc, users: updatedUsers } : acc
        )
      );
  
      toast.success('2FA user limit reset successfully');
    } catch (error) {
      console.error('Error resetting 2FA limit:', error);
      toast.error('An unexpected error occurred');
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
        twoFAType: 'totp',
        platform: 'steam',
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
          const productAccounts = allAccounts
          .filter((account: any) => account.product_id === id)
          .map((account: any) => ({
            ...account,
            email: account.email ? decrypt(account.email) : '',
            password: account.password ? decrypt(account.password) : '',
            two_fa_secret: account.two_fa_secret ? decrypt(account.two_fa_secret) : '',
          }));
        
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
  const [storeId, setStoreId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  useEffect(() => {
    const id = localStorage.getItem('store_id');
    if (id) setStoreId(id);
  
  }, []);

useEffect(() => {
  const fetchAccounts = async () => {
    const storeId = localStorage.getItem('store_id');
    if (!id || !storeId) return;

    const { data, error } = await supabase
      .from('accounts')
      .select('id, email, password, code, status, max_users, users, two_fa_secret, fa_email, fa_app_pass')
      .eq('product_id', id)
      .eq('store_id', storeId);

    if (error) {
      console.error('Error fetching accounts:', error);
    } else {
      const decrypted = data.map(acc => ({
        id: acc.id,
        email: decrypt(acc.email || ''),
        password: decrypt(acc.password || ''),
        two_fa_secret: decrypt(acc.two_fa_secret || ''),
  twoFAEmail: acc.fa_email || '',    
  appPassword: acc.fa_app_pass || '',
        code: acc.code,
        status: acc.status,
        max_users: acc.max_users,
        users: acc.users || []
      }));
      setAccounts(decrypted);
    }
  };

  fetchAccounts();
}, [id, storeId]);

return (
  <MainLayout isAdmin={isAdmin}>
    <div className="space-y-6">
      {/* ────────────────── Page Header ────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(isAdmin ? "/admin/stores" : "/products")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t(formTitle)}</h1>
        </div>

        {isEditing && (
<Button
  variant="destructive"
  onClick={() => handleDeleteItem(id)}
>
  <Trash className="h-4 w-4 mr-2" />
  {t("Delete")}
</Button>
        )}
      </div>

      {/* ────────────────── Tabs ────────────────── */}
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="details">{t("Details")}</TabsTrigger>
          {isEditing && !isAdmin && (
            <TabsTrigger value="accounts">
              {form.watch("isGiftCard") ? t("Codes") : t("Accounts")}
            </TabsTrigger>
          )}
        </TabsList>

        {/* ─────────────── Details Tab ─────────────── */}
        <TabsContent value="details" className="space-y-4 mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* ============= Basic Info Card ============= */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("Basic Information")}</CardTitle>
                  <CardDescription>
                    {t(
                      isAdmin
                        ? "Configure the basic settings for your store"
                        : "Configure the basic settings for your product"
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Account-type picker */}
                  <FormField
                    control={form.control}
                    name="account_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('نوع الحساب')}</FormLabel>
                        <FormControl>
                          <ToggleGroup
                            type="single"
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-3 gap-2"
                          >
                            {["PlayStation", "Steam", "Chatgpt", "Spotify", "Canva", "GamePass"].map(
                              (val) => (
                                <ToggleGroupItem
                                  key={val}
                                  value={val}
                                  className="w-full px-4 py-2 border border-white/10 bg-black text-white rounded-md data-[state=on]:bg-white data-[state=on]:text-black"
                                >
                                  {val.charAt(0).toUpperCase() + val.slice(1)}
                                </ToggleGroupItem>
                              )
                            )}
                          </ToggleGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Product picker */}
                  {showProductPicker && (
                    <ProductPicker
                      open={showProductPicker}
                      onClose={() => setShowProductPicker(false)}
                      onSelect={(product) => {
                        setSelectedProduct({
                          id: product.id,
                          name: product.name,
                          image: product.thumbnail,
                        });
                        form.setValue("sallaUrl", product.urls.customer);
                        form.setValue("name", product.name);
                        setShowProductPicker(false);
                      }}
                    />
                  )}

                  <FormItem>
                    <FormLabel>                        اختر منتج من سلة</FormLabel>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowProductPicker(true)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        اختر منتج من سلة
                      </Button>

                      {selectedProduct ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={selectedProduct.image}
                            alt="Product"
                            className="w-12 h-12 rounded-lg border"
                          />
                          <div>
                            <p className="text-sm font-medium">
                              {selectedProduct.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Product ID:{" "}
                              {extractSallaProductId(form.getValues("sallaUrl"))}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-destructive">
                          ⚠️ الرجاء اختيار منتج من سلة
                        </span>
                      )}
                    </div>
                  </FormItem>
<FormField
  control={form.control}
  name="enableFileDelivery"
  render={({ field }) => (
    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <FormLabel className="text-base">
          {t('Enable File Delivery')}
        </FormLabel>
        <FormDescription>
          {t('Send a PDF / DOCX to the customer after purchase')}
        </FormDescription>
      </div>
      <FormControl>
        <Switch checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
    </FormItem>
  )}
/>
                  {/* File-delivery settings */}
                  {form.watch("enableFileDelivery") && (
                    <Card>
                      <CardHeader>
                        <CardTitle>File Delivery Settings</CardTitle>
                        <CardDescription>
                          Configure file delivery options for this product
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {form.getValues().fileUrl && !file ? (
                          <div className="flex items-center justify-between bg-muted px-4 py-2 rounded">
                            <a
                              href={`https://rrmrownqurlhnngqeoqm.supabase.co/storage/v1/object/public/productfiles/${form
                                .getValues()
                                .fileUrl.split("/")
                                .pop()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 underline text-sm"
                            >
                              {form.getValues().fileUrl.split("/").pop()}
                            </a>
                            <Button
                              variant="link"
                              size="sm"
                              className="text-red-500"
                              onClick={() => {
                                form.setValue("file", undefined);
                                form.setValue("fileUrl", undefined);
                              }}
                            >
                              Remove File
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label>Upload Product File (PDF/DOCX ≤ 2 MB)</Label>
                            <Input
                              type="file"
                              accept=".pdf,.docx"
                              onChange={(e) => {
                                const uploaded = e.target.files?.[0];
                                if (uploaded && uploaded.size <= 2 * 1024 * 1024) {
                                  setFile(uploaded);
                                  form.setValue("file", uploaded);
                                } else {
                                  toast.error(
                                    "File must be a PDF or DOCX and ≤ 2 MB"
                                  );
                                  e.target.value = "";
                                }
                              }}
                              className="cursor-pointer border-dashed"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Users & expiry */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Users */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="infiniteUsers"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t("Infinite Users")}
                              </FormLabel>
                              <FormDescription>
                                {t("Allow unlimited users for this product")}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) =>
                                  handleInfiniteUsersToggle(checked)
                                }
                                disabled={form.watch("isGiftCard")}
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
      <FormLabel>{t("Max Users")}</FormLabel>
      <FormControl>
        <Input
          type="number"
          min="1"
          {...field}
          value={
            form.watch("infiniteUsers")
              ? ""
              : field.value ?? 1 // default 1
          }
          onChange={(e) =>
            field.onChange(
              e.target.value
                ? parseInt(e.target.value)
                : null
            )
          }
          disabled={
            form.watch("infiniteUsers") || form.watch("isGiftCard")
          }
          placeholder={
            form.watch("infiniteUsers") ? "∞" : "مثلاً: 3"
          }
        />
      </FormControl>
      <FormDescription>
        {form.watch("infiniteUsers")
          ? t("Unlimited users allowed")
          : t("Maximum number of users allowed")}
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
                    </div>

                    {/* Expiry */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="infiniteExpiry"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t("Never Expires")}
                              </FormLabel>
                              <FormDescription>
                                {t("Product never expires")}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) =>
                                  handleInfiniteExpiryToggle(checked)
                                }
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
                            <FormLabel>{t("Expire Days")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : null
                                  )
                                }
                                disabled={form.watch("infiniteExpiry")}
                              />
                            </FormControl>
                            <FormDescription>
                              {form.watch("infiniteExpiry")
                                ? t("Product never expires")
                                : t("Number of days until expiration")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ========== Advanced Settings Card ========== */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("Advanced Settings")}</CardTitle>
                  <CardDescription>
                    {t(
                      isAdmin
                        ? "Configure additional options for your store"
                        : "Configure additional options for your product"
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Gift-card toggle */}
                  <FormField
                    control={form.control}
                    name="isGiftCard"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t("Gift Card Product")}
                          </FormLabel>
                          <FormDescription>
                            {t(
                              "Enable if this product is a gift card (code only, no email/password)"
                            )}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              handleGiftCardToggle(checked)
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* 2FA toggle */}
                  <FormField
                    control={form.control}
                    name="twoFAEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t("Enable Two-Factor Authentication")}
                          </FormLabel>
                          <FormDescription>
                            {t(
                              isAdmin
                                ? "Require 2FA for this store"
                                : "Require 2FA for this product"
                            )}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              handle2FAToggle(checked)
                            }
                            disabled={form.watch("isGiftCard")}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* If 2FA enabled → settings */}
                  {form.watch("twoFAEnabled") && (
                    <>
                      {/* 2FA type */}
                      <FormField
                        control={form.control}
                        name="twoFAType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>2FA Verification Method</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                {(["totp", "email"] as const).map((val) => (
                                  <Button
                                    key={val}
                                    type="button"
                                    variant={
                                      field.value === val ? "default" : "outline"
                                    }
                                    onClick={() => field.onChange(val)}
                                    className="w-1/2"
                                  >
                                    {val === "totp"
                                      ? "TOTP (App)"
                                      : "Email Verification"}
                                  </Button>
                                ))}
                              </div>
                            </FormControl>
                            <FormDescription>
                              Select how users will receive their 2FA codes
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      {/* Limit per-user */}
                      <FormField
                        control={form.control}
                        name="limitTwoFAPerUser"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t("Limit 2FA Per User")}
                              </FormLabel>
                              <FormDescription>
                                {t("Limit how many 2FA codes a user can get")}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!form.watch("twoFAEnabled")}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Code limit */}
                      {form.watch("limitTwoFAPerUser") && (
                        <FormField
                          control={form.control}
                          name="twoFALimit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("2FA Code Limit")}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? parseInt(e.target.value)
                                        : ""
                                    )
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                {t("Maximum number of 2FA codes a user can get")}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Email-2FA extra fields */}
                      {form.watch("twoFAType") === "email" && (
                        <>
                   <FormField
  control={form.control}
  name="emailProvider"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email Service Provider</FormLabel>
      <FormControl>
        <ToggleGroup
          type="single"
          value={field.value}
          onValueChange={field.onChange}
          className="grid grid-cols-1 gap-2"
        >
          <ToggleGroupItem
            value="gmail"
            className="w-full px-4 py-2 border border-white/10 bg-black text-white rounded-md data-[state=on]:bg-white data-[state=on]:text-black"
          >
            Gmail
          </ToggleGroupItem>
        </ToggleGroup>
      </FormControl>
      <FormDescription>
        Only Gmail is supported for 2FA email codes.
      </FormDescription>
    </FormItem>
  )}
/>

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>2FA Email Sender</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., support@steam.com"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  The email address used to send the 2FA code
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* ===== Save / Cancel ===== */}
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                    navigate(isAdmin ? "/admin/stores" : "/products")
                  }
                >
                  {t("Cancel")}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => onSubmit(form.getValues(), true)}
                >
                  {t("Save")}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* ─────────────── Accounts Tab ─────────────── */}
        {isEditing && !isAdmin && (
          <TabsContent value="accounts" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>
                    {form.watch("isGiftCard")
                      ? t("Manage Gift Card Codes")
                      : t("Manage Accounts")}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setIsAddingAccount(true)}
                    disabled={isAddingAccount}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {form.watch("isGiftCard") ? t("Add Code") : t("Add Account")}
                  </Button>
                </CardTitle>
                <CardDescription>
                  {form.watch("isGiftCard")
                    ? t("Add and manage gift card codes for this product")
                    : t("Add and manage accounts for this product")}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    {/* Table head */}
                    <TableHeader>
                      <TableRow>
                        {form.watch("isGiftCard") ? (
                          <TableHead>{t("Gift Card Code")}</TableHead>
                        ) : (
                          <>
                            <TableHead>{t("Email")}</TableHead>
                            <TableHead>{t("Password")}</TableHead>
                            <TableHead>{t("2FA Info")}</TableHead>
                          </>
                        )}
                        <TableHead>{t("Status")}</TableHead>
                        <TableHead className="text-right">
                          {t("Actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    {/* Table body */}
                    <TableBody>
                      {/* Existing accounts */}
                      {accounts.map((account) => (
                        <TableRow key={account.id}>
                          {form.watch("isGiftCard") ? (
                            <TableCell>{account.code}</TableCell>
                          ) : (
                            <>
                              {/* Email */}
                              <TableCell>{account.email}</TableCell>

                              {/* Password */}
<TableCell>
  <div className={`flex items-center ${rtl ? 'flex-row-reverse' : ''} gap-2`}>
    <span className="text-sm">
      {account.password || "-"}
    </span>
  </div>
</TableCell>


                              {/* 2FA info */}
                              <TableCell className="space-y-1">
                                {editingAccount === account.id ? (
                                  form.watch("twoFAType") === "email" ? (
                                    <>
                                      <Input
                                        value={editedAccount.twoFAEmail}
                                        onChange={(e) =>
                                          setEditedAccount({
                                            ...editedAccount,
                                            twoFAEmail: e.target.value,
                                          })
                                        }
                                        placeholder="2FA Email"
                                      />
                                      <div className="relative">
                                        <Input
                                          type={
                                            showEditAppPassword
                                              ? "text"
                                              : "password"
                                          }
                                          value={editedAccount.appPassword}
                                          onChange={(e) =>
                                            setEditedAccount({
                                              ...editedAccount,
                                              appPassword: e.target.value,
                                            })
                                          }
                                          placeholder="App Password"
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <Input
                                      value={editedAccount.twoFASecret}
                                      onChange={(e) =>
                                        setEditedAccount({
                                          ...editedAccount,
                                          twoFASecret: e.target.value,
                                        })
                                      }
                                      placeholder="2FA Secret (optional)"
                                    />
                                  )
                                ) : form.watch("twoFAType") === "email" ? (
                                  <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                                    <span className="text-sm">
                                      {visibleAppPasswords[account.id]
                                        ? account.appPassword || "-"
                                        : "••••••••"}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        setVisibleAppPasswords((p) => ({
                                          ...p,
                                          [account.id]: !p[account.id],
                                        }))
                                      }
                                    >
                                      {visibleAppPasswords[account.id] ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-sm">
                                    {account.two_fa_secret || "-"}
                                  </span>
                                )}
                              </TableCell>
                            </>
                          )}

                          {/* Status */}
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                account.status === "active"
                                  ? "bg-emerald-900 text-emerald-100 border border-emerald-700"
                                  : account.status === "paused"
                                  ? "bg-amber-900 text-amber-100 border border-amber-700"
                                  : "bg-rose-900 text-rose-100 border border-rose-700"
                              }`}
                            >
                              {account.status}
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {editingAccount === account.id ? (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={saveAccountEdit}
                                  >
                                    <Check className="h-4 w-4 text-emerald-400" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={cancelAccountEdit}
                                  >
                                    <X className="h-4 w-4 text-rose-400" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => startEditAccount(account)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() =>
                                      handleDeleteAccount(account.id)
                                    }
                                  >
                                    <Trash className="h-4 w-4 text-destructive" />
                                  </Button>
                                  {!form.watch("isGiftCard") && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() =>
                                        openUserManagement(account)
                                      }
                                    >
                                      <UsersIcon className="h-4 w-4 text-blue-400" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Row for new account / code */}
                      {isAddingAccount && (
                        <TableRow>
                          {form.watch("isGiftCard") ? (
                            <>
                              <TableCell>
                                <Input
                                  value={newAccount.code}
                                  onChange={(e) =>
                                    setNewAccount({
                                      ...newAccount,
                                      code: e.target.value,
                                    })
                                  }
                                  placeholder="Gift Card Code"
                                />
                              </TableCell>
                              <TableCell />
                              <TableCell />
                            </>
                          ) : (
                            <>
                              {/* Email */}
                              <TableCell>
                                <Input
                                  value={newAccount.email}
                                  onChange={(e) =>
                                    setNewAccount({
                                      ...newAccount,
                                      email: e.target.value,
                                    })
                                  }
                                  placeholder="Email"
                                />
                              </TableCell>

                              {/* Password */}
                              <TableCell>
                                <Input
                                  type="password"
                                  value={newAccount.password}
                                  onChange={(e) =>
                                    setNewAccount({
                                      ...newAccount,
                                      password: e.target.value,
                                    })
                                  }
                                  placeholder="Password"
                                />
                              </TableCell>

                              {/* 2FA inputs */}
                              <TableCell>
                                {form.watch("twoFAType") === "email" ? (
                                  <>
                                    <Input
                                      className="mb-1"
                                      value={newAccount.twoFAEmail}
                                      onChange={(e) =>
                                        setNewAccount({
                                          ...newAccount,
                                          twoFAEmail: e.target.value,
                                        })
                                      }
                                      placeholder="2FA Email"
                                    />
                                    <Input
                                      type="password"
                                      value={newAccount.appPassword}
                                      onChange={(e) =>
                                        setNewAccount({
                                          ...newAccount,
                                          appPassword: e.target.value,
                                        })
                                      }
                                      placeholder="App Password"
                                    />
                                  </>
                                ) : (
                                  <Input
                                    value={newAccount.twoFASecret}
                                    onChange={(e) =>
                                      setNewAccount({
                                        ...newAccount,
                                        twoFASecret: e.target.value,
                                      })
                                    }
                                    placeholder="2FA Secret (optional)"
                                  />
                                )}
                              </TableCell>
                            </>
                          )}

                          {/* Status ثابت */}
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs bg-emerald-900 text-emerald-100 border border-emerald-700">
                              active
                            </span>
                          </TableCell>

                          {/* Save / Cancel */}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleAddAccount}
                              >
                                <Check className="h-4 w-4 text-emerald-400" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setIsAddingAccount(false)}
                              >
                                <X className="h-4 w-4 text-rose-400" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Empty state */}
                      {accounts.length === 0 && !isAddingAccount && (
                        <TableRow>
                          <TableCell
                            colSpan={form.watch("isGiftCard") ? 3 : 5}
                            className="text-center py-6"
                          >
                            <p>
                              {form.watch("isGiftCard")
                                ? t("No gift card codes found")
                                : t("No accounts found")}
                            </p>
                            <Button
                              variant="outline"
                              className="mt-2"
                              onClick={() => setIsAddingAccount(true)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              {form.watch("isGiftCard")
                                ? t("Add Code")
                                : t("Add Account")}
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

      {/* ─────────────── Dialogs ─────────────── */}
      <TwoFactorValidation
        isOpen={validating2FA}
        onClose={() => {
          setValidating2FA(false);
          setAccountToValidate(null);
        }}
        onValidate={async (isValid) => {
          if (isValid && accountToValidate) await saveAccount(accountToValidate);
          setValidating2FA(false);
          setAccountToValidate(null);
        }}
  secret={accountToValidate?.twoFASecret || ""}
      />

      {selectedAccount && (
        <UserManagementDialog
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
          accountName={selectedAccount.email || selectedAccount.code || ""}
          accountId={selectedAccount.id}
          users={selectedAccount.users || []}
          onDeleteUser={handleDeleteUser}
          onResetUserTwoFALimit={handleResetUserTwoFALimit}
          onUpdateUsers={handleUpdateUsers}
          accounts={accounts}
          setAccounts={setAccounts}
        />
      )}

      {/* Demo-mode banner */}
      {isDemoAccount() && (
        <div className="rounded-md bg-yellow-500/10 p-3 text-yellow-600 border border-yellow-200 dark:border-yellow-900 dark:text-yellow-400 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <p className="text-sm">
              {t(
                "Demo Mode: The data shown is sample data. In a real environment, this would display actual product data from your store."
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  </MainLayout>
);}
