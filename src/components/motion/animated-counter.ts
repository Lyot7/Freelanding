export interface CounterDefinition {
  end: number;
  suffix: string;
  precision: 0 | 1;
  increment: 1 | 0.1;
}

export function parseCounterValue(
  value: string,
  explicitSuffix?: string,
): CounterDefinition {
  const normalized = value.trim();
  const numericSource =
    explicitSuffix && normalized.endsWith(explicitSuffix)
      ? normalized.slice(0, -explicitSuffix.length)
      : normalized;
  const match = numericSource.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(.*)$/);

  if (!match) {
    throw new Error(`AnimatedCounter requires a numeric value, received "${value}"`);
  }

  const numericText = match[1];
  const precision = numericText.includes(".") ? 1 : 0;

  return {
    end: Number(numericText),
    suffix: explicitSuffix ?? match[2],
    precision,
    increment: precision === 1 ? 0.1 : 1,
  };
}

export function nextCounterValue(
  current: number,
  end: number,
  increment: number,
  precision: number,
): number {
  return Math.min(end, Number((current + increment).toFixed(precision)));
}

export function formatCounterValue(value: number, precision: number): string {
  return value.toFixed(precision);
}
