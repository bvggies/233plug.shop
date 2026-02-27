"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

function getNextShipmentDate(): Date {
  const now = new Date();
  const day = now.getDay();
  const daysUntilNext = day < 3 ? 3 - day : 10 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + Math.max(daysUntilNext, 1));
  next.setHours(0, 0, 0, 0);
  return next;
}

export function CountdownTimer() {
  const [nextShipment, setNextShipment] = useState<Date>(getNextShipmentDate());
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = nextShipment.getTime() - now.getTime();
      if (diff <= 0) {
        setNextShipment(getNextShipmentDate());
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [nextShipment]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 text-sm text-gray-600"
    >
      <span className="font-medium">Next shipment:</span>
      <div className="flex gap-2">
        {[
          { label: "D", value: timeLeft.days },
          { label: "H", value: timeLeft.hours },
          { label: "M", value: timeLeft.mins },
          { label: "S", value: timeLeft.secs },
        ].map(({ label, value }) => (
          <span
            key={label}
            className="px-2 py-1 bg-primary-500/10 rounded-lg font-mono font-semibold text-primary-600"
          >
            {String(value).padStart(2, "0")}{label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
