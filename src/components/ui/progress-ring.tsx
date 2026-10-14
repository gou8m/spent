export function ProgressRing({
  percent,
  size,
  trackColor = "#fff",
  fillColor = "currentColor",
  strokeWidth,
  className,
  children,
}: {
  percent: number;
  size: number;
  trackColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const stroke = strokeWidth ?? Math.round(size * 0.115);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const center = size / 2;

  return (
    <div className={`relative shrink-0 ${className ?? ""}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(clamped)} percent`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * circumference} ${circumference}`}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>}
    </div>
  );
}
