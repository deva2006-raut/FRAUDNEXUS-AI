export const fmtINR = (n: number): string =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const fmtCompactINR = (n: number): string => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return fmtINR(n);
};

export const fmtTime12 = (time: string): string => {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const fmtDateTime = (date: string, time: string): string =>
  `${date} · ${fmtTime12(time)}`;
