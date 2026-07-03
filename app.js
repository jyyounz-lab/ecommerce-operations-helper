import { APP_VERSION, calculators, evaluate } from "./calculators.js";
const STORAGE_KEY = "ecommerce-helper:v1";
const $ = selector => document.querySelector(selector);
let saved;
try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { saved = {}; }
let installPrompt, toastTimer;

function valuesFor(calculator) {
  return Object.fromEntries(calculator.fields.map(f => [f.id, saved[calculator.id]?.[f.id] ?? f.defaultValue]));
}
function render() {
  $("#version").textContent = APP_VERSION;
  $("#tool-nav").innerHTML = calculators.map((c, i) => `<a class="tool-link" href="#${c.id}"><span>0${i + 1}</span><strong>${c.title}</strong></a>`).join("");
  $("#calculators").innerHTML = calculators.map((c, i) => `<article class="calculator ${i === 0 ? "open" : ""}" id="${c.id}">
    <button class="summary-button" type="button" aria-expanded="${i === 0}" aria-controls="${c.id}-body"><span class="calc-index">0${i + 1}</span><span class="summary-copy"><strong>${c.title}</strong><small>${c.subtitle}</small></span><span class="chevron" aria-hidden="true">＋</span></button>
    <div class="calc-body" id="${c.id}-body"><p class="formula">公式：${c.formulaText}</p><div class="fields">${c.fields.map(f => `<div class="field"><label for="${c.id}-${f.id}">${f.label}<span>${f.rate ? "直接輸入百分比" : "輸入數值"}</span></label><div class="input-wrap"><input id="${c.id}-${f.id}" name="${f.id}" type="number" inputmode="decimal" min="0" ${f.maxExclusive ? `max="${f.maxExclusive - .01}"` : ""} step="any" value="${valuesFor(c)[f.id]}"><span class="unit">${f.unit}</span></div><p class="error" id="${c.id}-${f.id}-error"></p></div>`).join("")}</div><div class="result"><span>計算結果</span><output aria-live="polite">—</output></div></div>
  </article>`).join("");
  document.querySelectorAll(".summary-button").forEach(button => button.addEventListener("click", () => {
    const card = button.closest(".calculator"); card.classList.toggle("open"); button.setAttribute("aria-expanded", card.classList.contains("open"));
  }));
  calculators.forEach(bindCalculator);
}
function bindCalculator(calculator) {
  const card = document.getElementById(calculator.id), inputs = [...card.querySelectorAll("input")];
  const update = () => {
    const raw = Object.fromEntries(inputs.map(input => [input.name, input.value]));
    saved[calculator.id] = raw; localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    const { errors, result } = evaluate(calculator, raw);
    inputs.forEach(input => { const message = errors[input.name] || ""; input.setAttribute("aria-invalid", String(Boolean(message))); input.setAttribute("aria-describedby", `${calculator.id}-${input.name}-error`); document.getElementById(`${calculator.id}-${input.name}-error`).textContent = message; });
    const box = card.querySelector(".result"); box.classList.toggle("invalid", result === null); box.querySelector("output").textContent = result === null ? (errors._form || "請完成正確輸入") : calculator.format(result);
  };
  inputs.forEach(input => input.addEventListener("input", update)); update();
}
function restore(clear = false) {
  calculators.forEach(c => { saved[c.id] = Object.fromEntries(c.fields.map(f => [f.id, clear ? "" : f.defaultValue])); });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); render(); showToast(clear ? "已清除所有輸入" : "已恢復範例值");
}
function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 1800); }
function updateNetwork() { const status = $("#network-status"); status.classList.toggle("offline", !navigator.onLine); status.querySelector("span").textContent = navigator.onLine ? "可離線使用" : "目前離線"; }

$("#reset-button").addEventListener("click", () => restore());
$("#clear-button").addEventListener("click", () => restore(true));
window.addEventListener("online", updateNetwork); window.addEventListener("offline", updateNetwork);
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); installPrompt = event; $("#install-button").hidden = false; });
$("#install-button").addEventListener("click", async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $("#install-button").hidden = true; });
render(); updateNetwork();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
