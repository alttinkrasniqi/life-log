interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  width?: number;
  fill?: boolean;
  className?: string;
}

export function Sparkline({
  values,
  color = 'var(--accent)',
  height = 32,
  width = 120,
  fill = true,
  className = '',
}: SparklineProps) {
  if (values.length === 0) {
    return (
      <svg width={width} height={height} className={className}>
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--border-strong)"
          strokeDasharray="2 3"
          strokeWidth="1"
        />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  // Smooth Catmull-Rom-ish path
  const path = points
    .map((p, i, arr) => {
      if (i === 0) return `M ${p[0]} ${p[1]}`;
      const prev = arr[i - 1];
      const cx1 = prev[0] + (p[0] - prev[0]) / 2;
      return `C ${cx1} ${prev[1]}, ${cx1} ${p[1]}, ${p[0]} ${p[1]}`;
    })
    .join(' ');

  const fillPath = fill
    ? `${path} L ${width} ${height} L 0 ${height} Z`
    : '';

  const id = `spark-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width={width} height={height} className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={fillPath} fill={`url(#${id})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
