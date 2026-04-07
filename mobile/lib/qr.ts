/**
 * Normalize QR / deep-link payloads before resolve_plant_qr.
 * Supports: raw token, https://host/p/<token>, veera://p/<token>, ?t=<token>
 */
export function normalizeQrPayload(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const pathMatch = trimmed.match(/\/p\/([^/?#]+)/i);
  if (pathMatch?.[1]) {
    try {
      return decodeURIComponent(pathMatch[1]);
    } catch {
      return pathMatch[1];
    }
  }

  const qMatch = trimmed.match(/[?&]t=([^&\s#]+)/);
  if (qMatch?.[1]) {
    try {
      return decodeURIComponent(qMatch[1]);
    } catch {
      return qMatch[1];
    }
  }

  return trimmed;
}
