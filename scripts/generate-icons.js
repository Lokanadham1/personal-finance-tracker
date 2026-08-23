import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = path.resolve('public/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

// Generate 192x192 PNG
await sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile(path.resolve('public/icon-192.png'));
console.log('Created public/icon-192.png');

// Generate 512x512 PNG
await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile(path.resolve('public/icon-512.png'));
console.log('Created public/icon-512.png');

// Generate maskable icon (with safe margin for adaptive icons)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#005cb2"/>
  <circle cx="256" cy="256" r="160" fill="#003566"/>
  <path d="M210 160 H302 M210 195 H285 M210 160 V225 C240 225 265 225 272 205 C280 175 250 160 250 160 M210 225 H245 L300 335 M210 225 H185" stroke="#ffffff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M335 145 L341 163 L359 169 L341 175 L335 193 L329 175 L311 169 L329 163 Z" fill="#38bdf8"/>
</svg>
`;

await sharp(Buffer.from(maskableSvg))
  .resize(192, 192)
  .png()
  .toFile(path.resolve('public/icon-maskable-192.png'));

await sharp(Buffer.from(maskableSvg))
  .resize(512, 512)
  .png()
  .toFile(path.resolve('public/icon-maskable-512.png'));
console.log('Created maskable icons');

// Generate mobile screenshot (1080x1920)
const mobileScreenshotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <rect width="1080" height="1920" fill="#fdfcff"/>
  <!-- Status bar -->
  <rect width="1080" height="70" fill="#005cb2"/>
  <text x="50" y="45" fill="#ffffff" font-family="sans-serif" font-size="28" font-weight="bold">12:30</text>
  <text x="960" y="45" fill="#ffffff" font-family="sans-serif" font-size="28">100%</text>
  
  <!-- App Header -->
  <rect y="70" width="1080" height="140" fill="#ffffff"/>
  <rect x="50" y="95" width="90" height="90" rx="24" fill="#005cb2"/>
  <text x="80" y="152" fill="#ffffff" font-family="sans-serif" font-size="48" font-weight="bold">₹</text>
  <text x="165" y="135" fill="#1a1c1e" font-family="sans-serif" font-size="40" font-weight="bold">Money Mitra</text>
  <text x="165" y="175" fill="#74777f" font-family="sans-serif" font-size="26">Personal offline finance dashboard</text>

  <!-- Total Balance Card -->
  <rect x="50" y="240" width="980" height="340" rx="36" fill="#005cb2"/>
  <text x="90" y="310" fill="#a5c8ff" font-family="sans-serif" font-size="32">Total Available Balance</text>
  <text x="90" y="410" fill="#ffffff" font-family="sans-serif" font-size="76" font-weight="bold">₹ 52,450.00</text>
  <rect x="90" y="460" width="410" height="85" rx="20" fill="#003566"/>
  <text x="120" y="515" fill="#4ade80" font-family="sans-serif" font-size="28" font-weight="bold">+ ₹ 75,000 Income</text>
  <rect x="520" y="460" width="470" height="85" rx="20" fill="#003566"/>
  <text x="550" y="515" fill="#f87171" font-family="sans-serif" font-size="28" font-weight="bold">- ₹ 22,550 Expenses</text>

  <!-- Feature Quick Actions -->
  <rect x="50" y="610" width="475" height="120" rx="24" fill="#e8def8"/>
  <text x="190" y="682" fill="#1d192b" font-family="sans-serif" font-size="30" font-weight="bold">+ Add Income</text>
  <rect x="555" y="610" width="475" height="120" rx="24" fill="#fce8e6"/>
  <text x="690" y="682" fill="#410002" font-family="sans-serif" font-size="30" font-weight="bold">- Add Expense</text>

  <!-- Spending Chart Card -->
  <rect x="50" y="760" width="980" height="480" rx="32" fill="#ffffff" stroke="#e1e2e8" stroke-width="3"/>
  <text x="90" y="825" fill="#1a1c1e" font-family="sans-serif" font-size="34" font-weight="bold">Monthly Spending Breakdown</text>
  
  <rect x="90" y="870" width="300" height="40" rx="10" fill="#f59e0b"/>
  <text x="410" y="900" fill="#1a1c1e" font-family="sans-serif" font-size="28">Groceries &amp; Food (₹ 8,500)</text>
  
  <rect x="90" y="930" width="220" height="40" rx="10" fill="#3b82f6"/>
  <text x="330" y="960" fill="#1a1c1e" font-family="sans-serif" font-size="28">Utilities &amp; Bills (₹ 6,200)</text>

  <rect x="90" y="990" width="160" height="40" rx="10" fill="#10b981"/>
  <text x="270" y="1020" fill="#1a1c1e" font-family="sans-serif" font-size="28">Transportation (₹ 4,300)</text>
  
  <rect x="90" y="1050" width="110" height="40" rx="10" fill="#8b5cf6"/>
  <text x="220" y="1080" fill="#1a1c1e" font-family="sans-serif" font-size="28">Entertainment (₹ 3,550)</text>

  <!-- Recent Transactions Card -->
  <rect x="50" y="1270" width="980" height="480" rx="32" fill="#ffffff" stroke="#e1e2e8" stroke-width="3"/>
  <text x="90" y="1335" fill="#1a1c1e" font-family="sans-serif" font-size="34" font-weight="bold">Recent Room DB Transactions</text>

  <circle cx="120" cy="1410" r="30" fill="#e0f2fe"/>
  <text x="175" y="1405" fill="#1a1c1e" font-family="sans-serif" font-size="30" font-weight="bold">Supermarket Grocery</text>
  <text x="175" y="1440" fill="#74777f" font-family="sans-serif" font-size="24">Food &amp; Dining • Today</text>
  <text x="830" y="1420" fill="#dc2626" font-family="sans-serif" font-size="32" font-weight="bold">- ₹ 1,450</text>

  <circle cx="120" cy="1520" r="30" fill="#dcfce7"/>
  <text x="175" y="1515" fill="#1a1c1e" font-family="sans-serif" font-size="30" font-weight="bold">Monthly Salary Credit</text>
  <text x="175" y="1550" fill="#74777f" font-family="sans-serif" font-size="24">Salary &amp; Income • Yesterday</text>
  <text x="810" y="1530" fill="#16a34a" font-family="sans-serif" font-size="32" font-weight="bold">+ ₹ 75,000</text>

  <circle cx="120" cy="1630" r="30" fill="#fef3c7"/>
  <text x="175" y="1625" fill="#1a1c1e" font-family="sans-serif" font-size="30" font-weight="bold">Electricity Bill Payment</text>
  <text x="175" y="1660" fill="#74777f" font-family="sans-serif" font-size="24">Utilities • 20 Aug</text>
  <text x="830" y="1640" fill="#dc2626" font-family="sans-serif" font-size="32" font-weight="bold">- ₹ 2,300</text>

  <!-- Bottom Navigation Bar -->
  <rect y="1770" width="1080" height="150" fill="#f0f4f9" stroke="#e1e2e8" stroke-width="2"/>
  <text x="100" y="1855" fill="#005cb2" font-family="sans-serif" font-size="28" font-weight="bold">● Home</text>
  <text x="320" y="1855" fill="#74777f" font-family="sans-serif" font-size="28">Transactions</text>
  <text x="600" y="1855" fill="#74777f" font-family="sans-serif" font-size="28">+ Add</text>
  <text x="820" y="1855" fill="#74777f" font-family="sans-serif" font-size="28">Categories</text>
</svg>
`;

await sharp(Buffer.from(mobileScreenshotSvg))
  .resize(1080, 1920)
  .png()
  .toFile(path.resolve('public/screenshot-mobile.png'));
console.log('Created public/screenshot-mobile.png');

// Generate desktop/wide screenshot (1920x1080)
const desktopScreenshotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <rect width="1920" height="1080" fill="#f0f4f9"/>
  
  <!-- App Top Bar -->
  <rect width="1920" height="80" fill="#ffffff" stroke="#e1e2e8" stroke-width="2"/>
  <rect x="60" y="15" width="50" height="50" rx="14" fill="#005cb2"/>
  <text x="75" y="50" fill="#ffffff" font-family="sans-serif" font-size="30" font-weight="bold">₹</text>
  <text x="125" y="45" fill="#1a1c1e" font-family="sans-serif" font-size="26" font-weight="bold">Money Mitra</text>
  <text x="125" y="65" fill="#74777f" font-family="sans-serif" font-size="16">Android Personal Finance Tracker (Room DB)</text>

  <!-- Left Column -->
  <rect x="60" y="110" width="880" height="380" rx="28" fill="#005cb2"/>
  <text x="100" y="170" fill="#a5c8ff" font-family="sans-serif" font-size="26">Total Available Balance</text>
  <text x="100" y="270" fill="#ffffff" font-family="sans-serif" font-size="64" font-weight="bold">₹ 52,450.00</text>
  
  <rect x="100" y="320" width="370" height="120" rx="20" fill="#003566"/>
  <text x="130" y="365" fill="#93c5fd" font-family="sans-serif" font-size="20">Total Income</text>
  <text x="130" y="410" fill="#4ade80" font-family="sans-serif" font-size="32" font-weight="bold">+ ₹ 75,000.00</text>

  <rect x="490" y="320" width="410" height="120" rx="20" fill="#003566"/>
  <text x="520" y="365" fill="#fca5a5" font-family="sans-serif" font-size="20">Total Expenses</text>
  <text x="520" y="410" fill="#f87171" font-family="sans-serif" font-size="32" font-weight="bold">- ₹ 22,550.00</text>

  <!-- Spending Chart Card -->
  <rect x="60" y="520" width="880" height="500" rx="28" fill="#ffffff" stroke="#e1e2e8" stroke-width="2"/>
  <text x="100" y="580" fill="#1a1c1e" font-family="sans-serif" font-size="28" font-weight="bold">Category Breakdown &amp; Spending Distribution</text>
  <rect x="100" y="630" width="400" height="45" rx="12" fill="#f59e0b"/>
  <text x="520" y="662" fill="#1a1c1e" font-family="sans-serif" font-size="22">Food &amp; Dining (38% - ₹ 8,500)</text>
  <rect x="100" y="700" width="300" height="45" rx="12" fill="#3b82f6"/>
  <text x="420" y="732" fill="#1a1c1e" font-family="sans-serif" font-size="22">Utilities &amp; Housing (27% - ₹ 6,200)</text>
  <rect x="100" y="770" width="220" height="45" rx="12" fill="#10b981"/>
  <text x="340" y="802" fill="#1a1c1e" font-family="sans-serif" font-size="22">Transportation (19% - ₹ 4,300)</text>

  <!-- Right Column: Recent Transactions -->
  <rect x="980" y="110" width="880" height="910" rx="28" fill="#ffffff" stroke="#e1e2e8" stroke-width="2"/>
  <text x="1020" y="170" fill="#1a1c1e" font-family="sans-serif" font-size="28" font-weight="bold">Recent Transactions (Local SQLite Room)</text>
  
  <rect x="1020" y="210" width="800" height="110" rx="20" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  <text x="1050" y="260" fill="#1e293b" font-family="sans-serif" font-size="24" font-weight="bold">Grocery Store Order</text>
  <text x="1050" y="295" fill="#64748b" font-family="sans-serif" font-size="18">Food &amp; Dining • Today • Room DB Sync</text>
  <text x="1660" y="275" fill="#dc2626" font-family="sans-serif" font-size="26" font-weight="bold">- ₹ 1,450</text>

  <rect x="1020" y="340" width="800" height="110" rx="20" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  <text x="1050" y="390" fill="#1e293b" font-family="sans-serif" font-size="24" font-weight="bold">Monthly Client Retainer / Salary</text>
  <text x="1050" y="425" fill="#64748b" font-family="sans-serif" font-size="18">Salary &amp; Income • Yesterday</text>
  <text x="1640" y="405" fill="#16a34a" font-family="sans-serif" font-size="26" font-weight="bold">+ ₹ 75,000</text>

  <rect x="1020" y="470" width="800" height="110" rx="20" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  <text x="1050" y="520" fill="#1e293b" font-family="sans-serif" font-size="24" font-weight="bold">Electricity &amp; Internet Bill</text>
  <text x="1050" y="555" fill="#64748b" font-family="sans-serif" font-size="18">Utilities • 20 Aug</text>
  <text x="1660" y="535" fill="#dc2626" font-family="sans-serif" font-size="26" font-weight="bold">- ₹ 2,300</text>
</svg>
`;

await sharp(Buffer.from(desktopScreenshotSvg))
  .resize(1920, 1080)
  .png()
  .toFile(path.resolve('public/screenshot-desktop.png'));
console.log('Created public/screenshot-desktop.png');
