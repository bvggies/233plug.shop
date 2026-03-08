"use client";

import Image from "next/image";

export type LabelRecipient = {
  name: string;
  address: string;
  city?: string;
  country: string;
  phone?: string;
};

export type LabelItem = {
  type: "order" | "request";
  ref: string;
  description?: string;
  recipient: LabelRecipient;
};

const COMPANY = {
  name: "233Plug",
  address: "Accra, Ghana",
  phone: "Contact via 233plug.com",
};

function Barcode({ value }: { value: string }) {
  return (
    <div
      className="barcode mt-1 font-mono tracking-widest text-sm font-semibold"
      style={{ letterSpacing: "3px" }}
    >
      {value}
    </div>
  );
}

export function ShippingLabelCard({ item, trackingNumber }: { item: LabelItem; trackingNumber?: string | null }) {
  const { recipient, ref, type, description } = item;
  return (
    <div
      className="shipping-label bg-white border-2 border-gray-900 p-4 relative overflow-hidden flex flex-col"
      style={{
        width: "4in",
        height: "6in",
        minHeight: "6in",
        boxSizing: "border-box",
      }}
    >
      {/* Decorative corner */}
      <div
        className="absolute top-0 right-0 w-16 h-16 bg-primary-600 opacity-10 -translate-y-1/2 translate-x-1/2 rounded-full"
        aria-hidden
      />

      {/* Header - From / To */}
      <div className="flex justify-between gap-3 mb-3 pb-2 border-b-2 border-dashed border-gray-400 flex-shrink-0">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Sender</p>
          <div className="flex items-center gap-2 mb-0.5">
            <Image src="/logo.png" alt="" width={56} height={22} className="h-5 w-auto object-contain flex-shrink-0" unoptimized />
          </div>
          <p className="text-xs font-bold text-gray-900">{COMPANY.name}</p>
          <p className="text-[10px] text-gray-700 leading-tight">{COMPANY.address}</p>
        </div>
        <div className="text-right flex-1 min-w-0">
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Recipient</p>
          <p className="text-xs font-bold text-gray-900 truncate" title={recipient.name}>{recipient.name}</p>
          <p className="text-[10px] text-gray-700 leading-tight whitespace-pre-line break-words">{recipient.address}</p>
          {(recipient.city || recipient.country) && (
            <p className="text-[10px] text-gray-700">{[recipient.city, recipient.country].filter(Boolean).join(", ")}</p>
          )}
          {recipient.phone && <p className="text-[10px] text-gray-700 mt-0.5">Tel: {recipient.phone}</p>}
        </div>
      </div>

      {/* Reference & description */}
      <div className="mb-2 flex-shrink-0">
        <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
          {type === "order" ? "Order" : "Request"} #
        </p>
        <p className="text-base font-mono font-bold text-gray-900">{ref}</p>
        {description && <p className="text-[10px] text-gray-600 mt-0.5 line-clamp-1">{description}</p>}
      </div>

      {/* Tracking barcode */}
      {trackingNumber && (
        <div className="mb-3 py-1.5 px-2 bg-gray-50 rounded border border-gray-200 flex-shrink-0">
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Tracking</p>
          <Barcode value={trackingNumber} />
        </div>
      )}

      {/* Spacer to push footer down */}
      <div className="flex-1 min-h-2" />

      {/* Footer branding */}
      <div className="pt-2 border-t border-gray-200 text-center flex-shrink-0">
        <p className="text-xs font-bold text-primary-600">233Plug</p>
        <p className="text-[9px] text-gray-500">Premium E-Commerce · Ghana</p>
      </div>
    </div>
  );
}
