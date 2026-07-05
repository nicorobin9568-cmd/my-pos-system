'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { Plus, Search, Edit2, Trash2, Package, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import ProductFormModal from '@/components/products/ProductFormModal';

export default function ProductsPage() {
  const { tenant } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    if (!tenant) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('name');
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [tenant]);

  const deleteProduct = async (id: string) => {
    if (!confirm('ဤပစ္စည်းကို ဖျက်မည်လား?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast.error('ဖျက်မအောင်မြင်ပါ');
      return;
    }
    toast.success('ဖျက်ပြီးပါပြီ');
    fetchProducts();
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode ?? '').includes(search) ||
      (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-emerald-600" />
          <h2 className="text-xl font-bold text-gray-900">ကုန်ပစ္စည်းများ</h2>
        </div>
        <button
          onClick={() => { setEditProduct(null); setShowModal(true); }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" />
          ထည့်မည်
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ကုန်ပစ္စည်းအမည်၊ barcode ရှာပါ..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">ဖတ်နေသည်...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">ကုန်ပစ္စည်းမရှိသေးပါ</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((product) => (
            <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    {product.stock_qty <= 5 && (
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  {product.barcode && (
                    <p className="text-xs text-gray-400 font-mono">{product.barcode}</p>
                  )}
                  {product.category && (
                    <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1">
                      {product.category}
                    </span>
                  )}
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="font-bold text-emerald-600">{formatCurrency(product.price)}</p>
                  <p className={`text-xs mt-1 ${product.stock_qty <= 5 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                    Stock: {product.stock_qty}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setEditProduct(product); setShowModal(true); }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  ပြင်မည်
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  ဖျက်မည်
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProductFormModal
          product={editProduct}
          tenant={tenant!}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchProducts(); }}
        />
      )}
    </div>
  );
}
