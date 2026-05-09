import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { Link, useParams } from 'react-router-dom';
import { Loader2, ArrowLeft, Package, Truck, MapPin, ReceiptText, Clock } from 'lucide-react';

const badgeCls = (tone) =>
  ({
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warn: 'bg-amber-50 text-amber-700 border-amber-100',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    bad: 'bg-rose-50 text-rose-700 border-rose-100',
  }[tone] || 'bg-slate-50 text-slate-700 border-slate-200');

const OrderDetails = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [track, setTrack] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/order/${id}`);
        const dt = res.data?.data ?? res.data;
        setOrder(dt || null);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  useEffect(() => {
    const run = async () => {
      setTrackLoading(true);
      try {
        const res = await api.get(`/order/${id}/track`);
        setTrack(res.data || null);
      } catch {
        setTrack(null);
      } finally {
        setTrackLoading(false);
      }
    };
    run();
  }, [id]);

  const items = order?.items?.data || order?.items || [];

  const timeline = useMemo(() => {
    const t = track?.tracking;
    if (!t || typeof t !== 'object') return [];

    // Shiprocket commonly returns: tracking_data.shipment_track_activities[]
    const activities =
      t?.tracking_data?.shipment_track_activities ||
      t?.tracking_data?.shipment_track_activities?.data ||
      t?.tracking_data?.shipment_track?.[0]?.shipment_track_activities ||
      t?.tracking_data?.shipment_track?.[0]?.shipment_track_activities?.data ||
      [];

    if (!Array.isArray(activities)) return [];

    const normalized = activities
      .map((a) => {
        const date =
          a?.date ||
          a?.activity_date ||
          a?.pickup_date ||
          a?.created_at ||
          a?.updated_at ||
          null;
        const status =
          a?.status ||
          a?.activity ||
          a?.current_status ||
          a?.sr_status ||
          a?.track_status ||
          'Update';
        const location =
          a?.location ||
          a?.city ||
          a?.state ||
          a?.hub ||
          a?.branch ||
          '';
        const desc =
          a?.description ||
          a?.remarks ||
          a?.message ||
          a?.activity ||
          '';
        const ts = date ? new Date(date).getTime() : 0;
        return { date, status, location, desc, ts };
      })
      .sort((x, y) => (y.ts || 0) - (x.ts || 0));

    return normalized;
  }, [track]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-slate-500">
        <Loader2 className="animate-spin mx-auto mb-2 text-indigo-600" size={24} />
        Loading order…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-slate-500">
        Order not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/profile/orders" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900">
          <ArrowLeft size={16} /> Back to orders
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-lg font-black text-slate-900">{order.order_number || `Order #${order.id}`}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-xs font-black px-3 py-1 rounded-full border ${badgeCls('info')}`}>Payment: {order.payment_status}</span>
            <span className={`text-xs font-black px-3 py-1 rounded-full border ${badgeCls(order.delivery_status === 'delivered' ? 'ok' : order.delivery_status === 'cancelled' ? 'bad' : 'warn')}`}>
              Delivery: {order.delivery_status}
            </span>
            <span className={`text-xs font-black px-3 py-1 rounded-full border ${badgeCls('warn')}`}>Order: {order.order_status}</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
              <Package size={14} /> Items
            </h2>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="divide-y divide-slate-100">
                {items.map((it) => (
                  <div key={it.id || `${it.product_id}-${it.quantity}`} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 truncate">{it.product_name || it.product?.name || 'Item'}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        Qty: <span className="font-bold">{it.quantity}</span> · Price: <span className="font-bold">₹{it.price ?? it.final_price ?? '-'}</span>
                      </p>
                      {it.courier_name && it.tracking_number && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <Truck size={12} /> {it.courier_name} · AWB: <span className="font-mono">{it.tracking_number}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">₹{it.subtotal ?? (it.quantity && it.price ? it.quantity * it.price : '')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
              <ReceiptText size={14} /> Summary
            </h2>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-bold">Total</span>
                <span className="text-slate-900 font-black">₹{order.total_amount}</span>
              </div>
            </div>

            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
              <MapPin size={14} /> Shipping Address
            </h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm">
              <p className="font-black text-slate-900">{order.shipping_address?.name || 'Customer'}</p>
              <p className="text-slate-600 mt-1">{order.shipping_address?.address}</p>
              <p className="text-slate-600">{order.shipping_address?.city} {order.shipping_address?.pincode ? `· ${order.shipping_address.pincode}` : ''}</p>
              {order.shipping_address?.phone && <p className="text-slate-700 font-bold mt-2">Phone: {order.shipping_address.phone}</p>}
            </div>

            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
              <Truck size={14} /> Tracking Timeline
            </h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              {trackLoading ? (
                <div className="text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="animate-spin text-indigo-600" size={16} /> Loading tracking…
                </div>
              ) : !track ? (
                <div className="text-sm text-slate-500">Tracking not available yet.</div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <p className="text-sm font-black text-slate-900">
                      {track?.courier ? `${track.courier} · ` : ''}{track?.awb ? `AWB: ${track.awb}` : ''}
                    </p>
                    <span className="text-[10px] font-black px-3 py-1 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-100">
                      {track?.status || 'Tracking'}
                    </span>
                  </div>

                  {timeline.length === 0 ? (
                    <div className="text-sm text-slate-500">No tracking events yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {timeline.map((ev, idx) => (
                        <div key={idx} className="relative pl-6">
                          <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-indigo-600" />
                          {idx !== timeline.length - 1 && (
                            <div className="absolute left-1.5 top-4 bottom-[-12px] w-px bg-slate-200" />
                          )}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 truncate">{ev.status}</p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {[ev.location, ev.desc].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
                              <Clock size={12} />
                              {ev.date ? new Date(ev.date).toLocaleString() : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

