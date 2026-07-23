import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../lib/utils';

interface AnimatedNumberProps {
  value: number;
  currency?: string;
  className?: string;
  duration?: number; // Duration in ms
}

export function AnimatedNumber({ 
  value, 
  currency = 'NGN', 
  className = '', 
  duration = 800 
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Smooth easeOutExpo curve
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValue + (endValue - startValue) * easeProgress;
      
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    const animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span className={className}>
      {formatCurrency(displayValue, currency)}
    </span>
  );
}
