import { useMemo } from "react";
interface GaugeChartProps {
  value: number;
  max?: number;
  size?: number;
  title: string;
  subtitle?: string;
}
export function GaugeChart({
  value,
  max = 10,
  size = 240,
  title,
  subtitle
}: GaugeChartProps) {
  const {
    color,
    percentage
  } = useMemo(() => {
    const perc = value / max * 100;
    let colorValue = "#ef4444"; // Red (0-3)

    if (value >= 7.5) {
      colorValue = "#22c55e"; // Green (7.5-10)
    } else if (value > 3) {
      colorValue = "#f59e0b"; // Yellow (3.1-7.5)
    }
    return {
      color: colorValue,
      percentage: perc
    };
  }, [value, max]);

  // Horizontal semi-circle gauge (180 degrees)
  const radius = 80;
  const centerX = size / 2;
  const centerY = size / 2;
  const strokeWidth = 16;
  
  // Calculate arc angles for filling
  const startAngle = -180; // Start from left (9 o'clock position)
  const endAngle = 0; // End at right (3 o'clock position)
  const filledAngle = startAngle + (percentage / 100) * 180;
  
  // Convert angles to coordinates
  const polarToCartesian = (angle: number) => {
    const angleInRadians = (angle * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };
  
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const filled = polarToCartesian(filledAngle);
  
  const backgroundPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
  const filledPath = percentage > 0 
    ? `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${percentage > 50 ? 1 : 0} 1 ${filled.x} ${filled.y}`
    : '';
  return <div className="flex flex-col items-center space-y-3 p-6">
      <div className="relative" style={{
      width: size,
      height: size * 0.6
    }}>
        <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>          
          {/* Background arc (gray) */}
          <path 
            d={backgroundPath}
            fill="none" 
            stroke="hsl(var(--muted))" 
            strokeWidth={strokeWidth} 
            strokeLinecap="round" 
            className="opacity-30" 
          />
          
          {/* Colored arc */}
          {filledPath && (
            <path 
              d={filledPath}
              fill="none" 
              stroke={color}
              strokeWidth={strokeWidth} 
              strokeLinecap="round" 
              className="transition-all duration-1000 ease-out" 
              style={{
                filter: `drop-shadow(0 2px 8px ${color}40)`
              }} 
            />
          )}
        </svg>
        
        {/* Center value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{
            color
          }}>
              {value.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground font-normal">pontos</div>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <h4 className="font-semibold text-sm">{title}</h4>
        {subtitle && <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>}
      </div>
    </div>;
}