const BarChart = ({
  data,
  height = 160,
  barColor = 'from-orange-400 to-amber-300',
  showValues = false,
  className = '',
}) => {
  const maxValue = Math.max(...data.map((d) => typeof d.value !== 'undefined' ? d.value : d.orders || d));

  return (
    <div className={`flex items-end gap-2 ${className}`} style={{ height }}>
      {data.map((item, index) => {
        const value = typeof item.value !== 'undefined' ? item.value : item.orders || item;
        const label = item.day || item.month || item.label || '';
        const heightPercent = (value / maxValue) * 100;

        return (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative flex w-full flex-1 items-end">
              <div
                className={`w-full rounded-t-lg bg-gradient-to-t ${barColor} transition-all duration-500 hover:opacity-80`}
                style={{ height: `${heightPercent}%` }}
              >
                {showValues && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-600">
                    {value}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        );
      })}
    </div>
  );
};

const LineChart = ({
  data,
  height = 160,
  lineColor = '#f97316',
  fillColor = 'rgba(249, 115, 22, 0.1)',
  showDots = true,
  className = '',
}) => {
  const maxValue = Math.max(...data.map((d) => d.value || d));
  const points = data.map((d, i) => ({
    x: data.length === 1 ? 0 : (i / (data.length - 1)) * 100,
    y: 100 - ((d.value || d) / maxValue) * 100,
  }));

  const pathD = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}%`
  ).join(' ');

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <svg className="w-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height: '100%' }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={fillColor} stopOpacity="1" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${pathD} L 100% 100% L 0% 100% Z`} fill="url(#lineGradient)" />
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
        {showDots && points.map((p, i) => (
          <circle
            key={i}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r="1"
            fill={lineColor}
          />
        ))}
      </svg>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  delta,
  trend = 'up',
  icon,
  className = '',
}) => {
  const isPositive = trend === 'up';

  return (
    <div className={`rounded-xl border border-slate-200/60 bg-white/60 p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          {delta && (
            <p className={`mt-1 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? 'Up' : 'Down'} {delta}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

const DonutChart = ({
  data,
  size = 120,
  strokeWidth = 20,
  className = '',
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const segments = data.reduce((acc, item) => {
    const percent = (item.value / total) * 100;
    acc.items.push({ ...item, percent, offset: acc.offset });
    acc.offset += percent;
    return acc;
  }, { items: [], offset: 0 }).items;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox="0 0 36 36">
        {segments.map((item, index) => (
          <circle
            key={index}
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke={item.color}
            strokeWidth={strokeWidth / (size / 60)}
            strokeDasharray={`${item.percent} ${100 - item.percent}`}
            strokeDashoffset={-item.offset}
            transform="rotate(-90 18 18)"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold text-slate-900">{total}</span>
        <span className="text-xs text-slate-500">Total</span>
      </div>
    </div>
  );
};

export { BarChart, LineChart, StatCard, DonutChart };
