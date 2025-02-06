export function urlFor(page: "docs", context: string): string {
  if (page === "docs") {
    return `/docs/${context}`;
  }

  // Impossible, return home
  return "";
}
