import type { CanvasUser } from "./types";

function parseLinkHeader(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

export class CanvasApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "CanvasApiError";
  }
}

export async function fetchCanvasPaginated<T>(
  baseUrl: string,
  path: string,
  accessToken: string
): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = `${baseUrl}${path}`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new CanvasApiError(
        `Canvas API error (${res.status}): ${text.slice(0, 200)}`,
        res.status
      );
    }

    const page = (await res.json()) as T[];
    results.push(...page);
    url = parseLinkHeader(res.headers.get("Link"));
  }

  return results;
}

export async function fetchCanvasUser(
  baseUrl: string,
  accessToken: string
): Promise<CanvasUser> {
  const res = await fetch(`${baseUrl}/api/v1/users/self`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new CanvasApiError(`Failed to fetch user (${res.status})`, res.status);
  }

  return res.json() as Promise<CanvasUser>;
}

export async function verifyCanvasToken(
  baseUrl: string,
  accessToken: string
): Promise<CanvasUser> {
  return fetchCanvasUser(baseUrl, accessToken);
}
