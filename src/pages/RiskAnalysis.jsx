import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, Loader2, TrendingUp, BarChart3, Percent, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function RiskAnalysis() {
  const [riskReport, setRiskReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: stocks = [], isLoading } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => base44.entities.Stock.list('-created_date'),
  });

  const generateRiskReport = async () => {
    setLoading(true);
    const portfolioSummary = stocks.map(s => ({
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      quantity: s.quantity,
      buy_price: s.buy_price,
      current_price: s.current_price || s.buy_price,
      value: (s.current_price || s.buy_price) * s.quantity,
      beta: s.beta
    }));

    const totalValue = portfolioSummary.reduce((s, p) => s + p.value, 0);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this stock portfolio for risk. Portfolio (total value: $${totalValue.toFixed(2)}):
${JSON.stringify(portfolioSummary, null, 2)}

Provide a comprehensive risk analysis including:
1. Overall risk score (1-100, where 100 is highest risk)
2. Diversification score (1-100, where 100 is well-diversified)
3. Concentration risk - identify over-weighted positions
4. Sector exposure analysis
5. Beta-weighted risk assessment
6. Key risk factors (3-5 items)
7. Hedging recommendations (3-5 specific suggestions)
8. Overall assessment summary`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          risk_score: { type: "number" },
          diversification_score: { type: "number" },
          concentration_risks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                weight: { type: "number" },
                concern: { type: "string" }
              }
            }
          },
          sector_exposure: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sector: { type: "string" },
                percentage: { type: "number" }
              }
            }
          },
          portfolio_beta: { type: "number" },
          risk_factors: { type: "array", items: { type: "string" } },
          hedging_suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                strategy: { type: "string" },
                description: { type: "string" }
              }
            }
          },
          summary: { type: "string" }
        }
      },
      model: "gemini_3_flash"
    });

    setRiskReport(result);
    setLoading(false);
    toast.success('Risk analysis complete');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const getRiskColor = (score) => {
    if (score <= 30) return 'text-emerald-400';
    if (score <= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskBg = (score) => {
    if (score <= 30) return 'bg-emerald-400';
    if (score <= 60) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Risk Analysis</h1>
          <p className="text-slate-500 text-sm mt-0.5">Portfolio risk assessment & hedging</p>
        </div>
        <Button
          onClick={generateRiskReport}
          disabled={loading || stocks.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
          {loading ? 'Analyzing...' : riskReport ? 'Refresh Analysis' : 'Run Analysis'}
        </Button>
      </div>

      {stocks.length === 0 && (
        <div className="text-center py-20 bg-slate-900/60 border border-slate-800/50 rounded-2xl">
          <Shield className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">Add stocks to your portfolio to run risk analysis</p>
        </div>
      )}

      {!riskReport && stocks.length > 0 && !loading && (
        <div className="text-center py-20 bg-slate-900/60 border border-slate-800/50 rounded-2xl">
          <Shield className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">Click "Run Analysis" to generate a risk report</p>
          <p className="text-slate-600 text-xs mt-1">AI-powered analysis of your {stocks.length} holdings</p>
        </div>
      )}

      {riskReport && (
        <>
          {/* Score cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Risk Score</p>
              <p className={`text-4xl font-bold ${getRiskColor(riskReport.risk_score)}`}>{riskReport.risk_score}</p>
              <Progress value={riskReport.risk_score} className="mt-3 h-1.5 bg-slate-800" indicatorClassName={getRiskBg(riskReport.risk_score)} />
              <p className="text-xs text-slate-500 mt-2">{riskReport.risk_score <= 30 ? 'Low Risk' : riskReport.risk_score <= 60 ? 'Moderate Risk' : 'High Risk'}</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Diversification</p>
              <p className={`text-4xl font-bold ${getRiskColor(100 - riskReport.diversification_score)}`}>{riskReport.diversification_score}</p>
              <Progress value={riskReport.diversification_score} className="mt-3 h-1.5 bg-slate-800" indicatorClassName="bg-blue-400" />
              <p className="text-xs text-slate-500 mt-2">{riskReport.diversification_score >= 70 ? 'Well Diversified' : riskReport.diversification_score >= 40 ? 'Moderate' : 'Poor'}</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Portfolio Beta</p>
              <p className="text-4xl font-bold text-white">{riskReport.portfolio_beta?.toFixed(2) || '—'}</p>
              <p className="text-xs text-slate-500 mt-5">{(riskReport.portfolio_beta || 1) > 1 ? 'More volatile than market' : 'Less volatile than market'}</p>
            </div>
          </div>

          {/* Risk factors */}
          <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" /> Risk Factors
            </h2>
            <div className="space-y-2">
              {riskReport.risk_factors?.map((risk, i) => (
                <div key={i} className="flex items-start gap-3 bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                  <span className="text-red-400 text-xs font-bold mt-0.5">{i + 1}</span>
                  <p className="text-sm text-slate-300">{risk}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Concentration risks */}
          {riskReport.concentration_risks?.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-400" /> Concentration Risks
              </h2>
              <div className="space-y-3">
                {riskReport.concentration_risks.map((cr, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800/30 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold text-sm">{cr.symbol}</span>
                      <span className="text-slate-500 text-xs">{cr.concern}</span>
                    </div>
                    <span className="text-orange-400 text-sm font-medium">{cr.weight?.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sector exposure */}
          {riskReport.sector_exposure?.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Percent className="w-4 h-4 text-blue-400" /> Sector Exposure
              </h2>
              <div className="space-y-3">
                {riskReport.sector_exposure.map((se, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">{se.sector}</span>
                      <span className="text-sm text-white font-medium">{se.percentage?.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all" style={{ width: `${Math.min(se.percentage, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hedging suggestions */}
          <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Hedging Recommendations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {riskReport.hedging_suggestions?.map((hs, i) => (
                <div key={i} className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                  <p className="text-sm font-medium text-emerald-400 mb-1">{hs.strategy}</p>
                  <p className="text-xs text-slate-400">{hs.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-3">Summary</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{riskReport.summary}</p>
          </div>
        </>
      )}
    </div>
  );
}
