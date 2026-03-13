import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Activity } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue }) => (
  <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-5 hover:border-emerald-500/20 transition-all duration-300">
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="p-2.5 rounded-xl bg-slate-800/80">
        <Icon className="w-5 h-5 text-emerald-400" />
      </div>
    </div>
    {trendValue !== undefined && (
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/50">
        {trend === 'up' ? (
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-red-400" />
        )}
        <span className={`text-xs font-semibold ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
          {trendValue}
        </span>
        <span className="text-xs text-slate-500">overall</span>
      </div>
    )}
  </div>
);

export default function PortfolioStats({ stocks }) {
  const totalInvested = stocks.reduce((sum, s) => sum + (s.buy_price * s.quantity), 0);
  const totalCurrent = stocks.reduce((sum, s) => sum + ((s.current_price || s.buy_price) * s.quantity), 0);
  const totalPnL = totalCurrent - totalInvested;
  const pnlPercent = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0;
  const isProfit = totalPnL >= 0;

  const topGainer = stocks.length > 0 
    ? stocks.reduce((best, s) => {
        const gain = ((s.current_price || s.buy_price) - s.buy_price) / s.buy_price;
        const bestGain = ((best.current_price || best.buy_price) - best.buy_price) / best.buy_price;
        return gain > bestGain ? s : best;
      })
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Portfolio Value"
        value={`₹${totalCurrent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subtitle={`${stocks.length} holdings`}
        icon={DollarSign}
        trend={isProfit ? 'up' : 'down'}
        trendValue={`${isProfit ? '+' : ''}${pnlPercent}%`}
      />
      <StatCard
        title="Total Invested"
        value={`₹${totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={BarChart3}
      />
      <StatCard
        title="Total P&L"
        value={`${isProfit ? '+' : ''}₹${totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subtitle={`${isProfit ? '+' : ''}${pnlPercent}%`}
        icon={Activity}
        trend={isProfit ? 'up' : 'down'}
        trendValue={`${isProfit ? '+' : ''}₹${Math.abs(totalPnL).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      />
      <StatCard
        title="Top Performer"
        value={topGainer ? topGainer.symbol : '—'}
        subtitle={topGainer ? topGainer.name : 'No stocks yet'}
        icon={PieChart}
      />
    </div>
  );
}
