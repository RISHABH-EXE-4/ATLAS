import React, { useEffect, useState } from 'react';

/**
 * Custom hook to smoothly animate a numeric counter from 0 (or previous value) to target
 */
export function useAnimatedNumber(target: number, duration: number = 750): number {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setDisplayValue(0);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;
    const startValue = 0;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out cubic: 1 - (1 - t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration]);

  return displayValue;
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatter?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 750,
  formatter,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const animatedVal = useAnimatedNumber(value, duration);
  const formatted = formatter ? formatter(animatedVal) : animatedVal.toLocaleString();

  return (
    <span className={`inline-block tabular-nums transition-transform ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
