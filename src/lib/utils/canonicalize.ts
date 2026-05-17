type CanonicalJson = null | boolean | number | string | CanonicalJson[] | {
  [key: string]: CanonicalJson;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertCanonicalValue(value: unknown): asserts value is CanonicalJson {
  if (value === null) {
    return;
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Canonical JSON cannot encode NaN or Infinity.");
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(assertCanonicalValue);
    return;
  }

  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (typeof child === "undefined") {
        throw new TypeError(`Canonical JSON cannot encode undefined at ${key}.`);
      }
      assertCanonicalValue(child);
    }
    return;
  }

  throw new TypeError(`Unsupported value in canonical JSON: ${typeof value}.`);
}

export function canonicalize(value: unknown): string {
  assertCanonicalValue(value);

  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
    .join(",")}}`;
}
