export function toBytes32Hash(hash: string): `0x${string}` {
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    throw new Error("MarketSpec hash must be a 32-byte hex string.");
  }

  return hash as `0x${string}`;
}

export function metadataUriForSpec(hash: string) {
  if (typeof window === "undefined") {
    return `/spec/${hash}`;
  }

  return new URL(`/spec/${hash}`, window.location.origin).toString();
}
