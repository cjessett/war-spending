
const TAX_DATA = {
  2025: {
    deductions: { single: 15750, mfj: 31500, hoh: 23625 },
    brackets: {
      single: [
        [0.10,        0,      11925],
        [0.12,    11925,      48475],
        [0.22,    48475,     103350],
        [0.24,   103350,     197300],
        [0.32,   197300,     250525],
        [0.35,   250525,     626350],
        [0.37,   626350,   Infinity],
      ],
      mfj: [
        [0.10,        0,      23850],
        [0.12,    23850,      96950],
        [0.22,    96950,     206700],
        [0.24,   206700,     394600],
        [0.32,   394600,     501050],
        [0.35,   501050,     751600],
        [0.37,   751600,   Infinity],
      ],
      hoh: [
        [0.10,        0,      17000],
        [0.12,    17000,      64850],
        [0.22,    64850,     103350],
        [0.24,   103350,     197300],
        [0.32,   197300,     250500],
        [0.35,   250500,     626350],
        [0.37,   626350,   Infinity],
      ],
    },
    // defense$ / individual income tax revenue
    defenseFraction: 919.2 / 3347, // ~0.2746
    defenseTotal: 919.2e9,
    incomeTaxRevenue: 3347e9,
    totalOutlays: 7000e9,
  },
  2026: {
    deductions: { single: 16100, mfj: 32200, hoh: 24150 },
    brackets: {
      single: [
        [0.10,        0,      12200],
        [0.12,    12200,      49650],
        [0.22,    49650,     105825],
        [0.24,   105825,     201850],
        [0.32,   201850,     256300],
        [0.35,   256300,     641100],
        [0.37,   641100,   Infinity],
      ],
      mfj: [
        [0.10,        0,      24400],
        [0.12,    24400,      99300],
        [0.22,    99300,     211600],
        [0.24,   211600,     403700],
        [0.32,   403700,     512650],
        [0.35,   512650,     768900],
        [0.37,   768900,   Infinity],
      ],
      hoh: [
        [0.10,        0,      17400],
        [0.12,    17400,      66400],
        [0.22,    66400,     105825],
        [0.24,   105825,     201850],
        [0.32,   201850,     256300],
        [0.35,   256300,     641100],
        [0.37,   641100,   Infinity],
      ],
    },
    // FY2026: OBBB increases defense ~13%+ → ~$1.038T; income tax est ~$3.55T
    defenseFraction: 1060 / 3550, // ~0.2986
    defenseTotal: 1060e9,
    incomeTaxRevenue: 3550e9,
    totalOutlays: 7200e9,
  },
};

// FY2025 outlay category fractions (of $7.0T total)
// Social Security ~23.5%, Medicare+Medicaid ~21.4%, Net Interest ~14.3%, Defense ~13.1%
const SPENDING_CATEGORIES_2025 = {
  defense: 919.2 / 7000 * 100,
  ss: 23.5,
  medicare: 21.4,
  interest: 14.3,
};
const SPENDING_CATEGORIES_2026 = {
  defense: 1060 / 7200 * 100,
  ss: 23.0,
  medicare: 21.0,
  interest: 14.8,
};

let currentYear = 2025;

// ── UTILITIES ─────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n >= 1e9) return '$' + (n/1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return '$' + n.toFixed(2);
}

function fmtDollar(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function pct(n) { return (n * 100).toFixed(1) + '%'; }

// ── TAX CALCULATION ───────────────────────────────────────────────────────────

function calcTax(salary, filingStatus, year) {
  const data = TAX_DATA[year];
  const deduction = data.deductions[filingStatus];
  const taxable = Math.max(0, salary - deduction);
  const brackets = data.brackets[filingStatus];

  let totalTax = 0;
  const breakdown = [];

  for (const [rate, low, high] of brackets) {
    if (taxable <= low) break;
    const top = Math.min(taxable, high === Infinity ? taxable : high);
    const income = top - low;
    const tax = income * rate;
    totalTax += tax;
    breakdown.push({ rate, low, high, income, tax, taxable });
  }

  return { totalTax, taxable, breakdown, deduction };
}

// ── RENDER ────────────────────────────────────────────────────────────────────

function flashEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
}

function animateBars(year) {
  const cats = year === 2025 ? SPENDING_CATEGORIES_2025 : SPENDING_CATEGORIES_2026;

  requestAnimationFrame(() => {
    const defenseBar = document.getElementById('bar-defense');
    if (defenseBar) defenseBar.style.width = cats.defense.toFixed(1) + '%';

    const pctDefense = document.getElementById('pct-defense');
    if (pctDefense) pctDefense.textContent = cats.defense.toFixed(1) + '% of outlays';

    const pctOther = document.getElementById('pct-other');
    const otherPct = 100 - cats.defense - cats.ss - cats.medicare - cats.interest;
    if (pctOther) pctOther.textContent = otherPct.toFixed(1) + '%';

    const barOther = document.getElementById('bar-other');
    if (barOther) barOther.style.width = otherPct.toFixed(1) + '%';

    // animate static bars
    document.querySelectorAll('.bar-fill[data-target]').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  });
}

