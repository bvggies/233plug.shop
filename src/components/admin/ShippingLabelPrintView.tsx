"use client";

import { useRef, useEffect } from "react";
import { ShippingLabelCard, type LabelItem } from "./ShippingLabel";
type ShippingLabelPrintViewProps = {
  batch: { batch_name: string; tracking_number: string | null };
  items: LabelItem[];
  onClose?: () => void;
  autoPrint?: boolean;
};

export function ShippingLabelPrintView({ batch, items, onClose, autoPrint = true }: ShippingLabelPrintViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoPrint && items.length > 0) {
      const t = setTimeout(() => window.print(), 100);
      return () => clearTimeout(t);
    }
  }, [autoPrint, items.length]);

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No items in this batch to print labels for.</p>
        {onClose && (
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; background: white; }
          .no-print { display: none !important; }
          .shipping-label { break-inside: avoid; page-break-inside: avoid; }
        }
        @page { size: 4in 6in; margin: 0; }
      `}</style>
      <div ref={containerRef} className="print-container p-4 bg-gray-100 min-h-screen">
        <div className="no-print flex items-center justify-between mb-4 pb-4 border-b bg-white p-4 rounded-xl shadow">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{batch.batch_name} - Shipping Labels</h2>
            <p className="text-sm text-gray-500">{items.length} label(s) · 4×6 in format</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print
            </button>
            <button
              onClick={() => {
                window.print();
              }}
              className="px-4 py-2 border-2 border-primary-500 text-primary-600 rounded-xl font-medium hover:bg-primary-50 flex items-center gap-2"
              title="In the print dialog, choose 'Save as PDF' or 'Microsoft Print to PDF' as destination"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Save as PDF
            </button>
            {onClose && (
              <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
                Close
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item, i) => (
            <ShippingLabelCard
              key={`${item.type}-${item.ref}-${i}`}
              item={item}
              trackingNumber={batch.tracking_number}
            />
          ))}
        </div>
      </div>
    </>
  );
}
