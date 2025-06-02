import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '../supabaseClient';

interface Product {
  id: number;
  name: string;
  thumbnail: string;
  image: string;
  urls: {
    customer: string;
  };
}

interface ProductPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

const ProductPicker: React.FC<ProductPickerProps> = ({ open, onClose, onSelect }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const storeId = localStorage.getItem('store_id');
      if (!storeId) return;

      // ✅ Get access token from Supabase
      const { data: storeData, error } = await supabase
        .from('stores')
        .select('access_token')
        .eq('id', storeId)
        .single();

      const accessToken = storeData?.access_token;
      if (!accessToken) {
        console.error('No access token found');
        return;
      }

      // ✅ Fetch products from Salla
      try {
        const response = await fetch('https://api.salla.dev/admin/v2/products', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('Salla API error:', await response.text());
          return;
        }

        const result = await response.json();
        setProducts(result.data || []);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      setLoading(true);
      fetchProducts();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>اختر منتج من متجرك</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="w-full h-32 rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:border-primary p-2 border"
                onClick={() => {
                  onSelect({
                    id: product.id,
                    name: product.name,
                    thumbnail: product.thumbnail,
                    image: product.thumbnail,
                    urls: product.urls,
                  });
                  onClose();
                }}
              >
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <p className="text-sm font-medium">{product.name}</p>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductPicker;
