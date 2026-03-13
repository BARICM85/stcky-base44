import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ImportDialog({ open, onOpenChange, onImportComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          stocks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                name: { type: "string" },
                sector: { type: "string" },
                quantity: { type: "number" },
                buy_price: { type: "number" },
                buy_date: { type: "string" },
                currency: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Support both { stocks: [...] } and flat array output
    const rawStocks = extracted.output?.stocks || (Array.isArray(extracted.output) ? extracted.output : []);

    if (extracted.status === 'success' && rawStocks.length > 0) {
      const stocksData = rawStocks.map(s => ({
        ...s,
        symbol: (s.symbol || '').toUpperCase(),
        current_price: s.current_price || s.buy_price,
        currency: 'INR'
      }));

      await base44.entities.Stock.bulkCreate(stocksData);
      setResult({ success: true, count: stocksData.length });
      toast.success(`Imported ${stocksData.length} stocks`);
      onImportComplete();
    } else if (extracted.status === 'success') {
      setResult({ success: false, error: 'No stock data found in the file. Check column names.' });
      toast.error('No stocks found in file');
    } else {
      setResult({ success: false, error: extracted.details || 'Could not extract stock data' });
      toast.error('Import failed');
    }
    setIsUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Import from Excel/CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-dashed border-slate-700">
            <div className="text-center">
              <FileSpreadsheet className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-slate-300 mb-1">Upload your portfolio spreadsheet</p>
              <p className="text-xs text-slate-500 mb-4">Supports .xlsx, .csv, .json files</p>
              <p className="text-xs text-slate-500 mb-4">Expected columns: Symbol, Name, Sector, Quantity, Buy Price, Buy Date, Currency</p>
              <input ref={fileRef} type="file" accept=".xlsx,.csv,.json" onChange={handleFileSelect} className="hidden" />
              <Button onClick={() => fileRef.current?.click()} disabled={isUploading} className="bg-emerald-600 hover:bg-emerald-700">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                {isUploading ? 'Processing...' : 'Select File'}
              </Button>
            </div>
          </div>

          {result && (
            <div className={`rounded-xl p-4 flex items-center gap-3 ${result.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              {result.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-emerald-300">Successfully imported {result.count} stocks</p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{result.error}</p>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
