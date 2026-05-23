export const X402_MODE =
  process.env.NEXT_PUBLIC_X402_MODE?.trim() || "mock";

const configuredPrice = Number(process.env.X402_PRICE_USD ?? "0.01");

export const X402_PRICE_USD =
  Number.isFinite(configuredPrice) && configuredPrice > 0
    ? configuredPrice
    : 0.01;

export function isMockX402Mode() {
  return X402_MODE === "mock";
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
