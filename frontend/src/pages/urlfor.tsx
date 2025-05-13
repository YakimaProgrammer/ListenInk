export function urlFor(page: "docs" | "login", context?: string): string {
  if (page === "docs") {
    return `/docs/${context}`;
  }

  if (page === "login") {
    return "/login";
  }

  // Impossible, return home
  return "";
}
