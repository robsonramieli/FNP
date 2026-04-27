// ═══════════════════════════════════════════════════════════
// FNP Delivery — index.js completo (versão planilha real)
// ═══════════════════════════════════════════════════════════

// Estados globais
let ingredients   = {};   // { id: { label, value, unit } }
let fixedCosts    = {};
let variableCosts = {};
let businessParams= {};
let products      = [];   // rows do DB com campos diretos
let combos        = [];
let weeklySales   = [];

const revenueScenarios = [60000, 80000, 100000, 120000, 140000, 160000, 180000];

// ─── LOAD ──────────────────────────────────────────
async function loadData() {
    const res  = await fetch('/api/all');
    const data = await res.json();

    ingredients    = Object.fromEntries(data.ingredients.map(i => [i.id, i]));
    fixedCosts     = Object.fromEntries(data.fixedCosts.map(i => [i.id, i]));
    variableCosts  = Object.fromEntries(data.variableCosts.map(i => [i.id, i]));
    businessParams = Object.fromEntries(data.businessParams.map(i => [i.id, i]));
    products       = data.products;
    combos         = data.combos;
    weeklySales    = data.weeklySales;

    initUI();
}

// ─── CÁLCULOS ─────────────────────────────────────
function calcProductCost(p) {
    return (p.proteina||0) + (p.embalagem||0) + (p.ovo||0)
         + (p.farinha_t||0) + (p.farinha_r||0) + (p.acomp||0)
         + (p.molhos||0) + (p.pardo||0) + (p.extra||0);
}

function calcIdealPrice(cost, cmvIdeal) {
    return cmvIdeal > 0 ? cost / (cmvIdeal / 100) : 0;
}

function calcRealCMV(cost, price) {
    return price > 0 ? (cost / price) * 100 : 0;
}

function getTotalFixed() {
    return Object.values(fixedCosts).reduce((s, c) => s + c.value, 0);
}

function getTotalVariableRate() {
    // Inclui CMV conforme planilha original
    return Object.values(variableCosts).reduce((s, c) => s + c.value, 0);
}

function calcBreakEven() {
    const varRate = getTotalVariableRate() / 100;
    return varRate < 1 ? getTotalFixed() / (1 - varRate) : 0;
}

function calcProjection(revenue) {
    const varCosts = revenue * (getTotalVariableRate() / 100);
    const fixed    = getTotalFixed();
    const result   = revenue - varCosts - fixed;
    const margin   = revenue > 0 ? (result / revenue) * 100 : 0;
    const payback  = result > 0 ? businessParams.investimento_total.value / result : Infinity;
    return { revenue, varCosts, fixed, result, margin, payback };
}

function getAllMetrics() {
    return products.map(p => {
        const cost       = calcProductCost(p);
        const idealPrice = calcIdealPrice(cost, p.cmvIdeal);
        const realCMV    = calcRealCMV(cost, p.currentPrice);
        const profit     = p.currentPrice - cost;
        return { ...p, cost, idealPrice, realCMV, profit };
    });
}

function calcWeightedCMV(metrics) {
    const totalRevenue = metrics.reduce((s, m) => s + m.currentPrice, 0);
    if (!totalRevenue) return 0;
    return metrics.reduce((s, m) => s + (m.realCMV * m.currentPrice / totalRevenue), 0);
}

