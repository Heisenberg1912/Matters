interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

export default function ProgressRing({ value, size = 120, strokeWidth = 10 }: ProgressRingProps) {
  const normalized = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (normalized / 100) * circumference;

  return (
    <svg width={size} height={size} className="text-[var(--pill,#cfe0ad)]">
      <circle
        stroke="#1e1e1e"
        fill="transparent"
        strokeWidth={strokeWidth}
        cx={size / 2}
        cy={size / 2}
        r={radius}
      />
      <circle
        stroke="currentColor"
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
      />
    </svg>
  );
}
