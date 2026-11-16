/*
 * Themed, lazy-loaded Plotly charts (SRS mandates Plotly for visualisation). The fixed brand
 * palette (§4.1) is applied here; charts are responsive and keep the modebar hidden for a clean
 * read. Plotly itself is code-split via React.lazy so it never weighs down the initial bundle.
 */
import { Suspense, lazy } from 'react';
import type { TrendPoint } from '@/types/domain';

const Plot = lazy(() => import('./PlotlyLazy'));

// Fixed palette (CON-11 / §4.1) — Plotly needs concrete colours, not CSS variables.
const TEAL = '#1f7a6e';
const TEAL_SOFT = '#4da89b';
const GRID = '#e3edea';
const TEXT = '#1b2b28';

const BASE_LAYOUT = {
  font: { family: 'inherit', color: TEXT, size: 12 },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  margin: { l: 48, r: 16, t: 12, b: 40 },
  showlegend: false,
  autosize: true,
} as const;

const CONFIG = { displayModeBar: false, responsive: true } as const;

function ChartFallback({ height }: { height: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ height, display: 'grid', placeItems: 'center', color: 'var(--color-muted)' }}
    >
      <div className="spinner" aria-hidden="true" />
    </div>
  );
}

/** Monthly (or periodic) trend as a filled line. */
export function TrendChart({ points, height = 260, label = 'Records' }: { points: TrendPoint[]; height?: number; label?: string }) {
  return (
    <Suspense fallback={<ChartFallback height={height} />}>
      <Plot
        data={[
          {
            type: 'scatter',
            mode: 'lines+markers',
            x: points.map((p) => p.period),
            y: points.map((p) => p.count),
            line: { color: TEAL, width: 2.5, shape: 'spline' },
            marker: { color: TEAL, size: 6 },
            fill: 'tozeroy',
            fillcolor: 'rgba(31,122,110,0.10)',
            hovertemplate: `%{x}<br>${label}: %{y}<extra></extra>`,
          },
        ]}
        layout={{
          ...BASE_LAYOUT,
          height,
          xaxis: { gridcolor: GRID, zeroline: false, tickangle: -30 },
          yaxis: { gridcolor: GRID, zeroline: false, rangemode: 'tozero' },
        }}
        config={CONFIG}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </Suspense>
  );
}

export interface BarDatum {
  label: string;
  value: number;
  highlight?: boolean;
}

/** Horizontal category bars — good for ranked category counts. */
export function CategoryBarChart({ data, height = 280, unitLabel = 'Records' }: { data: BarDatum[]; height?: number; unitLabel?: string }) {
  // Plotly draws the first item at the bottom; reverse so the largest sits on top.
  const ordered = [...data].reverse();
  return (
    <Suspense fallback={<ChartFallback height={height} />}>
      <Plot
        data={[
          {
            type: 'bar',
            orientation: 'h',
            x: ordered.map((d) => d.value),
            y: ordered.map((d) => d.label),
            marker: { color: ordered.map((d) => (d.highlight ? TEAL_SOFT : TEAL)) },
            hovertemplate: `%{y}<br>${unitLabel}: %{x}<extra></extra>`,
          },
        ]}
        layout={{
          ...BASE_LAYOUT,
          height,
          margin: { l: 140, r: 16, t: 12, b: 32 },
          xaxis: { gridcolor: GRID, zeroline: false, rangemode: 'tozero' },
          yaxis: { automargin: true },
          bargap: 0.35,
        }}
        config={CONFIG}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </Suspense>
  );
}
