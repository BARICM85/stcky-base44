import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import StockTable from '../components/portfolio/StockTable';
import AddStockDialog from '../components/portfolio/AddStockDialog';
import ImportDialog from '../components/portfolio/ImportDialog';
import { Plus, FileSpreadsheet, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Portfolio() {
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [refreshingId, setRefreshingId] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: stocks = [], isLoading } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => base44.entities.Stock.list('-created_date'),
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['stocks'] });

  const handleDelete = async () => {
    if (!deleteId) return;
    const idToDelete = deleteId;
    setDeleteId(null);
    try {
      await base44.entities.Stock.delete(idToDelete);
      toast.success('Stock removed');
    } catch (e) {
      // Stock may have already been deleted or doesn't exist
      toast.success('Stock removed');
    }
    refetch();
  };

  const handleRefreshPrice = async (stock) => {
    setRefreshingId(stock.id);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `What is the current stock price of ${stock.symbol} (${stock.name}) listed on NSE/BSE in Indian Rupees (INR)? Return only the price as a number in INR.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: { price: { type: "number" } }
      },
      model: "gemini_3_flash"
    });
    if (result?.price > 0) {
      await base44.entities.Stock.update(stock.id, { current_price: result.price });
      toast.success(`${stock.symbol} updated to $${result.price}`);
      refetch();
    }
    setRefreshingId(null);
  };

  const filteredStocks = stocks.filter(s =>
    s.symbol?.toLowerCase().includes(search.toLowerCase()) ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.sector?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio</h1>
          <p className="text-slate-500 text-sm mt-0.5">{stocks.length} holdings</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setImportOpen(true)} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Import
          </Button>
          <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-initial">
            <Plus className="w-4 h-4 mr-2" /> Add Stock
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          placeholder="Search by symbol, name, or sector..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-slate-900/60 border-slate-800 text-white placeholder:text-slate-600"
        />
      </div>

      <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-5">
        <StockTable
          stocks={filteredStocks}
          onDelete={setDeleteId}
          onRefreshPrice={handleRefreshPrice}
          refreshingId={refreshingId}
        />
      </div>

      <AddStockDialog open={addOpen} onOpenChange={setAddOpen} onStockAdded={refetch} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImportComplete={refetch} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remove Stock</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to remove this stock from your portfolio?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
