"use client";

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
      className="shipping-label bg-white border-2 border-gray-900 p-5 relative overflow-hidden"
      style={{
        width: "4in",
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
      <div className="flex justify-between gap-4 mb-4 pb-3 border-b-2 border-dashed border-gray-400">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1.5">Sender</p>
          <p className="text-sm font-bold text-gray-900">{COMPANY.name}</p>
          <p className="text-[11px] text-gray-700 leading-tight">{COMPANY.address}</p>
        </div>
        <div className="text-right flex-1 min-w-0">
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1.5">Recipient</p>
          <p className="text-sm font-bold text-gray-900 truncate" title={recipient.name}>{recipient.name}</p>
          <p className="text-[11px] text-gray-700 leading-tight whitespace-pre-line">{recipient.address}</p>
          {(recipient.city || recipient.country) && (
            <p className="text-[11px] text-gray-700">{[recipient.city, recipient.country].filter(Boolean).join(", ")}</p>
          )}
          {recipient.phone && <p className="text-[11px] text-gray-700 mt-1">Tel: {recipient.phone}</p>}
        </div>
      </div>

      {/* Reference & description */}
      <div className="mb-3">
        <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
          {type === "order" ? "Order" : "Request"} #
        </p>
        <p className="text-lg font-mono font-bold text-gray-900">{ref}</p>
        {description && <p className="text-[11px] text-gray-600 mt-1 line-clamp-1">{description}</p>}
      </div>

      {/* Tracking barcode */}
      {trackingNumber && (
        <div className="mb-4 py-2 px-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Tracking</p>
          <Barcode value={trackingNumber} />
        </div>
      )}

      {/* Footer branding */}
      <div className="absolute bottom-4 left-4 right-4 pt-3 border-t border-gray-200 text-center">
        <p className="text-sm font-bold text-primary-600">233Plug</p>
        <p className="text-[10px] text-gray-500">Premium E-Commerce · Ghana</p>
      </div>
    </div>
  );
}
