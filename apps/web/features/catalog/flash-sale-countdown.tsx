'use client';

import { useEffect, useState } from 'react';

export function FlashSaleCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 25, seconds: 12 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (n: number) => String(n).padStart(2, '0');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-1">Kết thúc sau:</span>
      <span style={{ borderRadius: '6px' }} className="bg-slate-900 px-2 py-1 text-xs font-bold text-white tabular-nums">
        {format(timeLeft.hours)}
      </span>
      <span className="font-bold text-slate-900">:</span>
      <span style={{ borderRadius: '6px' }} className="bg-slate-900 px-2 py-1 text-xs font-bold text-white tabular-nums">
        {format(timeLeft.minutes)}
      </span>
      <span className="font-bold text-slate-900">:</span>
      <span style={{ borderRadius: '6px' }} className="bg-slate-900 px-2 py-1 text-xs font-bold text-white tabular-nums">
        {format(timeLeft.seconds)}
      </span>
    </div>
  );
}