function renderAnalogies(defenseAmt) {
  const items = [
    { icon: '☕', label: 'Starbucks grande lattes', cost: 7.5 },
    { icon: '⛽', label: 'Gallons of gas', cost: 3.2 },
    { icon: '📚', label: 'Public library memberships', cost: 150 },
    { icon: '🎓', label: 'Community college credits', cost: 200 },
    { icon: '🏥', label: 'Primary care doctor visits', cost: 250 },
    { icon: '🌲', label: 'Tree plantings (est.)', cost: 25 },
  ];
  const container = document.getElementById('analogies');
  container.innerHTML = items.map(it => {
    const count = defenseAmt / it.cost;
    const countStr = count >= 1000
      ? Math.round(count).toLocaleString()
      : count.toFixed(1);
    return `<div class="analogy-item">
      <div class="analogy-icon">${it.icon}</div>
      <div class="analogy-amount">${countStr}×</div>
      <div class="analogy-text">${it.label}<br>@ ${fmt(it.cost)} ea.</div>
    </div>`;
  }).join('');
}

function renderBrackets(salary, filing, year, breakdown) {
  const tbody = document.getElementById('bracketBody');
  const data = TAX_DATA[year];
  const deduction = data.deductions[filing];
  const taxable = Math.max(0, salary - deduction);

  tbody.innerHTML = data.brackets[filing].map(([rate, low, high], i) => {
    const hiLabel = high === Infinity ? '∞' : fmtDollar(high);
    const inRange = taxable > low;
    const actualLow = low;
    const actualHigh = Math.min(taxable, high === Infinity ? taxable : high);
    const actualIncome = inRange ? Math.max(0, actualHigh - actualLow) : 0;
    const bracketTax = actualIncome * rate;
    const isActive = actualIncome > 0;

    return `<tr class="${isActive ? 'active-bracket' : ''}">
      <td class="rate">${(rate * 100).toFixed(0)}%</td>
      <td>${fmtDollar(low)}</td>
      <td>${hiLabel}</td>
      <td>${isActive ? fmtDollar(bracketTax) : '—'}</td>
    </tr>`;
  }).join('');
}

function update() {
  const salary = parseFloat(document.getElementById('salary').value) || 0;
  const filing = document.getElementById('filing').value;
  const year = currentYear;
  const data = TAX_DATA[year];

  const { totalTax, taxable, breakdown } = calcTax(salary, filing, year);
  const defenseDollars = totalTax * data.defenseFraction;
  const effectiveRate = salary > 0 ? totalTax / salary : 0;

  // 2025 compare
  const { totalTax: tax25 } = calcTax(salary, filing, 2025);
  const defense25 = tax25 * TAX_DATA[2025].defenseFraction;

  // 2026 compare
  const { totalTax: tax26 } = calcTax(salary, filing, 2026);
  const defense26 = tax26 * TAX_DATA[2026].defenseFraction;

  // Update DOM
  document.getElementById('totalTax').textContent = fmtDollar(totalTax);
  document.getElementById('effectiveRate').textContent = `Effective rate: ${(effectiveRate * 100).toFixed(2)}% — Taxable income: ${fmtDollar(taxable)}`;
  document.getElementById('defenseDollars').textContent = fmtDollar(defenseDollars);
  document.getElementById('defensePerDay').textContent = `Per day: ${fmtDollar(defenseDollars / 365)} — Per hour: ${fmtDollar(defenseDollars / 8760)}`;

  // Days worked calculation: war spending dollars / daily pre-tax pay (261 working days/yr)
  const WORKING_DAYS = 261;
  const dailySalary = salary / WORKING_DAYS;
  const daysForWar = salary > 0 ? defenseDollars / dailySalary : 0;
  const daysRounded = daysForWar.toFixed(1);
  const warDayLabel = daysForWar < 1
    ? `${(daysForWar * 8).toFixed(1)} hours`
    : `${daysRounded} days`;
  document.getElementById('daysWorked').textContent = warDayLabel;

  // Find the calendar date when war is "paid off" (from Jan 1)
  if (salary > 0 && daysForWar >= 1) {
    const warPaidDate = new Date(new Date().getFullYear(), 0, 1);
    // Step through working days (Mon–Fri)
    let wdCount = 0;
    const d = new Date(warPaidDate);
    while (wdCount < Math.round(daysForWar)) {
      d.setDate(d.getDate() + 1);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) wdCount++;
    }
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dateStr = `${monthNames[d.getMonth()]} ${d.getDate()}`;
    document.getElementById('daysWorkedSub').textContent =
      `of ${WORKING_DAYS} working days — war "paid off" around ${dateStr}`;
  } else if (salary > 0) {
    document.getElementById('daysWorkedSub').textContent = `of ${WORKING_DAYS} working days per year`;
  } else {
    document.getElementById('daysWorked').textContent = '—';
    document.getElementById('daysWorkedSub').textContent = `of ${WORKING_DAYS} working days per year`;
  }

  document.getElementById('compare25').textContent = fmtDollar(defense25);
  document.getElementById('compare26').textContent = fmtDollar(defense26);

  document.getElementById('viz-year-label').textContent = `FY ${year}`;
  document.getElementById('bracket-year-label').textContent = year;

  flashEl('totalTax');
  flashEl('defenseDollars');
  flashEl('daysWorked');
  flashEl('compare25');
  flashEl('compare26');

  animateBars(year);
  renderAnalogies(defenseDollars);
  renderBrackets(salary, filing, year, breakdown);
}

function setSalary(v) {
  document.getElementById('salary').value = v;
  update();
}

function setYear(y) {
  currentYear = y;
  document.getElementById('btn2025').classList.toggle('active', y === 2025);
  document.getElementById('btn2026').classList.toggle('active', y === 2026);
  update();
}

// ── INIT ──────────────────────────────────────────────────────────────────────

document.getElementById('salary').addEventListener('input', update);
document.getElementById('filing').addEventListener('change', update);

// Initial render
update();

// Animate bars in after short delay
setTimeout(() => animateBars(2025), 400);
