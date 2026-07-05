'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { showExpiryDate, showImageUpload } from '@/lib/utils';
import type { Product, Tenant } from '@/types';
import BarcodeScanner from '@/components/pos/BarcodeScanner';

interface Props {
  product: Product | null;
  tenant: Tenant;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductFormModal({ product, tenant, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [form, setForm] = useState({
    name: product?.name ?? '',
    barcode: product?.barcode ?? '',
    price: product?.price?.toString() ?? '',
    cost: product?.cost?.toString() ?? '',
    stock_qty: product?.stock_qty?.toString() ?? '0',
    category: product?.category ?? '',
    expiry_date: product?.expiry_date ?? '',
    image_url: product?.image_url ?? '',
  });

  const showExpiry = showExpiryDate(tenant.business_type);
  const showImage = showImageUpload(tenant.business_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('အမည်နှင့် စျေးနှုန်း ထည့်ပါ');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const payload = {
      tenant_id: tenant.id,
      name: form.name,
      barcode: form.barcode || null,
      price: parseFloat(form.price),
      cost: form.cost ? parseFloat(form.cost) : null,
      stock_qty: parseInt(form.stock_qty) || 0,
      category: form.category || null,
      expiry_date: form.expiry_date || null,
      image_url: form.image_url || null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (product) {
      ({ error } = await supabase.from('products').update(payload).eq('id', product.id));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }

    if (error) {
      toast.error('သိမ်းဆည်းမအောင်မြင်ပါ: ' + error.message);
    } else {
      toast.success(product ? 'ပြင်ဆင်ပြီးပါပြီ' : 'ထည့်သွင်းပြီးပါပြီ');
      onSaved();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {product ? 'ကုန်ပစ္စည်း ပြင်မည်' : 'ကုန်ပစ္စည်း အသစ်ထည့်မည်'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">အမည် *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
              placeholder="ကုန်ပစ္စည်းအမည်"
            />
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                placeholder="Barcode (ရိုက်ထည့် သို့ Scan)"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="px-3 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <Camera className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Price & Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ရောင်းစျေး (Ks) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ဝယ်စျေး (Ks)</label>
              <input
                type="number"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                placeholder="0"
              />
            </div>
          </div>

          {/* Stock & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock အရေအတွက်</label>
              <input
                type="number"
                value={form.stock_qty}
                onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">အမျိုးအစား</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                placeholder="Category"
              />
            </div>
          </div>

          {/* Expiry Date (conditional) */}
          {showExpiry && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">သက်တမ်းကုန်ဆုံးရက်</label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
              />
            </div>
          )}

          {/* Image URL (conditional) */}
          {showImage && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ပုံ URL</label>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                placeholder="https://..."
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              မလုပ်တော့ပါ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'သိမ်းနေသည်...' : 'သိမ်းမည်'}
            </button>
          </div>
        </form>
      </div>

      {showScanner && (
        <BarcodeScanner
          onDetected={(code) => {
            setForm({ ...form, barcode: code });
            setShowScanner(false);
            toast.success('Barcode ရပြီ: ' + code);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
