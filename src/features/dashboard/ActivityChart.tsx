import type { ActivityWeek } from './selectors';

interface ActivityChartProps {
  weeks: ActivityWeek[];
}

const BAR_W = 18;
const GAP = 10;
const PLOT_H = 120;
const PAD_LEFT = 8;

/**
 * Deterministic SVG activity chart: weekly scan bars with finding markers.
 * Pure SVG, no chart library. Includes text equivalents for screen readers.
 */
export function ActivityChart({ weeks }: ActivityChartProps) {
  if (weeks.length === 0) {
    return <p className="hc-empty">No scan activity in the seeded sample window yet.</p>;
  }
  const max = Math.max(1, ...weeks.map((w) => w.scans));
  const width = PAD_LEFT * 2 + weeks.length * BAR_W + (weeks.length - 1) * GAP;
  const height = PLOT_H + 34;
  const totalScans = weeks.reduce((n, w) => n + w.scans, 0);
  const totalOpened = weeks.reduce((n, w) => n + w.findingsOpened, 0);

  return (
    <figure className="hc-chart" aria-label={`Scan activity chart: ${totalScans} scans, ${totalOpened} findings opened over ${weeks.length} weeks`}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" className="hc-chart-svg">
        <title>
          {`Weekly scans over ${weeks.length} weeks, total ${totalScans} scans and ${totalOpened} findings opened.`}
        </title>
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PLOT_H - frac * (PLOT_H - 12);
          return (
            <line
              key={frac}
              x1={PAD_LEFT}
              x2={width - PAD_LEFT}
              y1={y}
              y2={y}
              className="hc-gridline"
            />
          );
        })}
        {weeks.map((w, i) => {
          const x = PAD_LEFT + i * (BAR_W + GAP);
          const barH = Math.max(w.scans === 0 ? 2 : 5, Math.round((w.scans / max) * (PLOT_H - 12)));
          const y = PLOT_H - barH;
          const dotY = Math.max(
            6,
            PLOT_H - Math.round((Math.min(w.findingsOpened, max) / max) * (PLOT_H - 12)) - 8,
          );
          return (
            <g key={w.weekStartIso}>
              <title>{`${w.label}: ${w.scans} scans, ${w.findingsOpened} findings opened`}</title>
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={barH}
                rx={3}
                className={w.scans === 0 ? 'hc-bar hc-bar-idle' : 'hc-bar'}
              />
              {w.findingsOpened > 0 && (
                <circle cx={x + BAR_W / 2} cy={dotY} r={4} className="hc-dot" />
              )}
              {(i === 0 || i === weeks.length - 1 || i % 4 === 3) && (
                <text x={x} y={height - 8} className="hc-axis">
                  {w.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="hc-legend">
        <span className="hc-legend-item">
          <span className="hc-swatch hc-swatch-bar" aria-hidden="true" /> Scans per week
        </span>
        <span className="hc-legend-item">
          <span className="hc-swatch hc-swatch-dot" aria-hidden="true" /> Findings opened
        </span>
      </figcaption>
    </figure>
  );
}
