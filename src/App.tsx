import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TranslationProvider } from '@/hooks/use-translation';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Analytics from "./pages/Analytics";
import Products from "./pages/ProductList";
import ProductForm from "./pages/ProductForm";
import SystemHealth from "./pages/SystemHealth";
import Settings from "./pages/Settings";
import KnowledgeBase from "./pages/KnowledgeBase";
import Admins from './pages/Admins';
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Stores from "./pages/Stores";
import SuperAdminRoute from './components/SuperAdminRoute';
import Supportlogin from "./pages/Supportlogin";
import ProtectedRoute from "./components/ProtectedRoute";
import Support from './pages/Support'; // 👈 new import
import SadeemLanding from './pages/SadeemLanding';
const queryClient = new QueryClient();



function App() {
  useEffect(() => {
    console.log("App component mounted");
    console.log("ProductForm component available:", !!ProductForm);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TranslationProvider>
          <Router>
            <Routes>
              <Route path="/" element={<SadeemLanding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/supportlogin" element={<Supportlogin />} />
              <Route path="/index" element={<Index />} />
              <Route path="/support" element={<Support />} />
              <Route path="/supportlogin" element={<Supportlogin />} />
<Route
 path="/dashboard" 
 element={
      <ProtectedRoute>
 <Dashboard />
 </ProtectedRoute>
 }
  />
<Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <Analytics />
    </ProtectedRoute>
  }
/>
<Route
  path="/products"
  element={
    <ProtectedRoute>
      <Products />
    </ProtectedRoute>
  }
/>
<Route
  path="/products/new"
  element={
    <ProtectedRoute>
      <ProductForm />
    </ProtectedRoute>
  }
/>
<Route
  path="/products/:id"
  element={
    <ProtectedRoute>
      <ProductForm />
    </ProtectedRoute>
  }
/>
<Route
  path="/admins"
  element={
    <ProtectedRoute>
      <Admins />
    </ProtectedRoute>
  }
/>
<Route
  path="/knowledge"
  element={
    <ProtectedRoute>
      <KnowledgeBase />
    </ProtectedRoute>
  }
/>
<Route
  path="/settings"
  element={
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  }
/>
<Route path="/admin" element={<SuperAdminRoute><AdminDashboard /></SuperAdminRoute>} />
<Route path="/admin/analytics" element={<SuperAdminRoute><Analytics isAdmin /></SuperAdminRoute>} />
<Route path="/admin/stores" element={<SuperAdminRoute><Stores /></SuperAdminRoute>} />
<Route path="/admin/stores/:id" element={<SuperAdminRoute><ProductForm isAdmin /></SuperAdminRoute>} />
<Route path="/admin/stores/:id/admins" element={<SuperAdminRoute><Admins /></SuperAdminRoute>} />
<Route path="/admin/system" element={<SuperAdminRoute><SystemHealth /></SuperAdminRoute>} />
<Route path="/admin/tools" element={<SuperAdminRoute><Settings isAdmin /></SuperAdminRoute>} />
<Route path="/admin/knowledge" element={<SuperAdminRoute><KnowledgeBase isAdmin /></SuperAdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
          <Sonner />
        </TranslationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
