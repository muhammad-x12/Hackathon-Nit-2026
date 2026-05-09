import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { Loader2, Package, ChevronRight, Calendar } from 'lucide-react';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.get('/my-orders');
        const dt = res.data?.data ?? res.data;
        setOrders(Array.isArray(dt) ? dt : []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const sorted = useMemo(() => {
    return [...orders].sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta;
    });
  }, [orders]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
        <h1 className="text-lg font-black text-slate-900">Orders</h1>
        <p className="text-sm text-slate-500 mt-1">All your orders in one place.</p>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-500">
          <Loader2 className="animate-spin mx-auto mb-2 text-indigo-600" size={24} />
          Loading orders…
        </div>
      ) : sorted.length === 0 ? (
        <div className="p-10 text-center text-slate-500">No orders found.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {sorted.map((o) => (
            <Link
              key={o.id}
              to={`/profile/orders/${o.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                <Package className="text-slate-400" size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-slate-900 truncate">{o.order_number || `Order #${o.id}`}</p>
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1 whitespace-nowrap">
                    <Calendar size={12} />
                    {o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}
                  </p>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Status: <span className="font-bold">{o.delivery_status || o.order_status}</span> · Total:{' '}
                  <span className="font-black">₹{o.total_amount}</span>
                </p>
              </div>
              <ChevronRight className="text-slate-300" size={18} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersList;

