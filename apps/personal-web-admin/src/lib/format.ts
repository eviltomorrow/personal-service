export function formatCNY(amount: number) {
  const prefix = amount < 0 ? "- " : "";
  return `${prefix}¥ ${Math.abs(amount).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
