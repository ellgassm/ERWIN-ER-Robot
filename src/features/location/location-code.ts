const MAX_LOCATION_CODE_LENGTH = 64;

export function readLocationCode(url: URL): string | null {
  const rawLocationCode = url.searchParams.get("location");
  if (!rawLocationCode) return null;

  const locationCode = rawLocationCode.trim().toUpperCase();
  if (!locationCode || locationCode.length > MAX_LOCATION_CODE_LENGTH) return null;

  return locationCode;
}
