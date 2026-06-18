import { useEffect, useState } from 'react';
import { Order } from '../types';

interface QueueDisplayScreenProps {
  orders: Order[];
}

export default function QueueDisplayScreen({ orders }: QueueDisplayScreenProps) {
  const [liveOrders, setLiveOrders] = useState<Order[]>(orders);

  useEffect(() => {
    setLiveOrders(orders);
  }, [orders]);

  useEffect(() => {
    const syncOrders = () => {
      try {
        const stored = localStorage.getItem('qc_orders');
        if (stored) setLiveOrders(JSON.parse(stored));
      } catch (error) {
        console.error('Unable to sync queue display orders', error);
      }
    };
    syncOrders();
    window.addEventListener('storage', syncOrders);
    const timer = window.setInterval(syncOrders, 5000);
    return () => {
      window.removeEventListener('storage', syncOrders);
      window.clearInterval(timer);
    };
  }, []);

  const calledOrders = liveOrders
    .filter(order => order.status === 'Queue Called' && order.queueNo)
    .sort((a, b) => b.time.localeCompare(a.time));

  return (
    <div className="min-h-screen bg-[#1E1510] text-white font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-end justify-between border-b border-white/15 pb-5">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#EAD1A8] font-bold">Quick Coffee</p>
            <h1 className="text-4xl font-black mt-2">Queue Display</h1>
          </div>
          <p className="text-sm text-white/60 font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </header>

        {calledOrders.length === 0 ? (
          <div className="h-[60vh] flex items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <p className="text-2xl font-bold text-white/50">No queues called yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {calledOrders.map(order => (
              <div key={order.id} className="rounded-3xl bg-[#FDF1E6] text-[#2E2A25] p-6 shadow-2xl border-4 border-[#D8B88F]">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#8B6B4F]">Now Calling</p>
                <div className="font-mono text-7xl font-black leading-none mt-3">Q-{order.queueNo}</div>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold">{order.branch}</p>
                    <p className="text-xs text-zinc-500">{order.id}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#8B6B4F] text-white text-xs font-bold">Queue Called</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
