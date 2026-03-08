"use client";

import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import {
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
} from "lucide-react";
import type { ShipmentBatch, ShipmentTrackingEvent } from "@/types";

const EVENT_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  created: { label: "Batch created", icon: Package, color: "text-neutral-500 bg-neutral-100 dark:bg-neutral-700" },
  processing: { label: "Processing", icon: Package, color: "text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400" },
  dispatched: { label: "Dispatched", icon: Truck, color: "text-blue-700 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400" },
  in_transit: { label: "In transit", icon: Truck, color: "text-indigo-700 bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-400" },
  out_for_delivery: { label: "Out for delivery", icon: MapPin, color: "text-purple-700 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-400" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400" },
  custom: { label: "Update", icon: MessageSquare, color: "text-primary-700 bg-primary-100 dark:bg-primary-900/40 dark:text-primary-400" },
};

interface TrackingTimelineProps {
  batch: ShipmentBatch;
  events: ShipmentTrackingEvent[];
  showBatchInfo?: boolean;
}

export function TrackingTimeline({ batch, events, showBatchInfo = true }: TrackingTimelineProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      {showBatchInfo && (
        <div className="rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-200/80 dark:border-[var(--surface-border)] p-4 space-y-2">
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{batch.batch_name}</p>
          {batch.tracking_number && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">Tracking:</span>{" "}
              <span className="font-mono">{batch.tracking_number}</span>
            </p>
          )}
          {batch.estimated_delivery && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Estimated delivery: {formatDate(batch.estimated_delivery)}
            </p>
          )}
        </div>
      )}

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-200 dark:bg-[var(--surface-border)]" />
        <ul className="space-y-0">
          {sortedEvents.length === 0 ? (
            <li className="relative pl-12 pb-2">
              <div className="absolute left-0 flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-[var(--surface-border)]">
                <Circle className="w-4 h-4 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">No tracking updates yet.</p>
            </li>
          ) : (
            sortedEvents.map((event, i) => {
              const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.custom;
              const Icon = config.icon;
              const isLast = i === sortedEvents.length - 1;
              return (
                <motion.li
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative pl-12 ${!isLast ? "pb-6" : ""}`}
                >
                  <div
                    className={`absolute left-0 flex items-center justify-center w-8 h-8 rounded-full border-2 ${config.color} border-current/20`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="pt-0.5">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                      {config.label}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {formatDate(event.created_at)}
                    </p>
                    {event.message && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                        {event.message}
                      </p>
                    )}
                  </div>
                </motion.li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
