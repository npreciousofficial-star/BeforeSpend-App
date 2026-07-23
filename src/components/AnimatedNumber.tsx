import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../lib/utils';

interface AnimatedNumberProps {
  value: number;
  currency?: string;
  duration?: number; // duration in ms
  className?: string;
  formatter?: (val: number) => string;
}

export function AnimatedNumber({
  value,
  currency,
  duration = 800,
  className = '',
  formatter
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const initialValue = displayValue;
    const targetValue = value;
    
    if (initialValue === targetValue) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Smooth easeOutQuad easing function
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const currentValue = initialValue + (targetValue - initialValue) * easeProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const formattedText = formatter
    ? formatter(displayValue)
    : currency
    ? formatCurrency(displayValue, currency)
    : displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return <span className={className}>{formattedText}</span>;
}
