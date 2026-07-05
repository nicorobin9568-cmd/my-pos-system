'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { db } from '@/lib/db';
import { generateId, formatCurrency } from '@/lib/utils';
import { Search, Camera, ShoppingCart, Trash2, Plus, Minus, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product, PaymentMethod } from '@/types';
import BarcodeScanner from '@/components/pos/BarcodeScanner';

export default function POSPage() {
  const { profile, tenant } = useAuthStore();
  const { items, addItem, removeItem, updateQty, clearCart, total } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    if (!tenant) return;
    // Load from IndexedDB first (offline-first)
    const localProducts = await db.products
      .where('tenant_id')
      .equals(tenant.id)
      .toArray();

    if (localProducts.length > 0) {
      setProducts(localProducts);
      setLoading(false);
    }

    // Also fetch from Supabase if online
    if (navigator.onLine) {
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenant.id)
        .gt('stock_qty', 0)
        .order('name');

      if (data) {
        setProducts(data as Product[]);
        await db.products.bulkPut(data as Product[]);
      }
    }
    setLoading(false);
  }, [tenant]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleBarcodeDetected = async (code: string) => {
    setShowScanner(false);
    const product = products.find((p) => p.barcode === code);
    if (product) {
      addItem(product);
      toast.success(`${product.name} ထည့်ပြီးပါပြီ`);
    } else {
      toast.error('ဤ barcode နဲ့ ကုန်ပစ္စည်းမတွေ့ပါ');
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!profile || !tenant) return;

    setCheckoutLoading(true);

    const saleId = generateId();
    const now = new Date().toISOString();

    try {
      // Save to IndexedDB first (offline-first)
      await db.sales.add({
        id: saleId,
        tenant_id: tenant.id,
        cashier_id: profile.id,
        total: total(),
        payment_method: paymentMethod,
        sync_status: 'pending',
        created_at: now,
      });

      const saleItems = items.map((item) => ({
        id: generateId(),
        sale_id: saleId,
        product_id: item.product.id,
        qty: item.qty,
        unit_price: item.product.price,
      }));

      await db.sale_items.bulkAdd(saleItems);

      // Update local stock
      for (const item of items) {
        await db.products.update(item.product.id, {
          stock_qty: Math.max(0, item.product.stock_qty - item.qty),
        });
      }

      // Try to sync immediately if online
      if (navigator.onLine) {
        const supabase = createClient();
        const { error: saleError } = await supabase.from('sales').insert({
          id: saleId,
          tenant_id: tenant.id,
          cashier_id: profile.id,
          total: total(),
          payment_method: paymentMethod,
          created_at: now,
        });

        if (!saleError) {
          await supabase.from('sale_items').insert(saleItems);

          // Atomic stock decrement
          for (const item of items) {
            await supabase.rpc('decrement_stock', {
              p_product_id: item.product.id,
              p_qty: item.qty,
            });
          }

          await db.sales.update(saleId, { sync_status: 'synced' });
        }
      }

      clearCart();
      setShowCheckout(false);
      toast.success('ရောင်းချမှု အောင်မြင်သည်! 🎉');
      loadProducts();
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('ရောင်းချမှု မအောင်မြင်ပါ');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode ?? '').includes(search)
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search + Scan Bar */}
      <div className="p-3 bg-white border-b border-gray-100 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ကုန်ပစ္စည်း ရှာပါ..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
        <button
          onClick={() => setShowScanner(true)}
          className="px-3 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">ဖတ်နေသည်...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-gray-400">ကုန်ပစ္စည်းမတွေ့ပါ</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredProducts.map((product) => {
              const inCart = items.find((i) => i.product.id === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => {
                    if (product.stock_qty <= 0) {
                      toast.error('Stock မရှိတော့ပါ');
                      return;
                    }
                    addItem(product);
                  }}
                  className={`bg-white rounded-xl p-3 text-left shadow-sm border transition-all active:scale-95 ${
                    inCart
                      ? 'border-emerald-400 bg-emerald-50'
                      : product.stock_qty <= 0
                      ? 'border-gray-100 opacity-50'
                      : 'border-gray-100 hover:border-emerald-200'
                  }`}
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-20 object-cover rounded-lg mb-2"
                    />
                  )}
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                    {product.name}
                  </p>
                  <p className="text-emerald-600 font-bold text-sm mt-1">
                    {formatCurrency(product.price)}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-xs ${product.stock_qty <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                      {product.stock_qty <= 0 ? 'ကုန်ပြီ' : `${product.stock_qty} ခု`}
                    </p>
                    {inCart && (
                      <span className="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                        ×{inCart.qty}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Summary Bar */}
      {items.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-3">
          {/* Cart Items */}
          <div className="max-h-40 overflow-y-auto mb-3 space-y-2">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-2">
                <p className="flex-1 text-sm text-gray-800 truncate">{item.product.name}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.product.id, item.qty - 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.product.id, item.qty + 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm font-medium text-emerald-600 w-20 text-right">
                  {formatCurrency(item.product.price * item.qty)}
                </p>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{items.length} မျိုး</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(total())}</p>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              ရောင်းမည်
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ရောင်းချမှု အတည်ပြုရန်</h2>

            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.product.name} × {item.qty}</span>
                  <span className="font-medium">{formatCurrency(item.product.price * item.qty)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 mb-4">
              <div className="flex justify-between text-lg font-bold">
                <span>စုစုပေါင်း</span>
                <span className="text-emerald-600">{formatCurrency(total())}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">ငွေပေးချေမှုနည်းလမ်း</p>
              <div className="flex gap-2">
                {(['cash', 'card', 'other'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                      paymentMethod === method
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {method === 'cash' ? 'ငွေသား' : method === 'card' ? 'ကတ်' : 'အခြား'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {checkoutLoading ? 'သိမ်းနေသည်...' : 'အတည်ပြုမည်'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
