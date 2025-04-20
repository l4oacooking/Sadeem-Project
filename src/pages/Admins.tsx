import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, Check, Hourglass, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';

// Function to check if using demo account
const isDemoAccount = () => {
  const storeId = localStorage.getItem('store_id');
  return storeId === 'new' || storeId === 'demo';
};

// Data fetching function - will use mock data only for demo accounts
const getAdminsData = async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // Only return mock data for demo accounts
  if (isDemoAccount()) {
    return {
      admins: Array.from({ length: 5 }, (_, i) => ({
        id: `admin-${i+1}`,
        name: `Admin ${i+1}`,
        email: `admin${i+1}@example.com`,
        role: i === 0 ? 'Owner' : 'Admin',
        lastLogin: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(),
        status: i % 3 === 0 ? 'Online' : 'Offline',
      })),
    };
  }
  
  // For real accounts, return empty array until connected to real backend
  return { admins: [] };
};

const Admins = () => {
  const { t, rtl, language } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const { toast } = useToast();
  
  // Create validation schema with translated messages
  const formSchema = z.object({
    name: z.string().min(2, {
      message: t("Name must be at least 2 characters."),
    }),
    email: z.string().email({
      message: t("Please enter a valid email address."),
    }),
    password: z.string().min(8, {
      message: t("Password must be at least 8 characters."),
    }),
    role: z.string(),
    
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "Admin",
    },
  });

  // Update form when language changes
  useEffect(() => {
    form.reset(form.getValues());
  }, [language, form]);

  const { data, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: getAdminsData,
  });

  // Initialize admins state with data from query
  useEffect(() => {
    if (data?.admins && admins.length === 0) {
      setAdmins(data.admins);
    }
  }, [data, admins]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // In a real app, this would make an API call to create the admin
    // For demo, we'll just update the local state
    
    // Create new admin object
    const newAdmin = {
      id: `admin-${Date.now()}`,
      name: values.name,
      email: values.email,
      role: values.role,
      lastLogin: new Date().toISOString(),
      status: 'Offline',
    };
    
    // Add to list
    setAdmins(prev => [...prev, newAdmin]);
    
    toast({
      title: t("Admin added"),
      description: t("{{name}} has been added as {{role}}.", { name: values.name, role: values.role }),
    });
    
    setIsAddDialogOpen(false);
    form.reset();
  };

  const handleDeleteAdmin = (adminId: string) => {
    setSelectedAdminId(adminId);
    const admin = admins.find(a => a.id === adminId);
    
    // In a real app, this would make an API call to delete the admin
    // For demo, we'll just update the local state
    
    // Remove from list
    setAdmins(prev => prev.filter(a => a.id !== adminId));
    
    toast({
      title: t("Admin removed"),
      description: t("{{name}} has been removed.", { name: admin?.name }),
    });
    
    setSelectedAdminId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Use 'gregory' calendar explicitly for Arabic locale
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US', { 
      dateStyle: 'medium', 
      timeStyle: 'short',
      calendar: 'gregory'  // Force Gregorian calendar
    }).format(date);
  };

  const displayedAdmins = admins.length > 0 ? admins : data?.admins || [];

  return (
    <MainLayout>
      <div className="flex flex-col gap-6"
        style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
        dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("Store Admins")}</h1>
          <p className="text-muted-foreground">{t("Manage your store's admin users and their permissions.")}</p>
        </div>

        <Card className="dashboard-card">
          <CardHeader>
            <div className={`flex items-center justify-between ${rtl ? 'flex-row-reverse' : ''}`}>
              <CardTitle>{t("Admin Management")}</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" className={`flex items-center gap-2 ${rtl ? 'flex-row-reverse' : ''}`}>
                    <UserPlus size={16} />
                    <span>{t("Add Admin")}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t("Add New Admin")}</DialogTitle>
                    <DialogDescription>
                      {t("Add a new admin to your store. They'll receive an email invitation.")}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Name")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("John Doe")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Email")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("john@example.com")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Password")}</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Role")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("Select a role")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Owner">{t("Owner")}</SelectItem>
                                <SelectItem value="Admin">{t("Admin")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter className={rtl ? 'flex-row-reverse' : ''}>
                        <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>
                          {t("Cancel")}
                        </Button>
                        <Button type="submit">{t("Add Admin")}</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-pulse">{t("Loading admins data...")}</div>
              </div>
            ) : displayedAdmins.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                <UserPlus size={40} className="mb-2 opacity-50" />
                <p>{t("No admins found")}</p>
                <p className="text-sm">{t("Add an admin to get started")}</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Name")}</TableHead>
                      <TableHead>{t("Email")}</TableHead>
                      <TableHead>{t("Role")}</TableHead>
                      <TableHead>{t("Status")}</TableHead>
                      <TableHead>{t("Last Login")}</TableHead>
                      <TableHead className={rtl ? "text-left" : "text-right"}>{t("Actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedAdmins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.name}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {admin.role === 'Owner' ? (
                              <span className="text-neon-blue flex items-center gap-1">
                                <Check size={14} /> {t(admin.role)}
                              </span>
                            ) : (
                              <span className="text-neon-green">{t(admin.role)}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {admin.status === 'Online' ? (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-neon-green"></div>
                              <span>{t("Online")}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-muted"></div>
                              <span>{t("Offline")}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-muted-foreground" />
                            <span>{formatDate(admin.lastLogin)}</span>
                          </div>
                        </TableCell>
                        <TableCell className={rtl ? "text-left" : "text-right"}>
                          {admin.role !== 'Owner' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAdmin(admin.id)}
                              disabled={selectedAdminId === admin.id}
                            >
                              {selectedAdminId === admin.id ? (
                                <Hourglass size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} className="text-destructive" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Show demo account notice if using the demo account */}
        {isDemoAccount() && (
          <div className="rounded-md bg-yellow-500/10 p-3 text-yellow-600 border border-yellow-200 dark:border-yellow-900 dark:text-yellow-400">
            <p className="text-sm">{t("Demo Mode: The data shown is sample data. Changes will not persist after page refresh.")}</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Admins;
