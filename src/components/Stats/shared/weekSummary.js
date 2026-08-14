export function lstSummarize(lst) {
  if (lst.length === 0) {
    return undefined;
  }
  // drop the most recent (usually partial) week
  let newLst = lst.slice(0, -1);
  // now just keep the most recent 52 weeks
  if (newLst.length > 52) {
    newLst = newLst.slice(-52);
  }
  const sorted = [...newLst].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / sorted.length;
  let median;
  if (sorted.length % 2 === 0) {
    const idx1 = Math.floor(sorted.length / 2);
    const idx2 = idx1 - 1;
    median = (sorted[idx1] + sorted[idx2]) / 2;
  } else {
    median = sorted[Math.floor(sorted.length / 2)];
  }
  const qWidth = Math.floor(sorted.length / 4);
  const q1 = sorted[qWidth];
  const q3 = sorted[qWidth * 3];
  return { avg, median, q1, q3 };
}

export function weekHistogramChart(values) {
  if (values.length === 0) {
    return { x: [], y: [] };
  }
  const start = values.findIndex((n) => n > 0);
  const from = start === -1 ? 0 : start;
  const y = values.slice(from);
  const x = y.map((_, i) => from + i);
  return { x, y };
}

export function firstTimersCumulative(firstTimers) {
  const reversed = [...firstTimers].reverse();
  const lst = [];
  for (let i = 0; i < reversed.length; i++) {
    const subset = reversed.slice(0, i + 1);
    const sum = subset.reduce((prev, curr) => prev + curr, 0);
    lst.push(sum);
  }
  return lst;
}

export function combinedTimeoutAbandonRates(timeouts, abandoned) {
  const timeoutSeries = [...timeouts].reverse();
  const abandonedSeries =
    abandoned !== undefined
      ? [...abandoned].reverse()
      : timeoutSeries.map(() => 0);
  return timeoutSeries.map((rate, i) => rate + (abandonedSeries[i] ?? 0));
}

export function hoursPerTrendSeries(byWeek) {
  if (!Array.isArray(byWeek) || byWeek.length === 0) {
    return [];
  }
  let trend = byWeek.slice(0, -1);
  if (trend.length > 52) {
    trend = trend.slice(-52);
  }
  return trend;
}
