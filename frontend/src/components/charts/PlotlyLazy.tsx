/*
 * Heavy module, loaded only when a chart actually renders (via React.lazy in Chart.tsx).
 * Uses the prebuilt plotly.js-dist-min bundle through react-plotly.js's factory, so we avoid
 * pulling plotly.js's full source build into the graph.
 */
// @ts-expect-error — plotly.js-dist-min ships no type declarations; it's a valid Plotly module.
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);
export default Plot;
