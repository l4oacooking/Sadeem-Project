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
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // تأكد مستورد useNavigate
import bcrypt from 'bcryptjs';


// Function to check if using demo account
const isDemoAccount = () => {
  const storeId = localStorage.getItem('store_id');
  return storeId === 'new' || storeId === 'demo';
};

// Data fetching function - will use mock data only for demo accounts
const getAdminsData = async () => {
  const storeId = localStorage.getItem('store_id');
  if (!storeId) return { admins: [] };

  const { data, error } = await supabase
  .from('admins')
  .select('*')
  .eq('store_id', storeId);

  if (error) {
    console.error('Error fetching admins:', error);
    return { admins: [] };
  }

  return { admins: data };
};

const Admins = () => {
  const { t, rtl, language } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const session = JSON.parse(localStorage.getItem('session') || '{}');
  const currentEmail = session.email;
  const currentAdmin = admins.find(a => a.email === currentEmail);
  const currentRole = currentAdmin?.role || '';

  useEffect(() => {
    const storeId = localStorage.getItem('store_id');
    const isSuperadmin = localStorage.getItem('superadmin');
    if (!storeId && !isSuperadmin) {
      navigate('/login');
    }
  }, [navigate]);

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

  const [storeEmail, setStoreEmail] = useState('');

  useEffect(() => {
    const storeId = localStorage.getItem('store_id');
    supabase
      .from('stores')
      .select('email')
      .eq('store_id', storeId)
      .single()
      .then(({ data }) => {
        if (data?.email) {
          setStoreEmail(data.email);
        }
      });
  }, []);

  useEffect(() => {
    form.reset(form.getValues());
  }, [language, form]);

  const { data, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: getAdminsData,
  });

  useEffect(() => {
    if (data?.admins && admins.length === 0) {
      setAdmins(data.admins);
    }
  }, [data, admins]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const storeId = localStorage.getItem('store_id');
    const hashedPassword = await bcrypt.hash(values.password, 10);

    const { data, error } = await supabase
      .from('admins')
      .insert([
        {
          store_id: storeId,
          name: values.name,
          email: values.email,
          password: hashedPassword,
          role: values.role
        }
      ])
      .select();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add admin: " + error.message,
      });
      return;
    }

    const newAdmin = {
      id: data[0].id,
      name: values.name,
      email: values.email,
      role: values.role,
      lastLogin: new Date().toISOString(),
      status: 'Offline',
    };

    setAdmins(prev => [...prev, newAdmin]);

    toast({
      title: t("Admin added"),
      description: `${values.name} has been added as ${values.role}.`,
    });

    setIsAddDialogOpen(false);
    form.reset();
  };

  const handleDeleteAdmin = async (adminId: string) => {
    setSelectedAdminId(adminId);
    const admin = admins.find(a => a.id === adminId);

    if (admin.email === storeEmail) {
      toast({
        title: "Not allowed",
        description: "You cannot delete the store owner.",
      });
      setSelectedAdminId(null);
      return;
    }
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', adminId);

    if (error) {
      toast({
        title: t("Error"),
        description: t("Failed to delete admin."),
      });
      setSelectedAdminId(null);
      return;
    }

    setAdmins(prev => prev.filter(a => a.id !== adminId));

    toast({
      title: t("Admin removed"),
      description: `${admin?.name} has been removed.`,
    });

    setSelectedAdminId(null);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
              {currentRole === 'owner' && (
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
                      {t("New admin can now log in using these credentials.")}
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
                            )}
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
                        <TableCell className={rtl ? "text-left" : "text-right"}>
     {currentRole === 'owner' && admin.role !== 'owner' && admin.email !== currentEmail && (

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

