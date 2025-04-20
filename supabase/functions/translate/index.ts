
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const translationDictionary = {
  // Sidebar items
  'Dashboard': 'لوحة القيادة',
  'Analytics': 'التحليلات',
  'Products': 'المنتجات',
  'Feedback': 'التعليقات',
  'Admins': 'المشرفون',
  'Settings': 'الإعدادات',
  'Export Data': 'تصدير البيانات',
  'Security': 'الأمان',
  'Knowledge Base': 'قاعدة المعرفة',
  'System Health': 'صحة النظام',
  'Admin Tools': 'أدوات المشرف',
  'Stores': 'المتاجر',

  // Top navigation
  'Admin Panel': 'لوحة المشرف',
  'Store Panel': 'لوحة المتجر',
  'Master Admin Dashboard': 'لوحة تحكم المدير الرئيسي',
  'Store Dashboard': 'لوحة تحكم المتجر',
  'Select Language': 'اختر اللغة',
  'Notifications': 'الإشعارات',
  'Product Alert': 'تنبيه المنتج',
  'New Feedback': 'تعليق جديد',
  'System Update': 'تحديث النظام',
  'View all notifications': 'عرض جميع الإشعارات',
  'User menu': 'قائمة المستخدم',
  'My Account': 'حسابي',
  'Profile': 'الملف الشخصي',
  'Log out': 'تسجيل الخروج',
  'Netflix accounts are running low (5 remaining)': 'حسابات نتفليكس منخفضة (5 متبقية)',
  'A customer left new feedback on Disney+ product': 'ترك أحد العملاء تعليقًا جديدًا على منتج ديزني+',
  'Platform updated to version 2.4.1': 'تم تحديث المنصة إلى الإصدار 2.4.1',

  // Knowledge Base page
  'Manage educational resources for store owners': 'إدارة الموارد التعليمية لأصحاب المتاجر',
  'Add New Resource': 'إضافة مورد جديد',
  'Search resources...': 'البحث عن الموارد...',
  'All': 'الكل',
  'Videos': 'الفيديوهات',
  'Documents': 'المستندات',
  'Links': 'الروابط',
  'Learn how to use the platform effectively': 'تعلم كيفية استخدام المنصة بفعالية',
  
  // Dashboard
  'Welcome back, Store123!': 'مرحبًا بعودتك، Store123!',
  'Here\'s what\'s happening with your store today.': 'إليك ما يحدث في متجرك اليوم.',
  'Total Products': 'إجمالي المنتجات',
  'Active Users': 'المستخدمون النشطون',
  'Expiring Soon': 'تنتهي قريبًا',
  'Account Claims Today': 'مطالبات الحساب اليوم',
  'Weekly Account Claims': 'مطالبات الحساب الأسبوعية',
  'The number of accounts claimed per day this week': 'عدد الحسابات المطالب بها يوميًا هذا الأسبوع',
  'Active Products Status': 'حالة المنتجات النشطة',
  'Distribution of active products by category': 'توزيع المنتجات النشطة حسب الفئة',
  'Recent Alerts': 'التنبيهات الأخيرة',
  'View All': 'عرض الكل',
  'Netflix accounts expiring': 'انتهاء صلاحية حسابات نتفليكس',
  '5 accounts will expire in 3 days': 'ستنتهي صلاحية 5 حسابات خلال 3 أيام',
  'Disney+ running low': 'نفاد حسابات ديزني+',
  'Only 3 accounts remaining': 'متبقي 3 حسابات فقط',
  'Recent Feedback': 'آخر التعليقات',
  'Product stats visualization coming soon': 'رسوم بيانية إحصائية للمنتجات قريبًا',

  // Login
  'Store Login': 'تسجيل دخول المتجر',
  'Admin Login': 'تسجيل دخول المسؤول',
  'Log in to access your dashboard': 'تسجيل الدخول للوصول إلى لوحة التحكم',
  'Store': 'متجر',
  'Admin': 'مسؤول',
  'Store ID': 'معرف المتجر',
  'Admin Email': 'بريد المسؤول',
  'Enter store ID': 'أدخل معرف المتجر',
  'Enter email address': 'أدخل عنوان البريد الإلكتروني',
  'Password': 'كلمة المرور',
  'New Password': 'كلمة المرور الجديدة',
  'Enter password': 'أدخل كلمة المرور',
  'Please set a new password for your account': 'يرجى تعيين كلمة مرور جديدة لحسابك',
  'Login': 'تسجيل الدخول',
  'Logging in...': 'جاري تسجيل الدخول...',
  'Set New Password': 'تعيين كلمة مرور جديدة',
  'For demo: Use "new" as Store ID and "password" for first login.': 'للعرض التجريبي: استخدم "new" كمعرف متجر و "password" لأول تسجيل دخول.',

  // Product Form
  'Edit Product': 'تعديل المنتج',
  'Create Product': 'إنشاء منتج',
  'Cancel': 'إلغاء',
  'Update Product': 'تحديث المنتج',
  'Product Details': 'تفاصيل المنتج',
  'Accounts': 'الحسابات',
  'Product Name': 'اسم المنتج',
  'Max Users per Account': 'الحد الأقصى للمستخدمين لكل حساب',
  'Expiry (days)': 'تاريخ انتهاء الصلاحية (بالأيام)',
  'Enable 2FA': 'تفعيل المصادقة الثنائية',
  'Allow two-factor authentication for this product': 'السماح بالمصادقة الثنائية لهذا المنتج',
  'Limit 2FA per user': 'تحديد المصادقة الثنائية لكل مستخدم',
  'Only allow one user to claim 2FA per account': 'السماح لمستخدم واحد فقط بالمطالبة بالمصادقة الثنائية لكل حساب',
  'Customer Message (Optional)': 'رسالة العميل (اختياري)',
  'Message shown to users when they claim this product': 'الرسالة المعروضة للمستخدمين عند المطالبة بهذا المنتج',
  'Product Accounts': 'حسابات المنتج',
  'Import CSV': 'استيراد ملف CSV',
  'Export': 'تصدير',
  'No accounts added': 'لم تتم إضافة حسابات',
  'Add accounts manually or import from CSV': 'أضف حسابات يدويًا أو استورد من ملف CSV',
  'Add Account Manually': 'إضافة حساب يدويًا',
  'Add Another Account': 'إضافة حساب آخر',
  'Email/Username': 'البريد الإلكتروني/اسم المستخدم',
  '2FA Secret (Optional)': 'رمز المصادقة الثنائية (اختياري)',
  'Test 2FA': 'اختبار المصادقة الثنائية',
  'Enter 2FA secret': 'أدخل رمز المصادقة الثنائية',
  'Test Codes:': 'رموز الاختبار:',
  'Pause this account': 'إيقاف هذا الحساب مؤقتًا',
  'Loading product data...': 'جاري تحميل بيانات المنتج...'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLanguage = 'ar', fetchAll = false } = await req.json();

    if (fetchAll) {
      // Return all translations in the dictionary
      return new Response(
        JSON.stringify({ translations: translationDictionary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!text && !fetchAll) {
      return new Response(
        JSON.stringify({ error: 'Text is required when not fetching all translations' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Try to find translation for a specific text
    let translatedText = text;
    
    if (translationDictionary[text]) {
      translatedText = translationDictionary[text];
    }

    return new Response(
      JSON.stringify({ translatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Translation error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to translate text' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
