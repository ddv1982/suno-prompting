import { cn } from "@/lib/utils";

import type { ReactElement } from "react";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  showTicks?: boolean;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className,
  "aria-label": ariaLabel,
  showTicks = false,
}: SliderProps): ReactElement {
  const currentValue = value[0] ?? min;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = Number(e.target.value);
    onValueChange([newValue]);
  };

  const tickCount = showTicks ? Math.floor((max - min) / step) + 1 : 0;

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
      {/* Track background */}
      <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-foreground/10">
        {/* Track fill */}
        <div
          className="absolute h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Tick marks for discrete steps */}
      {showTicks && tickCount > 0 && (
        <div className="absolute w-full flex justify-between px-[2px] pointer-events-none" aria-hidden="true">
          {Array.from({ length: tickCount }, (_, i) => (
            <div
              key={i}
              className="w-0.5 h-2 bg-foreground/20 rounded-full"
            />
          ))}
        </div>
      )}
      
      {/* Native range input for accessibility and interaction */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "absolute w-full h-6 cursor-pointer appearance-none bg-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Webkit (Chrome, Safari, Edge)
          "[&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
          "[&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:border-0",
          "[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150",
          "[&::-webkit-slider-thumb]:hover:scale-110",
          "[&::-webkit-slider-thumb]:focus:outline-none",
          "[&::-webkit-slider-thumb]:active:scale-95",
          // Firefox
          "[&::-moz-range-thumb]:appearance-none",
          "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4",
          "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary",
          "[&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:border-0",
          "[&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:duration-150",
          "[&::-moz-range-thumb]:hover:scale-110",
          "[&::-moz-range-thumb]:active:scale-95",
          "[&::-moz-range-track]:bg-transparent",
          // Focus ring
          "focus-visible:outline-none",
          "[&::-webkit-slider-thumb]:focus-visible:ring-[3px]",
          "[&::-webkit-slider-thumb]:focus-visible:ring-ring/50",
          "[&::-webkit-slider-thumb]:focus-visible:ring-offset-2",
          "[&::-webkit-slider-thumb]:focus-visible:ring-offset-background"
        )}
      />
    </div>
  );
}
