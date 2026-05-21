const ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/** Strip Canvas HTML assignment descriptions to plain text for LLM context. */
export function stripHtml(html: string): string {
  let text = html.replace(/<[^>]+>/g, " ");
  for (const [entity, char] of Object.entries(ENTITY_MAP)) {
    text = text.split(entity).join(char);
  }
  text = text.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(Number(code))
  );
  return text.replace(/\s+/g, " ").trim();
}
