import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Plus, Trash2, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function WatchlistPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ symbol: '', name: '', target_price: '', notes: '' });
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => base44.entities.Watchlist.list('-created_date'),
  });

  const handleLookup = async () => {
    if (!form.symbol) return;
    setIsSearching(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `What is the company name and current stock price in INR for Indian stock ticker "${form.symbol.toUpperCase()}" listed on NSE/BSE?`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: { name: { type: "string" }, price: { type: "number" } }
      },
      model: "gemini_3_flash"
    });
    setForm(prev => ({ ...prev, name: result.name || prev.name, target_price: prev.target_price || String(result.price || '') }));
    setIsSearching(false);
  };

  const handleSave = async () => {
    if (!form.symbol || !form.name) { toast.error('Symbol and name required'); return; }
    setIsSaving(true);
    await base44.entities.Watchlist.create({
      symbol: form.symbol.toUpperCase(),
      name: form.name,
      target_price: form.target_price ? parseFloat(form.target_price) : undefined,
      notes: form.notes
    });
    toast.success(`${form.symbol.toUpperCase()} added to watchlist`);
    setForm({ symbol: '', name: '', target_price: '', notes: '' });
    setAddOpen(false);
    setIsSaving(false);
    queryClient.invalidateQueries({ queryKey: ['watchlist'] });
  };

  const handleDelete = async (id) => {
    await base44.entities.Watchlist.delete(id);
    toast.success('Removed from watchlist');
    queryClient.invalidateQueries({ queryKey: ['watchlist'] });
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
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <p className="text-slate-500 text-sm mt-0.5">{items.length} stocks tracked</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/60 border border-slate-800/50 rounded-2xl">
          <Eye className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">Your watchlist is empty</p>
          <p className="text-slate-600 text-xs mt-1">Add stocks you want to track</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5 group hover:border-emerald-500/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-400">{item.symbol?.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{item.symbol}</p>
                    <p className="text-slate-500 text-xs">{item.name}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(item.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {item.target_price && (
                <div className="mt-3 pt-3 border-t border-slate-800/50">
                  <p className="text-xs text-slate-500">Target Price</p>
                  <p className="text-lg font-bold text-white">${item.target_price.toFixed(2)}</p>
                </div>
              )}
              {item.notes && <p className="text-xs text-slate-500 mt-2">{item.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Watchlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-400 text-xs">Ticker Symbol</Label>
              <div className="flex gap-2 mt-1">
                <Input placeholder="e.g. TSLA" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
                <Button variant="outline" size="icon" onClick={handleLookup} disabled={isSearching} className="border-slate-700 hover:bg-slate-800">
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Company Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Target Price</Label>
              <Input type="number" step="0.01" value={form.target_price} onChange={e => setForm({ ...form, target_price: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" />
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Add to Watchlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
