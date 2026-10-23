export const extraMetrics = [
  { type: 'HKQuantityTypeIdentifierRunningPower', unit: 'W', label: 'Potência' },
  { type: 'HKQuantityTypeIdentifierRunningStrideLength', unit: 'm', label: 'Comprimento da passada' },
  { type: 'HKQuantityTypeIdentifierRunningGroundContactTime', unit: 'ms', label: 'Contato com o solo' },
  { type: 'HKQuantityTypeIdentifierRunningVerticalOscillation', unit: 'cm', label: 'Oscilação vertical' },
  { type: 'HKQuantityTypeIdentifierActiveEnergyBurned', unit: 'kcal', label: 'Energia ativa' },
  { type: 'HKQuantityTypeIdentifierHeartRate', unit: 'count/min', label: 'Frequência cardíaca' },
] as const;

export function sampleMean(rows: readonly { id: string; start: number; end: number; amount: number }[], start: number, end: number): number | undefined {
  const seen = new Set<string>();
  const values = rows.filter(row => {
    if (row.start >= end || (row.end === row.start ? row.start < start : row.end <= start) || seen.has(row.id)) return false;
    seen.add(row.id); return true;
  });
  return values.length ? values.reduce((sum, row) => sum + row.amount, 0) / values.length : undefined;
}
