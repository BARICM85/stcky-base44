import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#a855f7'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.[0]) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-white text-sm font-medium">{payload[0].name}</p>
        <p className="text-emerald-400 text-xs">{payload[0].value.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

export default function AllocationChart({ stocks, groupBy = 'stock' }) {
  const getData = () => {
    if (groupBy === 'sector') {
      const sectorMap = {};
      const total = stocks.reduce((s, st) => s + ((st.current_price || st.buy_price) * st.quantity), 0);
      stocks.forEach(s => {
        const sector = s.sector || 'Unknown';
        const value = (s.current_price || s.buy_price) * s.quantity;
        sectorMap[sector] = (sectorMap[sector] || 0) + value;
      });
      return Object.entries(sectorMap).map(([name, value]) => ({
        name,
        value: total > 0 ? (value / total) * 100 : 0
      }));
    }
    
    const total = stocks.reduce((s, st) => s + ((st.current_price || st.buy_price) * st.quantity), 0);
    return stocks.map(s => ({
      name: s.symbol,
      value: total > 0 ? (((s.current_price || s.buy_price) * s.quantity) / total) * 100 : 0
    }));
  };

  const data = getData();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        No holdings to display
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="w-48 h-48 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2 max-h-48 overflow-y-auto">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-slate-300 truncate">{item.name}</span>
            </div>
            <span className="text-white font-medium">{item.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
