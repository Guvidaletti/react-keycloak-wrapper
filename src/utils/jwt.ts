import { KeycloakUser } from "../types";

export function parseJwtPayload(token?: string): KeycloakUser | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const decoded = atob(padded);
    const bytes = Uint8Array.from(decoded, (character) =>
      character.charCodeAt(0),
    );

    return JSON.parse(new TextDecoder().decode(bytes)) as KeycloakUser;
  } catch {
    return null;
  }
}
