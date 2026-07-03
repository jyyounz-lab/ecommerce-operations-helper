export const APP_VERSION = "1.0.0";
const money = value => `NT$${new Intl.NumberFormat("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
const percent = value => new Intl.NumberFormat("zh-TW", { style: "percent", maximumFractionDigits: 2 }).format(value);
const amount = (id, label, defaultValue, unit = "元") => ({ id, label, defaultValue, unit, min: 0 });
const rate = (id, label, defaultValue) => ({ id, label, defaultValue, unit: "%", min: 0, maxExclusive: 100, rate: true });

export const calculators = [
  { id: "gross-margin", title: "毛利率", subtitle: "售價與成本的獲利比例", formulaText: "（售價－成本）÷ 售價", fields: [amount("price", "售價", 1000), amount("cost", "成本", 650)], calculate: ({ price, cost }) => (price - cost) / price, validate: v => v.price <= 0 ? { price: "售價必須大於 0" } : {}, format: percent },
  { id: "pricing", title: "建議定價", subtitle: "依進價與目標毛利定價", formulaText: "進價 ÷（1－目標毛利率）", fields: [amount("purchase", "進價", 650), rate("margin", "目標毛利率", 35)], calculate: ({ purchase, margin }) => purchase / (1 - margin), format: money },
  { id: "cost-backsolve", title: "回推成本", subtitle: "由定價反推可接受成本", formulaText: "定價 ×（1－目標毛利率）", fields: [amount("price", "定價", 1000), rate("margin", "目標毛利率", 35)], calculate: ({ price, margin }) => price * (1 - margin), format: money },
  { id: "break-even", title: "損益兩平", subtitle: "計算不賺不賠的營業額", formulaText: "固定成本 ÷ 毛利率", fields: [amount("fixedCost", "固定成本", 100000), rate("margin", "毛利率", 35)], calculate: ({ fixedCost, margin }) => fixedCost / margin, validate: v => v.margin <= 0 ? { margin: "毛利率必須大於 0" } : {}, format: money },
  { id: "target-revenue", title: "目標營業額", subtitle: "達成目標獲利需要多少業績", formulaText: "（目標獲利＋固定成本）÷ 毛利率", fields: [amount("targetProfit", "目標獲利", 200000), amount("fixedCost", "固定成本", 100000), rate("margin", "毛利率", 35)], calculate: ({ targetProfit, fixedCost, margin }) => (targetProfit + fixedCost) / margin, validate: v => v.margin <= 0 ? { margin: "毛利率必須大於 0" } : {}, format: money },
  { id: "forecast", title: "業績預估", subtitle: "從流量與轉換推估營業額", formulaText: "曝光量 × 點擊率 × 轉換率 × 平均客單價", fields: [amount("impressions", "曝光量", 100000, "次"), rate("clickRate", "點擊率", 2), rate("conversionRate", "轉換率", 3), amount("orderValue", "平均客單價", 1200)], calculate: ({ impressions, clickRate, conversionRate, orderValue }) => impressions * clickRate * conversionRate * orderValue, format: money }
];

export function evaluate(calculator, rawValues) {
  const errors = {}, values = {};
  for (const field of calculator.fields) {
    const raw = rawValues[field.id], value = Number(raw);
    if (raw === "" || !Number.isFinite(value)) errors[field.id] = "請輸入有效數字";
    else if (value < field.min) errors[field.id] = "數值不可小於 0";
    else if (field.maxExclusive && value >= field.maxExclusive) errors[field.id] = "比例必須小於 100%";
    values[field.id] = field.rate ? value / 100 : value;
  }
  Object.assign(errors, calculator.validate?.(values) ?? {});
  if (Object.keys(errors).length) return { errors, result: null };
  const result = calculator.calculate(values);
  return Number.isFinite(result) ? { errors, result } : { errors: { _form: "目前數值無法計算" }, result: null };
}
