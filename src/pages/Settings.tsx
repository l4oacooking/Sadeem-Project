
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Globe, Languages, Lock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTranslation } from "@/hooks/use-translation";

const supabase = createClient(
  'https://rrmrownqurlhnngqeoqm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJybXJvd25xdXJsaG5uZ3Flb3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NDkxMDUsImV4cCI6MjA1OTEyNTEwNX0.sMBDivG_y_EHyChuAEIMz1mz20GPXGHKL2anEMli00E'
);
// Form validation schemas
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  storeName: z.string().min(2, {
    message: "Store name must be at least 2 characters.",
  }),
  domain: z.string().optional(),
  avatar: z.string().optional()
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(2, {
    message: "Current password must be at least 8 characters.",
  }),
  newPassword: z.string().min(8, {
    message: "New password must be at least 8 characters.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Confirm password must be at least 8 characters.",
  }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const appearanceFormSchema = z.object({
  theme: z.enum(["dark", "light", "system"]),
  language: z.enum(["en", "ar"]),
  notifications: z.boolean(),
});

type SettingsProps = {
  isAdmin?: boolean;
};

const Settings = ({ isAdmin = false }: SettingsProps) => {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      storeName: "",
      domain: ""
    }
  });
  // Profile form
 useEffect(() => {
  const fetchStore = async () => {
    const storeId = localStorage.getItem("store_id");
    if (!storeId) return;

    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .single();

    if (data && !error) {
      profileForm.reset({
        name: data.name || '',
        email: data.email || '',
        storeName: data.name || '',
        domain: data.domain || ''
      });
    }
  };

  fetchStore();
}, [profileForm]);
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated.",
    });
  };

  // Security form
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSecuritySubmit = async (data: z.infer<typeof securityFormSchema>) => {
    const storeId = localStorage.getItem("store_id");
    if (!storeId) {
      toast({
        title: "Error",
        description: "Store ID not found. Please login again.",
        variant: "destructive",
      });
      return;
    }
  
    // 1️⃣ جلب الباسورد من قاعدة البيانات
    const { data: admin, error: fetchError } = await supabase
      .from("admins")
      .select("password")
      .eq("store_id", storeId)
      .eq("role", "owner")
      .single();
  
    if (fetchError || !admin) {
      toast({
        title: "Error",
        description: "Failed to verify your current password.",
        variant: "destructive",
      });
      return;
    }
  
    // 2️⃣ تحقق من مطابقة كلمة المرور
    if (admin.password !== data.currentPassword) {
      toast({
        title: "Incorrect Password",
        description: "The current password you entered is incorrect.",
        variant: "destructive",
      });
      return;
    }
  
    // 3️⃣ تحديث الباسورد
    const { error: updateError } = await supabase
      .from("admins")
      .update({ password: data.newPassword })
      .eq("store_id", storeId)
      .eq("role", "owner");
  
    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
      return;
    }
  
    toast({
      title: "Password updated",
      description: "Your password has been updated successfully.",
    });
  
    securityForm.reset();
  };
  
  // Appearance form
  const appearanceForm = useForm<z.infer<typeof appearanceFormSchema>>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: "dark",
      language: "en",
      notifications: true,
    },
  });

  const onAppearanceSubmit = (data: z.infer<typeof appearanceFormSchema>) => {
    toast({
      title: "Preferences saved",
      description: "Your appearance settings have been updated.",
    });

    // Apply the selected theme
    document.documentElement.className = data.theme;
    
    // In a real app, this would apply the other settings too
  };

  // Handle language change
  const handleLanguageChange = (language: string) => {
    toast({
      title: `Language changed to ${language === 'en' ? 'English' : 'العربية'}`,
      description: "Page will reload to apply changes.",
    });
    
    // In a real app, this would change the language
    appearanceForm.setValue('language', language as 'en' | 'ar');
  };

  return (
    <MainLayout isAdmin={isAdmin}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{isAdmin ? "Admin Settings" : "Settings"}</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>
      
        <Tabs 
          defaultValue="profile" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="space-y-4"
        >
          <TabsList className="bg-sidebar-accent">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User size={16} />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock size={16} />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Globe size={16} />
              <span>Appearance</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your personal information and store details.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                    <div className="flex flex-col sm:flex-row gap-8 items-start">
                      <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-24 w-24">
                        <AvatarImage
src={
    Array.isArray(profileForm.watch("avatar"))
      ? profileForm.watch("avatar")[0] || "/placeholder.svg"
      : profileForm.watch("avatar") || "/placeholder.svg"
  }
  alt="User"
/>
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="sm">Change Avatar</Button>
                      </div>
                      <div className="space-y-4 flex-1">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="moahmmed@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator className="my-4" />
                        <h3 className="text-lg font-medium">Store Information</h3>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={profileForm.control}
                            name="storeName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Store Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="My Store" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="domain"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Domain</FormLabel>
                                <FormControl>
                                  <Input placeholder="mystore.example.com" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Your custom domain (optional)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit">Save Changes</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Update your password and security settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...securityForm}>
                  <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-8">
                    <div className="space-y-4">
                      <FormField
                        control={securityForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={securityForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={securityForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit">Update Password</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Manage your visual preferences and language settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...appearanceForm}>
                  <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)} className="space-y-8">
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={appearanceForm.control}
                          name="theme"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Theme</FormLabel>
                              <div className="flex gap-4">
                                <FormControl>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id="dark"
                                      value="dark"
                                      checked={field.value === "dark"}
                                      onChange={() => field.onChange("dark")}
                                      className="hidden"
                                    />
                                    <label 
                                      htmlFor="dark"
                                      className={`w-20 h-16 flex flex-col items-center justify-center rounded-md border-2 cursor-pointer ${
                                        field.value === "dark" 
                                        ? "border-primary bg-sidebar-accent" 
                                        : "border-muted bg-card"
                                      }`}
                                      onClick={() => field.onChange("dark")}
                                    >
                                      <div className="w-10 h-10 rounded-full bg-slate-950"></div>
                                      <span className="text-xs mt-1">Dark</span>
                                    </label>
                                  </div>
                                </FormControl>
                                
                                <FormControl>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id="light"
                                      value="light"
                                      checked={field.value === "light"}
                                      onChange={() => field.onChange("light")}
                                      className="hidden"
                                    />
                                    <label 
                                      htmlFor="light"
                                      className={`w-20 h-16 flex flex-col items-center justify-center rounded-md border-2 cursor-pointer ${
                                        field.value === "light" 
                                        ? "border-primary bg-sidebar-accent" 
                                        : "border-muted bg-card"
                                      }`}
                                      onClick={() => field.onChange("light")}
                                    >
                                      <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                                      <span className="text-xs mt-1">Light</span>
                                    </label>
                                  </div>
                                </FormControl>
                                
                                <FormControl>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id="system"
                                      value="system"
                                      checked={field.value === "system"}
                                      onChange={() => field.onChange("system")}
                                      className="hidden"
                                    />
                                    <label 
                                      htmlFor="system"
                                      className={`w-20 h-16 flex flex-col items-center justify-center rounded-md border-2 cursor-pointer ${
                                        field.value === "system" 
                                        ? "border-primary bg-sidebar-accent" 
                                        : "border-muted bg-card"
                                      }`}
                                      onClick={() => field.onChange("system")}
                                    >
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-950 to-slate-100"></div>
                                      <span className="text-xs mt-1">System</span>
                                    </label>
                                  </div>
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator className="my-6" />
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Language Preferences</h3>
                        
                        <div className="flex items-center gap-8">
                          <Languages size={20} />
                          <div className="flex gap-6 items-center">
                          <Button
  type="button"
  variant={appearanceForm.watch('language') === "en" ? "default" : "outline"}
  className="px-6"
  onClick={() => handleLanguageChange('en')}
>
  English
</Button>
<Button
  type="button"
  variant={appearanceForm.watch('language') === "ar" ? "default" : "outline"}
  className="px-6"
  onClick={() => handleLanguageChange('ar')}
>
  العربية
</Button>
                          </div>
                        </div>
                        
                        <FormField
                          control={appearanceForm.control}
                          name="notifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Enable Notifications
                                </FormLabel>
                                <FormDescription>
                                  Receive alerts and notifications.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit">Save Preferences</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
