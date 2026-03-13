import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const SECTORS = [
  'Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer Discretionary',
  'Consumer Staples', 'Industrials', 'Materials', 'Real Estate', 'Utilities', 'Communication Services'
];

export default function AddStockDialog({ open, onOpenChange, onStockAdded }) {
  const [form, setForm] = useState({
    symbol: '', name: '', sector: '', quantity: '', buy_price: '', buy_date: '', currency: 'INR', notes: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLookup = async () => {
    if (!form.symbol) return;
    setIsSearching(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Give me info about the Indian stock with ticker symbol "${form.symbol.toUpperCase()}" listed on NSE/BSE. I need: company name, sector, current stock price in INR (Indian Rupees), beta, PE ratio, market cap, and dividend yield.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          sector: { type: "string" },
          current_price: { type: "number" },
          beta: { type: "number" },
          pe_ratio: { type: "number" },
          market_cap: { type: "string" },
          dividend_yield: { type: "number" }
        }
      },
      model: "gemini_3_flash"
    });
    setForm(prev => ({
      ...prev,
      name: result.name || prev.name,
      sector: result.sector || prev.sector,
      buy_price: prev.buy_price || String(result.current_price || ''),
    }));
    setIsSearching(false);
  };

  const handleSave = async () => {
    if (!form.symbol || !form.name || !form.quantity || !form.buy_price) {
      toast.error('Please fill in required fields');
      return;
    }
    setIsSaving(true);
    await base44.entities.Stock.create({
      symbol: form.symbol.toUpperCase(),
      name: form.name,
      sector: form.sector,
      quantity: parseFloat(form.quantity),
      buy_price: parseFloat(form.buy_price),
      current_price: parseFloat(form.buy_price),
      buy_date: form.buy_date || undefined,
      currency: 'INR',
      notes: form.notes
    });
    toast.success(`${form.symbol.toUpperCase()} added to portfolio`);
    setForm({ symbol: '', name: '', sector: '', quantity: '', buy_price: '', buy_date: '', currency: 'INR', notes: '' });
    setIsSaving(false);
    onOpenChange(false);
    onStockAdded();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-slate-400 text-xs">Ticker Symbol *</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="e.g. RELIANCE, TCS, INFY"
                value={form.symbol}
                onChange={e => setForm({ ...form, symbol: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Button variant="outline" size="icon" onClick={handleLookup} disabled={isSearching} className="border-slate-700 hover:bg-slate-800">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-slate-400 text-xs">Company Name *</Label>
            <Input placeholder="e.g. Reliance Industries Ltd." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs">Quantity *</Label>
              <Input type="number" placeholder="100" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Buy Price *</Label>
              <Input type="number" step="0.01" placeholder="2500.00" value={form.buy_price} onChange={e => setForm({ ...form, buy_price: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs">Sector</Label>
              <Select value={form.sector} onValueChange={v => setForm({ ...form, sector: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {SECTORS.map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Buy Date</Label>
              <Input type="date" value={form.buy_date} onChange={e => setForm({ ...form, buy_date: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-slate-400 text-xs">Exchange</Label>
            <Select defaultValue="NSE">
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="NSE" className="text-white">NSE</SelectItem>
                <SelectItem value="BSE" className="text-white">BSE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Add to Portfolio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
