export function applyTemplate(
  body: string,
  values: Record<string, string>
): string {
  return body.replace(/\{([a-zA-Z]+)\}/g, (match, key: string) => values[key] ?? match);
}
