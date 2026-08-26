const MAX_LOCATION_CODE_LENGTH = 64;
const LOCATION_CODE_PATTERN = /^[A-Z0-9_-]+$/;

export function readLocationCode(url: URL): string | null {
  const rawLocationCode = url.searchParams.get("location");
  if (!rawLocationCode) return null;

  // Tolerate QR generators or copied URLs that include surrounding quotes.
  const locationCode = rawLocationCode.trim().replace(/^"(.*)"$/, "$1").trim().toUpperCase();
  if (!locationCode || locationCode.length > MAX_LOCATION_CODE_LENGTH || !LOCATION_CODE_PATTERN.test(locationCode)) return null;

  return locationCode;
}
