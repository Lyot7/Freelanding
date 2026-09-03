export function toggleFaqItem(
  openItems: ReadonlySet<number>,
  index: number,
): Set<number> {
  const next = new Set(openItems);

  if (next.has(index)) {
    next.delete(index);
  } else {
    next.add(index);
  }

  return next;
}
