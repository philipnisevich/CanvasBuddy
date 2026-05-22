function findNonLatin1Char(value: string): { index: number; code: number } | null {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > 255) {
      return { index: i, code };
    }
  }
  return null;
}

function looksLikePlaceholder(value: string): boolean {
  return value.includes("<") || /\bfrom\s/i.test(value);
}

/** HTTP headers require Latin-1; Unicode in API key env values causes fetch to throw. */
export function getAsciiEnvVarError(name: string, value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const bad = findNonLatin1Char(value);
  if (!bad) {
    return null;
  }

  const hint = looksLikePlaceholder(value)
    ? " It looks like placeholder text was pasted instead of the real secret."
    : "";

  return `${name} contains an invalid character for API credentials (not plain ASCII). Copy the value again from your dashboard without decorative symbols.${hint}`;
}
