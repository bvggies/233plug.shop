"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { Printer, Download, Truck } from "lucide-react";
import { toast } from "sonner";

export type ReceiptOrderItem = {
  id: string;
  quantity: number;
  price: number;
  product?: { name: string } | null;
};

export type ReceiptPayment = {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string | null;
  status: string;
  created_at: string;
};

export type OrderReceiptProps = {
  order: {
    id: string;
    status: string;
    total_price: number;
    currency: string;
    discount_amount?: number | null;
    created_at: string;
    tracking_code?: string | null;
  };
  items: ReceiptOrderItem[];
  payment: ReceiptPayment | null;
  customer?: { name: string | null; email: string } | null;
  companyName?: string;
  showPrintButton?: boolean;
};

const paymentMethodLabel: Record<string, string> = {
  paystack: "Paystack",
  stripe: "Stripe",
  wallet: "Wallet",
};

export function OrderReceipt({
  order,
  items,
  payment,
  customer,
  companyName = "233Plug",
  showPrintButton = true,
}: OrderReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = order.discount_amount ?? 0;
  const total = order.total_price;

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      if (imgH > pageH - margin * 2) {
        pdf.addImage(imgData, "PNG", margin, margin, imgW, pageH - margin * 2);
      } else {
        pdf.addImage(imgData, "PNG", margin, margin, imgW, imgH);
      }
      pdf.save(`receipt-${order.id.slice(0, 8).toUpperCase()}.pdf`);
      toast.success("Receipt downloaded");
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${order.id.slice(0, 8).toUpperCase()}</title>
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'DM Sans', system-ui, sans-serif; font-size: 14px; line-height: 1.5; color: #1a1a1a; padding: 24px; max-width: 400px; margin: 0 auto; }
            .receipt { border: 1px solid #e5e5e5; border-radius: 12px; overflow: hidden; }
            .head { text-align: center; padding: 24px 20px; border-bottom: 2px dashed #e5e5e5; }
            .company { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px; }
            .receipt-id { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #737373; }
            .meta { padding: 16px 20px; border-bottom: 1px solid #f0f0f0; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
            .items { padding: 16px 20px; border-bottom: 2px dashed #e5e5e5; }
            .item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
            .totals { padding: 16px 20px; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .totals-row.total { font-size: 16px; font-weight: 700; margin-top: 12px; padding-top: 12px; border-top: 2px solid #1a1a1a; }
            .payment { padding: 16px 20px; background: #fafafa; font-size: 12px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #737373; border-top: 2px dashed #e5e5e5; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="receipt-wrapper">
      {showPrintButton && (
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-[var(--surface-border)] bg-white dark:bg-[var(--surface-bg)] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors font-medium text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Preparing…" : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-[var(--surface-border)] bg-white dark:bg-[var(--surface-bg)] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors font-medium text-sm"
          >
            <Printer className="w-4 h-4" />
            Print receipt
          </button>
        </div>
      )}
      <div
        ref={printRef}
        className="receipt bg-white dark:bg-[var(--surface-bg)] border border-neutral-200 dark:border-[var(--surface-border)] rounded-2xl overflow-hidden shadow-sm max-w-md mx-auto"
      >
        <div className="receipt-head text-center py-8 px-6 border-b-2 border-dashed border-neutral-200 dark:border-[var(--surface-border)]">
          <p className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {companyName}
          </p>
          <p className="text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mt-1">
            Receipt
          </p>
          <p className="text-sm font-mono font-semibold text-primary-600 dark:text-primary-400 mt-2">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        <div className="receipt-meta px-6 py-4 border-b border-neutral-100 dark:border-[var(--surface-border)] space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Date</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {formatDateTime(order.created_at)}
            </span>
          </div>
          {customer && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Customer</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100 text-right max-w-[60%]">
                  {customer.name || customer.email}
                </span>
              </div>
              {customer.name && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Email</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100 text-right max-w-[60%] truncate">
                    {customer.email}
                  </span>
                </div>
              )}
            </>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Status</span>
            <span className="font-medium capitalize text-neutral-900 dark:text-neutral-100">
              {order.status}
            </span>
          </div>
          {order.tracking_code && (
            <div className="flex justify-between text-sm items-center gap-2 pt-1.5">
              <span className="text-neutral-500 dark:text-neutral-400">Tracking code</span>
              <Link
                href={`/track?code=${encodeURIComponent(order.tracking_code)}`}
                className="font-mono font-semibold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
              >
                {order.tracking_code}
                <Truck className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        <div className="receipt-items px-6 py-4 border-b-2 border-dashed border-neutral-200 dark:border-[var(--surface-border)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
            Items
          </p>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 text-sm">
                <span className="flex-1 text-neutral-800 dark:text-neutral-200">
                  {(item as ReceiptOrderItem & { product?: { name: string } }).product?.name ?? "Item"} × {item.quantity}
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100 shrink-0">
                  {formatPrice(item.price * item.quantity, order.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="receipt-totals px-6 py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Subtotal</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {formatPrice(subtotal, order.currency)}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-primary-600 dark:text-primary-400">
              <span>Discount</span>
              <span className="font-medium">-{formatPrice(discount, order.currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-3 mt-2 border-t-2 border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100">
            <span>Total</span>
            <span>{formatPrice(total, order.currency)}</span>
          </div>
        </div>

        {payment && (
          <div className="receipt-payment px-6 py-4 bg-neutral-50 dark:bg-white/5 border-t border-neutral-100 dark:border-[var(--surface-border)] space-y-1 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              Payment
            </p>
            <p className="text-neutral-700 dark:text-neutral-300">
              {paymentMethodLabel[payment.payment_method] ?? payment.payment_method} · {formatPrice(payment.amount, payment.currency)}
            </p>
            {payment.transaction_id && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                Ref: {payment.transaction_id}
              </p>
            )}
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatDateTime(payment.created_at)}
            </p>
          </div>
        )}

        <div className="receipt-footer text-center py-6 px-6 border-t-2 border-dashed border-neutral-200 dark:border-[var(--surface-border)]">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Thank you for your order
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Keep this receipt for your records
          </p>
        </div>
      </div>
    </div>
  );
}
