import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PortfolioStats from '../components/dashboard/PortfolioStats';
import AllocationChart from '../components/dashboard/AllocationChart';
import PnLChart from '../components/dashboard/PnLChart';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Dashboard() {
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [chartView, setChartView] = useState('stock');

  const { data: stocks = [], isLoading, refetch } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => base44.entities.Stock.list('-created_date'),
  });

  const handleRefreshAll = async () => {
    if (stocks.length === 0) return;
    setRefreshingAll(true);
    const symbols = stocks.map(s => s.symbol).join(', ');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Get the current NSE/BSE stock prices in Indian Rupees (INR) for these Indian stock tickers: ${symbols}. Return accurate current market prices in INR.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          prices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                price: { type: "number" }
              }
            }
          }
        }
      },
      model: "gemini_3_flash"
    });

    if (result?.prices) {
      for (const p of result.prices) {
        const stock = stocks.find(s => s.symbol.toUpperCase() === p.symbol.toUpperCase());
        if (stock && p.price > 0) {
          await base44.entities.Stock.update(stock.id, { current_price: p.price });
        }
      }
      toast.success('Prices updated');
      refetch();
    }
    setRefreshingAll(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your portfolio at a glance</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefreshAll}
          disabled={refreshingAll || stocks.length === 0}
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-emerald-400"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshingAll ? 'animate-spin' : ''}`} />
          {refreshingAll ? 'Updating...' : 'Refresh Prices'}
        </Button>
      </div>

      <PortfolioStats stocks={stocks} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Allocation</h2>
            <div className="flex gap-1 bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setChartView('stock')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${chartView === 'stock' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                By Stock
              </button>
              <button
                onClick={() => setChartView('sector')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${chartView === 'sector' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                By Sector
              </button>
            </div>
          </div>
          <AllocationChart stocks={stocks} groupBy={chartView} />
        </div>

        <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">Profit & Loss</h2>
          <PnLChart stocks={stocks} />
        </div>
      </div>
    </div>
  );
}
