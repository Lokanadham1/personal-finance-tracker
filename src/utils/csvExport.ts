import {
  TransactionEntity,
  OrderEntity,
  OrderExpenseEntity,
  BusinessInvestmentEntity,
} from '../types';

/**
 * Generates standards-compliant CSV string with UTF-8 BOM,
 * escaped quotes, formatted columns, and a balance summary footer.
 */
export function generateTransactionsCsv(
  transactions: TransactionEntity[],
  scopeLabel: string = 'Current'
): string {
  // Sort descending by date, then createdAt
  const sorted = [...transactions].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const headers = [
    'Transaction ID',
    'Type',
    'Category / Source',
    'Description',
    'Amount (INR)',
    'Date',
    'Timestamp',
  ];

  let totalIncome = 0;
  let totalExpense = 0;

  const rows = sorted.map((t) => {
    if (t.type === 'INCOME') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
    }

    const cleanDesc = (t.description || '').replace(/"/g, '""');
    const cleanCat = (t.category || '').replace(/"/g, '""');
    const cleanId = (t.id || '').replace(/"/g, '""');

    return [
      `"${cleanId}"`,
      t.type,
      `"${cleanCat}"`,
      `"${cleanDesc}"`,
      t.amount.toFixed(2),
      t.date,
      t.createdAt ? new Date(t.createdAt).toISOString() : t.date,
    ].join(',');
  });

  const netBalance = totalIncome - totalExpense;

  // Add Summary footer
  const summaryRows = [
    '',
    `"--- SUMMARY (${scopeLabel}) ---","","","","","",""`,
    `"Total Income Entries","INCOME","","","+${totalIncome.toFixed(2)}","",""`,
    `"Total Expense Entries","EXPENSE","","","-${totalExpense.toFixed(2)}","",""`,
    `"Net Balance","","","","${netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}","",""`,
    `"Export Timestamp","","","","","${new Date().toISOString()}",""`,
  ];

  // UTF-8 Byte Order Mark (\uFEFF) ensures Excel and Android spreadsheet apps
  // correctly parse UTF-8 encoding (including ₹ currency and multilingual characters)
  return '\uFEFF' + [headers.join(','), ...rows, ...summaryRows].join('\r\n');
}

/**
 * Generates a comprehensive, standards-compliant CSV for Business Orders, Expenses, and Investments.
 * Supports: 'all' (combined summary, orders, expenses, and investments), 'orders' (only orders),
 * 'expenses' (only expenses), or 'investments' (only investments).
 */
export function generateBusinessCsv(
  orders: OrderEntity[],
  expenses: OrderExpenseEntity[],
  investments: BusinessInvestmentEntity[] = [],
  scope: 'all' | 'orders' | 'expenses' | 'investments' = 'all'
): string {
  // Map expenses to order IDs for linked summaries
  const expenseMap = new Map<string, { total: number; count: number; items: OrderExpenseEntity[] }>();
  expenses.forEach((exp) => {
    const item = expenseMap.get(exp.orderId) || { total: 0, count: 0, items: [] };
    item.total += exp.amount;
    item.count += 1;
    item.items.push(exp);
    expenseMap.set(exp.orderId, item);
  });

  const orderMap = new Map<string, OrderEntity>();
  orders.forEach((ord) => orderMap.set(ord.id, ord));

  const totalGrossRevenue = orders.reduce((sum, o) => sum + (o.orderPrice || 0), 0);
  const totalAllExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalNetOrderProfit = totalGrossRevenue - totalAllExpenses;
  const totalInvestments = investments.reduce((sum, i) => sum + (i.amount || 0), 0);
  const netBusinessSurplus = totalNetOrderProfit - totalInvestments;

  const escapeCsv = (str: string | undefined | null) => `"${(str || '').replace(/"/g, '""')}"`;

  // 1. ORDERS TABLE - Headers: Customer Name, Order Date, Item/Product, Quantity, Order Price, Status, Notes, Order ID
  const orderHeaders = [
    'Customer Name',
    'Order Date',
    'Item/Product',
    'Quantity',
    'Order Price',
    'Status',
    'Order ID',
    'Notes',
  ];

  const orderRows = orders.map((ord) => {
    return [
      escapeCsv(ord.customerName),
      ord.orderDate,
      escapeCsv(ord.itemDetails),
      escapeCsv(ord.quantity),
      ord.orderPrice.toFixed(2),
      escapeCsv(ord.orderStatus),
      escapeCsv(ord.id),
      escapeCsv(ord.notes || ''),
    ].join(',');
  });

  // 2. EXPENSES TABLE - Headers: Order Reference, Expense Type, Amount, Date, Notes, Expense ID
  const expenseHeaders = [
    'Order Reference',
    'Expense Type',
    'Amount',
    'Date',
    'Notes',
    'Expense ID',
  ];

  const expenseRows = expenses.map((exp) => {
    const linkedOrder = orderMap.get(exp.orderId);
    const orderRef = linkedOrder ? `${linkedOrder.customerName} (${exp.orderId})` : exp.orderId;
    return [
      escapeCsv(orderRef),
      escapeCsv(exp.expenseType),
      exp.amount.toFixed(2),
      exp.date,
      escapeCsv(exp.notes || ''),
      escapeCsv(exp.id),
    ].join(',');
  });

  // 3. INVESTMENTS TABLE - Headers: Amount, Date, Purpose/Description, Notes, Investment ID
  const investmentHeaders = [
    'Amount',
    'Date',
    'Purpose/Description',
    'Notes',
    'Investment ID',
  ];

  const investmentRows = investments.map((inv) => [
    inv.amount.toFixed(2),
    inv.date,
    escapeCsv(inv.purpose),
    escapeCsv(inv.notes || ''),
    escapeCsv(inv.id),
  ].join(','));

  let resultLines: string[] = [];

  if (scope === 'orders') {
    resultLines = [
      orderHeaders.join(','),
      ...orderRows,
      '',
      `"--- ORDERS SUMMARY ---","","","","${totalGrossRevenue.toFixed(2)}","","",""`,
      `"Total Orders Count: ${orders.length}","","","","","","",""`,
      `"Export Date: ${new Date().toISOString()}","","","","","","",""`,
    ];
  } else if (scope === 'expenses') {
    resultLines = [
      expenseHeaders.join(','),
      ...expenseRows,
      '',
      `"--- EXPENSES SUMMARY ---","","${totalAllExpenses.toFixed(2)}","","",""`,
      `"Total Expenses Count: ${expenses.length}","","","","",""`,
      `"Export Date: ${new Date().toISOString()}","","","","",""`,
    ];
  } else if (scope === 'investments') {
    resultLines = [
      investmentHeaders.join(','),
      ...investmentRows,
      '',
      `"--- INVESTMENTS SUMMARY ---","${totalInvestments.toFixed(2)}","","",""`,
      `"Total Investments Count: ${investments.length}","","","",""`,
      `"Export Date: ${new Date().toISOString()}","","","",""`,
    ];
  } else {
    // Combined / Complete Business Report
    const summarySection = [
      `"=== BUSINESS TRACKER REPORT SUMMARY ===",""`,
      `"Report Scope","Complete Business Ledger (Orders, Expenses & Investments)"`,
      `"Export Timestamp","${new Date().toLocaleString()}"`,
      `"Total Orders Count","${orders.length}"`,
      `"Total Gross Orders Revenue (INR)","+${totalGrossRevenue.toFixed(2)}"`,
      `"Total Order Expenses (INR)","-${totalAllExpenses.toFixed(2)}"`,
      `"Net Order Profit (INR)","${totalNetOrderProfit >= 0 ? '+' : ''}${totalNetOrderProfit.toFixed(2)}"`,
      `"Capital Investments (INR)","${totalInvestments.toFixed(2)}"`,
      `"Overall Net Surplus / Profit (INR)","${netBusinessSurplus >= 0 ? '+' : ''}${netBusinessSurplus.toFixed(2)}"`,
      `""`,
    ];

    resultLines = [
      ...summarySection,
      `"=== 1. ORDERS LEDGER ===","","","","","","",""`,
      orderHeaders.join(','),
      ...orderRows,
      `"Subtotal Gross Orders","","","","${totalGrossRevenue.toFixed(2)}","","",""`,
      `""`,
      `"=== 2. ORDER EXPENSES LEDGER ===","","","","",""`,
      expenseHeaders.join(','),
      ...expenseRows,
      `"Subtotal Order Expenses","","${totalAllExpenses.toFixed(2)}","","",""`,
    ];

    if (investments.length > 0) {
      resultLines.push(
        `""`,
        `"=== 3. CAPITAL INVESTMENTS ===","","","",""`,
        investmentHeaders.join(','),
        ...investmentRows,
        `"Subtotal Capital Investments","${totalInvestments.toFixed(2)}","","",""`
      );
    }
  }

  // Prepend UTF-8 BOM so Excel & Android viewers render Unicode properly
  return '\uFEFF' + resultLines.join('\r\n');
}

export interface SaveCsvResult {
  success: boolean;
  filename: string;
  method: 'picker' | 'download' | 'share';
  message: string;
  count: number;
}

/**
 * Universal file saver that saves a CSV string via File System Access API or anchor download
 */
export async function saveCsvStringToAndroid(
  csvContent: string,
  filename: string,
  count: number = 0
): Promise<SaveCsvResult> {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // 1. Try modern File System Access API (Chromium Android & Desktop)
  if (typeof (window as any).showSaveFilePicker === 'function') {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'CSV Spreadsheet File',
            accept: {
              'text/csv': ['.csv'],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      return {
        success: true,
        filename,
        method: 'picker',
        message: `Saved ${filename} to selected directory`,
        count,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Export cancelled by user');
      }
      console.warn('File picker failed, falling back to download:', err);
    }
  }

  // 2. Standard Blob Download (universal across Android Chrome, WebViews, Edge, Safari)
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Cleanup after trigger
  setTimeout(() => {
    try {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, 1000);

  return {
    success: true,
    filename,
    method: 'download',
    message: `Saved ${filename} to Downloads folder`,
    count,
  };
}

/**
 * Checks if the Web Share API with files is supported on the current device
 */
export function isAndroidFileSharingSupported(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return false;
  }
  if (typeof navigator.canShare === 'function') {
    try {
      const testFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      return navigator.canShare({ files: [testFile] });
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Shares or saves CSV file directly via the Android native share sheet
 */
export async function shareCsvStringViaAndroid(
  csvContent: string,
  filename: string,
  title: string,
  shareText: string,
  count: number = 0
): Promise<SaveCsvResult> {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const file = new File([blob], filename, { type: 'text/csv' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text: shareText,
        files: [file],
      });

      return {
        success: true,
        filename,
        method: 'share',
        message: `Shared ${filename} via system share sheet`,
        count,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Share cancelled by user');
      }
      console.warn('Share API failed, falling back to download:', err);
    }
  }

  // Fallback to standard save
  return saveCsvStringToAndroid(csvContent, filename, count);
}

/**
 * Exports Personal Finance transactions to Android device file system
 */
export async function saveCsvToAndroidFileSystem(
  transactions: TransactionEntity[],
  filenamePrefix: string = 'finance-transactions',
  scopeLabel: string = 'Current'
): Promise<SaveCsvResult> {
  if (!transactions || transactions.length === 0) {
    throw new Error('No transactions available to export');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}-${dateStr}.csv`;
  const csvContent = generateTransactionsCsv(transactions, scopeLabel);

  return saveCsvStringToAndroid(csvContent, filename, transactions.length);
}

/**
 * Shares Personal Finance transactions CSV directly via Android native share sheet
 */
export async function shareCsvViaAndroid(
  transactions: TransactionEntity[],
  filenamePrefix: string = 'finance-transactions',
  scopeLabel: string = 'Current'
): Promise<SaveCsvResult> {
  if (!transactions || transactions.length === 0) {
    throw new Error('No transactions available to share');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}-${dateStr}.csv`;
  const csvContent = generateTransactionsCsv(transactions, scopeLabel);

  return shareCsvStringViaAndroid(
    csvContent,
    filename,
    'Exported Financial Transactions',
    `Money Mitra: Exported ${transactions.length} transactions as CSV (${scopeLabel})`,
    transactions.length
  );
}

/**
 * Exports Business Orders, Expenses, or Investments as CSV directly to the user's device
 */
export async function saveBusinessCsvToAndroid(
  orders: OrderEntity[],
  expenses: OrderExpenseEntity[],
  investments: BusinessInvestmentEntity[] = [],
  scope: 'all' | 'orders' | 'expenses' | 'investments' = 'all',
  filenamePrefix: string = 'business-data'
): Promise<SaveCsvResult> {
  const totalCount =
    scope === 'orders'
      ? orders.length
      : scope === 'expenses'
      ? expenses.length
      : scope === 'investments'
      ? investments.length
      : orders.length + expenses.length + investments.length;

  if (totalCount === 0) {
    throw new Error('No business records available to export');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}-${scope}-${dateStr}.csv`;
  const csvContent = generateBusinessCsv(orders, expenses, investments, scope);

  return saveCsvStringToAndroid(csvContent, filename, totalCount);
}

/**
 * Saves all 3 sections (Orders, Expenses, Investments) as separate CSV files
 */
export async function saveSeparateBusinessCsvFiles(
  orders: OrderEntity[],
  expenses: OrderExpenseEntity[],
  investments: BusinessInvestmentEntity[] = []
): Promise<{ success: boolean; filesSaved: number; message: string }> {
  let savedCount = 0;
  const dateStr = new Date().toISOString().split('T')[0];

  if (orders.length > 0) {
    const ordersCsv = generateBusinessCsv(orders, expenses, investments, 'orders');
    await saveCsvStringToAndroid(ordersCsv, `business-orders-${dateStr}.csv`, orders.length);
    savedCount++;
  }

  if (expenses.length > 0) {
    // Small delay between downloads so browser doesn't block multiple files
    await new Promise((resolve) => setTimeout(resolve, 350));
    const expensesCsv = generateBusinessCsv(orders, expenses, investments, 'expenses');
    await saveCsvStringToAndroid(expensesCsv, `business-expenses-${dateStr}.csv`, expenses.length);
    savedCount++;
  }

  if (investments.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const investmentsCsv = generateBusinessCsv(orders, expenses, investments, 'investments');
    await saveCsvStringToAndroid(investmentsCsv, `business-investments-${dateStr}.csv`, investments.length);
    savedCount++;
  }

  return {
    success: true,
    filesSaved: savedCount,
    message: `Exported ${savedCount} separate CSV files successfully!`,
  };
}

/**
 * Shares Business Orders and Expenses CSV via the Android native share sheet
 */
export async function shareBusinessCsvViaAndroid(
  orders: OrderEntity[],
  expenses: OrderExpenseEntity[],
  investments: BusinessInvestmentEntity[] = [],
  scope: 'all' | 'orders' | 'expenses' | 'investments' = 'all',
  filenamePrefix: string = 'business-data'
): Promise<SaveCsvResult> {
  const totalCount =
    scope === 'orders'
      ? orders.length
      : scope === 'expenses'
      ? expenses.length
      : scope === 'investments'
      ? investments.length
      : orders.length + expenses.length + investments.length;

  if (totalCount === 0) {
    throw new Error('No business records available to export');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}-${scope}-${dateStr}.csv`;
  const csvContent = generateBusinessCsv(orders, expenses, investments, scope);

  return shareCsvStringViaAndroid(
    csvContent,
    filename,
    'Business Ledger Report',
    `Money Mitra: Exported Business Data (${scope.toUpperCase()}) - ${orders.length} orders, ${expenses.length} expenses, ${investments.length} investments`,
    totalCount
  );
}
