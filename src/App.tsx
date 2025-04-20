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
import Admins from "./pages/Admins";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Stores from "./pages/Stores";

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
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/index" element={<Index />} />
              
              {/* Store Owner Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/new" element={<ProductForm />} />
              <Route path="/products/:id" element={<ProductForm />} />
              <Route path="/admins" element={<Admins />} />
              <Route path="/knowledge" element={<KnowledgeBase />} />
              <Route path="/settings" element={<Settings />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<Analytics isAdmin />} />
              <Route path="/admin/stores" element={<Stores />} />
              <Route path="/admin/stores/:id" element={<ProductForm isAdmin />} />
              <Route path="/admin/stores/:id/admins" element={<Admins />} />
              <Route path="/admin/system" element={<SystemHealth />} />
              <Route path="/admin/tools" element={<Settings isAdmin />} />
              <Route path="/admin/knowledge" element={<KnowledgeBase isAdmin />} />
              
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
