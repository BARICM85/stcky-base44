import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Loader2, TrendingUp, TrendingDown, Building2, Calendar, DollarSign, BarChart3, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function StockDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const stockId = urlParams.get('id');
  const [refreshing, setRefreshing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const { data: stocks = [], isLoading } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => base44.entities.Stock.list(),
  });

  const stock = stocks.find(s => s.id === stockId);

  const handleRefresh = async () => {
    if (!stock) return;
    setRefreshing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Get detailed current information about Indian stock ${stock.symbol} (${stock.name}) listed on NSE/BSE. I need: current price in INR, beta, PE ratio, market cap in INR, dividend yield, and sector.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          current_price: { type: "number" },
          beta: { type: "number" },
          pe_ratio: { type: "number" },
          market_cap: { type: "string" },
          dividend_yield: { type: "number" },
          sector: { type: "string" }
        }
      },
      model: "gemini_3_flash"
    });
    
    const updateData = {};
    if (result.current_price > 0) updateData.current_price = result.current_price;
    if (result.beta) updateData.beta = result.beta;
    if (result.pe_ratio) updateData.pe_ratio = result.pe_ratio;
    if (result.market_cap) updateData.market_cap = result.market_cap;
    if (result.dividend_yield) updateData.dividend_yield = result.dividend_yield;
    if (result.sector) updateData.sector = result.sector;

    await base44.entities.Stock.update(stock.id, updateData);
    toast.success('Stock data updated');
    queryClient.invalidateQueries({ queryKey: ['stocks'] });
    setRefreshing(false);
  };

  const handleAnalyze = async () => {
    if (!stock) return;
    setAnalyzing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Provide a brief investment analysis for Indian stock ${stock.symbol} (${stock.name}) listed on NSE/BSE. Include: 
        1. Current market sentiment (bullish/bearish/neutral)
        2. Key risks (2-3 bullet points)
        3. Key opportunities (2-3 bullet points)
        4. A brief recommendation
        Keep it concise and actionable.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          sentiment: { type: "string" },
          risks: { type: "array", items: { type: "string" } },
          opportunities: { type: "array", items: { type: "string" } },
          recommendation: { type: "string" }
        }
      },
      model: "gemini_3_flash"
    });
    setAnalysis(result);
    setAnalyzing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Stock not found</p>
        <Link to="/Portfolio" className="text-emerald-400 text-sm mt-2 inline-block hover:underline">Back to Portfolio</Link>
      </div>
    );
  }

  const currentPrice = stock.current_price || stock.buy_price;
  const pnl = (currentPrice - stock.buy_price) * stock.quantity;
  const pnlPercent = stock.buy_price > 0 ? ((currentPrice - stock.buy_price) / stock.buy_price) * 100 : 0;
  const isProfit = pnl >= 0;
  const totalValue = currentPrice * stock.quantity;

  const infoItems = [
    { label: 'Sector', value: stock.sector || '—', icon: Building2 },
    { label: 'Buy Date', value: stock.buy_date || '—', icon: Calendar },
    { label: 'Beta', value: stock.beta?.toFixed(2) || '—', icon: BarChart3 },
    { label: 'P/E Ratio', value: stock.pe_ratio?.toFixed(1) || '—', icon: DollarSign },
    { label: 'Market Cap', value: stock.market_cap || '—', icon: BarChart3 },
    { label: 'Div Yield', value: stock.dividend_yield ? `${stock.dividend_yield.toFixed(2)}%` : '—', icon: Percent },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/Portfolio" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
              <span className="text-base font-bold text-emerald-400">{stock.symbol?.slice(0, 2)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{stock.symbol}</h1>
              <p className="text-slate-500 text-sm">{stock.name}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Update
          </Button>
          <Button onClick={handleAnalyze} disabled={analyzing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
            Analyze
          </Button>
        </div>
      </div>

      {/* Price overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Current Price</p>
          <p className="text-2xl font-bold text-white mt-1">₹{currentPrice.toFixed(2)}</p>
          <p className="text-xs text-slate-500">INR</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total Value</p>
          <p className="text-2xl font-bold text-white mt-1">₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-500">{stock.quantity} shares</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Avg Buy Price</p>
          <p className="text-2xl font-bold text-white mt-1">₹{stock.buy_price.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider">P&L</p>
          <div className="flex items-center gap-2 mt-1">
            {isProfit ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
            <p className={`text-2xl font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%
            </p>
          </div>
          <p className={`text-xs ${isProfit ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
            {isProfit ? '+' : ''}₹{pnl.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-white mb-4">Stock Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {infoItems.map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800">
                <item.icon className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-sm text-white font-medium">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis */}
      {analysis && (
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">AI Analysis</h2>
            <Badge className={`${
              analysis.sentiment === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
              analysis.sentiment === 'bearish' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {analysis.sentiment}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-red-400 mb-2">Key Risks</p>
              <ul className="space-y-1.5">
                {analysis.risks?.map((r, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-400 mb-2">Opportunities</p>
              <ul className="space-y-1.5">
                {analysis.opportunities?.map((o, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">•</span> {o}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-400 mb-2">Recommendation</p>
            <p className="text-sm text-slate-300">{analysis.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
