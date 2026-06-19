import { useEffect, useState } from 'react';
import { Order } from '../types';
import { INITIAL_ORDERS } from '../mockData';

interface QueueDisplayScreenProps {
  orders: Order[];
}

export default function QueueDisplayScreen({ orders }: QueueDisplayScreenProps) {
  const [liveOrders, setLiveOrders] = useState<Order[]>(orders.length ? orders : INITIAL_ORDERS);

  useEffect(() => {
    setLiveOrders(orders.length ? orders : INITIAL_ORDERS);
  }, [orders]);

  const calledOrders = liveOrders
    .filter(order => order.status === 'Queue Called' && order.queueNo)
    .sort((a, b) => b.time.localeCompare(a.time));

  return (
    <div className="min-h-screen bg-[#0d1218] text-white font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-end justify-between border-b border-white/15 pb-5">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#e0e2e6] font-bold">Quick Coffee</p>
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
              <div key={order.id} className="rounded-3xl bg-[#f8fafc] text-[#181d26] p-6 shadow-2xl border-4 border-[#9297a0]">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#181d26]">Now Calling</p>
                <div className="font-mono text-7xl font-black leading-none mt-3">Q-{order.queueNo}</div>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold">{order.branch}</p>
                    <p className="text-xs text-zinc-500">{order.id}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#181d26] text-white text-xs font-bold">Queue Called</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
