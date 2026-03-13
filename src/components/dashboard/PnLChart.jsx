import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.[0]) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-white text-sm font-medium">{d.symbol}</p>
        <p className={`text-xs font-semibold ${d.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {d.pnl >= 0 ? '+' : ''}${d.pnl.toFixed(2)} ({d.pnlPercent.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function PnLChart({ stocks }) {
  const data = stocks.map(s => {
    const pnl = ((s.current_price || s.buy_price) - s.buy_price) * s.quantity;
    const pnlPercent = s.buy_price > 0 ? (((s.current_price || s.buy_price) - s.buy_price) / s.buy_price) * 100 : 0;
    return { symbol: s.symbol, pnl, pnlPercent };
  }).sort((a, b) => b.pnl - a.pnl);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        No data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <XAxis dataKey="symbol" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
