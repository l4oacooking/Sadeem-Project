
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
import { useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
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
  const navigate = useNavigate();

  useEffect(() => {
    const storeId = localStorage.getItem('store_id');
    const isSuperadmin = localStorage.getItem('superadmin');
  
    if (!storeId && !isSuperadmin) {
      navigate('/login');
    }
  }, [navigate]);
  
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
    const fetchProfile = async () => {
      const isSuperadmin = localStorage.getItem("superadmin") === "true";
      if (isSuperadmin) {
        const { data, error } = await supabase
          .from("superadmins")
          .select("*")
          .eq("email", localStorage.getItem("superadmin_email"))
          .single();
  
        if (data && !error) {
          profileForm.reset({
            name: data.name || '',
            email: data.email || '',
            storeName: '',
            domain: '',
            avatar: data.avatar || ''
          });
        }
      } else {
        // صاحب متجر عادي
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
            domain: data.domain || '',
            avatar: data.avatar || ''
          });
        }
      }
    };
  
    fetchProfile();
  }, [profileForm]);
  
  const onProfileSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    const isSuperadmin = localStorage.getItem("superadmin") === "true";
  
    if (isSuperadmin) {
      const email = localStorage.getItem("superadmin_email");
      if (!email) {
        toast({
          title: "Error",
          description: "Superadmin email not found. Please login again.",
          variant: "destructive",
        });
        return;
      }
  
      const { error } = await supabase
        .from("superadmins")
        .update({
          name: data.name,
          avatar: data.avatar
        })
        .eq("email", email);
  
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update superadmin profile. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile Updated",
          description: "Your superadmin profile has been updated successfully.",
        });
      }
    } else {
      const storeId = localStorage.getItem("store_id");
      if (!storeId) {
        toast({
          title: "Error",
          description: "Store ID not found. Please login again.",
          variant: "destructive",
        });
        return;
      }
  
      const { error } = await supabase
        .from("stores")
        .update({
          name: data.storeName,
          email: data.email,
          domain: data.domain
        })
        .eq("id", storeId);
  
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update store profile. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile Updated",
          description: "Your store profile has been updated successfully.",
        });
      }
    }
  };
  async function handleChangePassword(email, currentPassword, newPassword) {
  // 1. تحقق من الباسورد الحالي (reauthenticate)
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (loginError) {
    // كلمة المرور الحالية خطأ
    return { success: false, message: "Current password is incorrect." };
  }

  // 2. لو صح، غير الباسورد
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) {
    return { success: false, message: updateError.message };
  }
  return { success: true, message: "Password updated successfully." };
}
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
  // 1. Get the current user's email from Supabase Auth
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email;

  if (!email) {
    toast({
      title: "Error",
      description: "Could not determine your email. Please login again.",
      variant: "destructive",
    });
    return;
  }

  // 2. Re-authenticate by signing in again
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: data.currentPassword,
  });

  if (signInError) {
    toast({
      title: "Incorrect Password",
      description: "The current password you entered is incorrect.",
      variant: "destructive",
    });
    return;
  }

  // 3. Update password using Supabase Auth
  const { error: updateError } = await supabase.auth.updateUser({
    password: data.newPassword,
  });

  if (updateError) {
    toast({
      title: "Error",
      description: "Failed to update password in Supabase Auth.",
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
