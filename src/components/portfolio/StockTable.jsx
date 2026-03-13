import React from 'react';
import { Trash2, TrendingUp, TrendingDown, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function StockTable({ stocks, onDelete, onRefreshPrice, refreshingId }) {
  if (stocks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-slate-600" />
        </div>
        <p className="text-slate-400 text-sm">No stocks in your portfolio yet</p>
        <p className="text-slate-600 text-xs mt-1">Add your first stock to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800/50">
            <th className="text-left text-xs font-medium uppercase tracking-wider text-slate-500 pb-3 pl-2">Stock</th>
            <th className="text-right text-xs font-medium uppercase tracking-wider text-slate-500 pb-3">Qty</th>
            <th className="text-right text-xs font-medium uppercase tracking-wider text-slate-500 pb-3">Avg Cost</th>
            <th className="text-right text-xs font-medium uppercase tracking-wider text-slate-500 pb-3">Current</th>
            <th className="text-right text-xs font-medium uppercase tracking-wider text-slate-500 pb-3">Value</th>
            <th className="text-right text-xs font-medium uppercase tracking-wider text-slate-500 pb-3">P&L</th>
            <th className="text-right text-xs font-medium uppercase tracking-wider text-slate-500 pb-3 pr-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/30">
          {stocks.map((stock) => {
            const currentPrice = stock.current_price || stock.buy_price;
            const value = currentPrice * stock.quantity;
            const pnl = (currentPrice - stock.buy_price) * stock.quantity;
            const pnlPercent = stock.buy_price > 0 ? ((currentPrice - stock.buy_price) / stock.buy_price) * 100 : 0;
            const isProfit = pnl >= 0;

            return (
              <tr key={stock.id} className="group hover:bg-slate-800/20 transition-colors">
                <td className="py-3.5 pl-2">
                  <Link to={`/StockDetail?id=${stock.id}`} className="flex items-center gap-3 hover:opacity-80">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-400">{stock.symbol?.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{stock.symbol}</p>
                      <p className="text-slate-500 text-xs truncate max-w-[120px]">{stock.name}</p>
                    </div>
                  </Link>
                </td>
                <td className="text-right text-sm text-slate-300 py-3.5">{stock.quantity}</td>
                <td className="text-right text-sm text-slate-300 py-3.5">₹{stock.buy_price?.toFixed(2)}</td>
                <td className="text-right text-sm text-white font-medium py-3.5">₹{currentPrice?.toFixed(2)}</td>
                <td className="text-right text-sm text-white font-medium py-3.5">₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="text-right py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    {isProfit ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                    <span className={`text-sm font-semibold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="text-right py-3.5 pr-2">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-slate-500 hover:text-emerald-400 hover:bg-slate-800"
                      onClick={() => onRefreshPrice(stock)}
                      disabled={refreshingId === stock.id}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshingId === stock.id ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-slate-800"
                      onClick={() => onDelete(stock.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
