export function formatCaption(text: string, hashtags: string[] = []): string {
  const tags = hashtags
    .map((t) => t.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .map((t) => `#${t}`);
  return tags.length ? `${text}\n\n${tags.join(" ")}` : text;
}
