import React, { useId } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

/**
 * Small, axis-free trend chart in the style used across Google's dashboards:
 * a thin monotone line over a soft fade, with only the latest point marked.
 * No grid, no ticks, no tooltip — it reads as a glyph, not a chart.
 *
 * Shared by the AI Insights panel on the dashboard and the insights cards on
 * the public landing page so both render the same mark.
 */

export const DIRECTION_COLOR = {
  up:   '#4f46e5', // indigo-600
  down: '#dc2626', // red-600
  flat: '#64748b', // slate-500
};

/**
 * Direction is read from the series first — the actual data — and only falls
 * back to parsing the `trend` label when no series was supplied.
 */
export function readDirection(series, trend) {
  if (Array.isArray(series) && series.length > 1) {
    const delta = series[series.length - 1] - series[0];
    if (delta > 0) return 'up';
    if (delta < 0) return 'down';
    return 'flat';
  }
  if (typeof trend === 'string') {
    if (trend.trim().startsWith('+')) return 'up';
    if (trend.trim().startsWith('-')) return 'down';
  }
  return 'flat';
}

const Sparkline = ({ values, direction, className = 'h-11 w-24' }) => {
  const gradientId = useId();
  const color = DIRECTION_COLOR[direction] ?? DIRECTION_COLOR.flat;
  const data = values.map((v, i) => ({ i, v }));
  const lastIndex = data.length - 1;

  // Only the final point gets a dot, so the eye lands on "where it is now".
  const renderDot = ({ cx, cy, index }) =>
    index === lastIndex
      ? <circle key="last" cx={cx} cy={cy} r={2.5} fill={color} stroke="#fff" strokeWidth={1.5} />
      : null;

  return (
    <div className={`${className} shrink-0`} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 2, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${gradientId})`}
            dot={renderDot}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Sparkline;