// ─── FORMATAÇÃO ───────────────────────────────────
function fmt(v)    { return (+v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtBRL(v) { return 'R$\u00a0' + fmt(v); }
function pct(v)    { return fmt(v) + '%'; }

// ─── HELPERS UI ───────────────────────────────────
function cmvClass(cmv, ideal) {
    if (cmv <= ideal)      return 'badge-success';
    if (cmv <= ideal + 10) return 'badge-warning';
    return 'badge-danger';
}
function cmvColor(cmv, ideal) {
    if (cmv <= ideal)      return 'var(--success)';
    if (cmv <= ideal + 10) return 'var(--warning)';
    return 'var(--danger)';
}

function formField(id, label, value, step = '0.01', suffix = '') {
    return `<div class="form-group">
        <label for="${id}">${label}${suffix ? ' <small style="color:var(--text-muted)">'+suffix+'</small>' : ''}</label>
        <input type="number" step="${step}" min="0" id="${id}" value="${(+value).toFixed(2)}">
    </div>`;
}

// ─── RENDER ABAS DE CUSTOS ────────────────────────
function renderCostForms() {
    // Ingredientes
    const ingEl = document.getElementById('ingredients-form');
    ingEl.innerHTML = Object.entries(ingredients).map(([id, item]) =>
        `<div class="form-group">
            <label for="ing-${id}">${item.label} <small style="color:var(--text-muted)">(${item.unit})</small></label>
            <input type="number" step="0.01" min="0" id="ing-${id}" data-api="ingredient" data-key="${id}" value="${item.value.toFixed(2)}">
        </div>`
    ).join('');

    // Fixos
    const fixEl = document.getElementById('fixed-costs-form');
    fixEl.innerHTML = Object.entries(fixedCosts).map(([id, item]) =>
        `<div class="form-group">
            <label for="fix-${id}">${item.label}</label>
            <input type="number" step="1" min="0" id="fix-${id}" data-api="fixed-cost" data-key="${id}" value="${item.value.toFixed(2)}">
        </div>`
    ).join('');

    // Variáveis
    const varEl = document.getElementById('variable-costs-form');
    varEl.innerHTML = Object.entries(variableCosts).map(([id, item]) =>
        `<div class="form-group">
            <label for="var-${id}">${item.label}${item.notes ? ' <small style="color:var(--text-muted)">*</small>' : ''}</label>
            <input type="number" step="0.01" min="0" id="var-${id}" data-api="variable-cost" data-key="${id}" value="${item.value.toFixed(2)}">
            ${item.notes ? `<div class="input-suffix">${item.notes}</div>` : ''}
        </div>`
    ).join('');

    // Parâmetros
    const bpEl = document.getElementById('business-params-form');
    bpEl.innerHTML = Object.entries(businessParams).map(([id, item]) =>
        `<div class="form-group">
            <label for="bp-${id}">${item.label}</label>
            <input type="number" step="1" min="0" id="bp-${id}" data-api="business-param" data-key="${id}" value="${item.value.toFixed(2)}">
        </div>`
    ).join('');

    renderCostTotals();
}

function renderCostTotals() {
    document.getElementById('total-fixed').textContent    = fmtBRL(getTotalFixed());
    document.getElementById('total-variable').textContent = pct(getTotalVariableRate());
}

// ─── RENDER DASHBOARD ─────────────────────────────
function renderDashboard() {
    const metrics  = getAllMetrics();
    const avgCost  = metrics.reduce((s,m) => s + m.cost, 0) / metrics.length;
    const avgProfit= metrics.reduce((s,m) => s + m.profit, 0) / metrics.length;
    const wCMV     = calcWeightedCMV(metrics);
    const breakEven= calcBreakEven();
    const totalFix = getTotalFixed();
    const idealCMV = businessParams.cmv_ideal?.value || 35;
    const invest   = businessParams.investimento_total?.value || 125000;

    document.getElementById('dashboard-stats').innerHTML = `
        <div class="stat-card accent-primary">
            <div class="stat-label">Custo Médio / Prato</div>
            <div class="stat-value">${fmtBRL(avgCost)}</div>
            <div class="stat-desc">${metrics.length} produtos</div>
        </div>
        <div class="stat-card accent-success">
            <div class="stat-label">Lucro Médio / Prato</div>
            <div class="stat-value text-success">${fmtBRL(avgProfit)}</div>
        </div>
        <div class="stat-card accent-warning">
            <div class="stat-label">CMV Médio Ponderado</div>
            <div class="stat-value" style="color:${cmvColor(wCMV, idealCMV)}">${pct(wCMV)}</div>
            <div class="stat-desc">Ideal: ${idealCMV}%</div>
        </div>
        <div class="stat-card accent-info">
            <div class="stat-label">Ponto de Equilíbrio</div>
            <div class="stat-value text-primary">${fmtBRL(breakEven)}</div>
            <div class="stat-desc">/mês</div>
        </div>
        <div class="stat-card accent-danger">
            <div class="stat-label">Custos Fixos</div>
            <div class="stat-value">${fmtBRL(totalFix)}</div>
            <div class="stat-desc">/mês</div>
        </div>
        <div class="stat-card accent-primary">
            <div class="stat-label">Investimento Total</div>
            <div class="stat-value">${fmtBRL(invest)}</div>
        </div>`;

    // Top 5 lucro
    const byProfit = [...metrics].sort((a,b) => b.profit - a.profit);
    document.getElementById('top-profit-body').innerHTML = byProfit.slice(0,5).map(m =>
        `<tr>
            <td style="font-weight:600">${m.name}</td>
            <td class="text-success text-bold">${fmtBRL(m.profit)}</td>
            <td><span class="badge ${cmvClass(m.realCMV, m.cmvIdeal)}">${pct(m.realCMV)}</span></td>
        </tr>`).join('');

    // Top 5 CMV crítico
    const byCMV = [...metrics].sort((a,b) => b.realCMV - a.realCMV);
    document.getElementById('top-cmv-body').innerHTML = byCMV.slice(0,5).map(m =>
        `<tr>
            <td style="font-weight:600">${m.name}</td>
            <td><span class="badge ${cmvClass(m.realCMV, m.cmvIdeal)}">${pct(m.realCMV)}</span></td>
            <td class="text-muted">${m.cmvIdeal}%</td>
        </tr>`).join('');
}

// ─── RENDER PRECIFICAÇÃO ─────────────────────────
function renderPricing() {
    const metrics = getAllMetrics();
    // Agrupar por categoria
    const cats = [...new Set(metrics.map(m => m.category))];
    const body  = document.getElementById('pricing-body');
    body.innerHTML = '';

    cats.forEach(cat => {
        const rows = metrics.filter(m => m.category === cat);
        // Cabeçalho de categoria
        body.innerHTML += `<tr><td colspan="7" style="background:rgba(99,102,241,0.1);font-weight:700;font-size:0.75rem;color:var(--primary-light);padding:0.5rem 0.75rem;letter-spacing:0.04em;">${cat.toUpperCase()}</td></tr>`;
        rows.forEach(m => {
            const pc = m.profit >= 0 ? 'var(--success)' : 'var(--danger)';
            body.innerHTML += `<tr>
                <td style="font-weight:600;padding-left:1.2rem">${m.name}</td>
                <td>${fmtBRL(m.cost)}</td>
                <td class="text-muted">${fmtBRL(m.idealPrice)}</td>
                <td><input type="number" step="0.1" min="0" class="table-input" data-product-id="${m.id}" value="${m.currentPrice.toFixed(2)}"></td>
                <td>
                    <span class="badge ${cmvClass(m.realCMV, m.cmvIdeal)}">${pct(m.realCMV)}</span>
                    <div class="cmv-bar"><div class="cmv-fill" style="width:${Math.min(m.realCMV*100/60,100)}%;background:${cmvColor(m.realCMV,m.cmvIdeal)}"></div></div>
                </td>
                <td class="text-muted">${m.cmvIdeal}%</td>
                <td style="font-weight:700;color:${pc}">${fmtBRL(m.profit)}</td>
            </tr>`;
        });
    });
}

// ─── RENDER COMBOS ───────────────────────────────
function renderCombos() {
    const body = document.getElementById('combos-body');
    if (!body) return;
    body.innerHTML = combos.map(c => {
        const disc = c.discount_pct > 0 ? `<span class="badge badge-warning">-${c.discount_pct}%</span>` : '';
        const dayBadge = c.day_label ? `<span class="badge badge-info" style="margin-left:4px">${c.day_label}</span>` : '';
        return `<tr>
            <td style="font-weight:600">${c.name} ${dayBadge}</td>
            <td style="font-size:0.75rem;color:var(--text-muted)">${c.items.join(' + ')}</td>
            <td>${fmtBRL(c.currentPrice)} ${disc}</td>
        </tr>`;
    }).join('');
}

// ─── RENDER VENDAS SEMANAIS ─────────────────────
function renderWeeklySales() {
    const body = document.getElementById('sales-body');
    if (!body) return;
    const days    = ['Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
    const products = [...new Set(weeklySales.map(s => s.product_name))];

    const totals  = { total: 0 };
    days.forEach(d => totals[d] = 0);

    const rows = products.map(name => {
        const dayMap  = Object.fromEntries(weeklySales.filter(s => s.product_name === name).map(s => [s.day, s.quantity]));
        const weekTotal = days.reduce((s, d) => s + (dayMap[d] || 0), 0);
        totals.total += weekTotal;
        days.forEach(d => totals[d] += (dayMap[d] || 0));
        return `<tr>
            <td style="font-weight:600">${name}</td>
            ${days.map(d => `<td>${dayMap[d] || 0}</td>`).join('')}
            <td style="font-weight:700;color:var(--primary-light)">${weekTotal}</td>
        </tr>`;
    });

    body.innerHTML = rows.join('') + `<tr style="background:rgba(99,102,241,0.1);font-weight:700">
        <td>TOTAL</td>
        ${days.map(d => `<td>${totals[d]}</td>`).join('')}
        <td>${totals.total}</td>
    </tr>`;
}

// ─── RENDER PROJEÇÃO ─────────────────────────────
function renderProjection() {
    const breakEven   = calcBreakEven();
    const projections = revenueScenarios.map(calcProjection);
    const best        = projections[projections.length - 1];
    const invest      = businessParams.investimento_total?.value || 125000;

    document.getElementById('projection-stats').innerHTML = `
        <div class="stat-card accent-info">
            <div class="stat-label">Ponto de Equilíbrio</div>
            <div class="stat-value text-primary">${fmtBRL(breakEven)}</div>
        </div>
        <div class="stat-card accent-success">
            <div class="stat-label">Resultado (R$180k)</div>
            <div class="stat-value text-success">${fmtBRL(best.result)}</div>
        </div>
        <div class="stat-card accent-warning">
            <div class="stat-label">Payback (R$180k)</div>
            <div class="stat-value">${best.payback === Infinity ? '—' : fmt(best.payback) + ' meses'}</div>
        </div>`;

    document.getElementById('projection-body').innerHTML = projections.map(p => {
        const isBreak = p.revenue >= breakEven && p.revenue - 20000 < breakEven;
        const rc = p.result >= 0 ? 'text-success' : 'text-danger';
        const paybackCell = p.payback === Infinity
            ? '<span class="badge badge-danger">N/A</span>'
            : `<span class="badge badge-info">${fmt(p.payback)}</span>`;
        return `<tr class="${isBreak ? 'row-highlight' : ''}">
            <td style="font-weight:600">${fmtBRL(p.revenue)}</td>
            <td class="text-warning">${fmtBRL(p.varCosts)}</td>
            <td>${fmtBRL(p.fixed)}</td>
            <td class="${rc} text-bold">${fmtBRL(p.result)}</td>
            <td class="${rc}">${pct(p.margin)}</td>
            <td>${paybackCell}</td>
        </tr>`;
    }).join('');
}

// ─── RENDER ALL ───────────────────────────────────
function renderAll() {
    renderDashboard();
    renderCostTotals();
    renderPricing();
    renderCombos();
    renderWeeklySales();
    renderProjection();
}

// ─── UPDATE ROW (sem re-render completo) ─────────
function updatePricingRow(input, product) {
    const tr    = input.closest('tr');
    const cells = tr.children;
    const cost   = calcProductCost(product);
    const cmv    = calcRealCMV(cost, product.currentPrice);
    const profit = product.currentPrice - cost;
    cells[4].innerHTML = `<span class="badge ${cmvClass(cmv, product.cmvIdeal)}">${pct(cmv)}</span>
        <div class="cmv-bar"><div class="cmv-fill" style="width:${Math.min(cmv*100/60,100)}%;background:${cmvColor(cmv,product.cmvIdeal)}"></div></div>`;
    cells[6].style.color = profit >= 0 ? 'var(--success)' : 'var(--danger)';
    cells[6].textContent = fmtBRL(profit);
}

// ─── EVENTOS ──────────────────────────────────────
function setupTabs() {
    document.getElementById('tabs-nav').addEventListener('click', e => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
}

function post(endpoint, body) {
    return fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

function setupFormListeners() {
    // Inputs de custo (ingredientes, fixos, variáveis, parâmetros)
    ['ingredients-form','fixed-costs-form','variable-costs-form','business-params-form'].forEach(formId => {
        document.getElementById(formId)?.addEventListener('input', e => {
            const { api, key } = e.target.dataset;
            if (!api || !key) return;
            const val = parseFloat(e.target.value) || 0;
            if      (api === 'ingredient')    { ingredients[key].value   = val; }
            else if (api === 'fixed-cost')    { fixedCosts[key].value    = val; }
            else if (api === 'variable-cost') { variableCosts[key].value = val; }
            else if (api === 'business-param'){ businessParams[key].value = val; }
            renderAll();
            post(api, { id: key, value: val });
        });
    });

    // Preços de venda na tabela
    document.getElementById('pricing-body').addEventListener('input', e => {
        if (!e.target.classList.contains('table-input')) return;
        const id = parseInt(e.target.dataset.productId);
        const p  = products.find(p => p.id === id);
        if (!p) return;
        const val = parseFloat(e.target.value) || 0;
        p.currentPrice = val;
        renderDashboard();
        renderProjection();
        updatePricingRow(e.target, p);
        post('product-price', { id, price: val });
    });
}

// ─── INIT ─────────────────────────────────────────
function initUI() {
    renderCostForms();
    renderAll();
    setupFormListeners();
}

function init() {
    setupTabs();
    loadData().catch(err => {
        console.error('Erro ao carregar dados:', err);
        alert('Erro ao conectar com o servidor. Certifique-se que node server.js está rodando.');
    });
}

init();
