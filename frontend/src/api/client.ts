// frontend/src/api/client.ts

// Get the API base URL based on environment
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "/api/v1" // In production, use relative path (handled by server)
    : "http://localhost:8080/api/v1"; // In development, target directly

/**
 * Wrapper around fetch that always uses the correct API base URL
 */
export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Ensure endpoint starts with a slash if it doesn't already
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  // Create full URL
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  // Set default headers and credentials
  const defaultOptions: RequestInit = {
    credentials: "include", // Always include credentials for cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  // Merge with provided options
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  console.log(`API Request: ${options.method || "GET"} ${url}`);

  return fetch(url, mergedOptions);
}
