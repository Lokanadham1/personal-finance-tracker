import {
  OrderEntity,
  OrderExpenseEntity,
  BusinessInvestmentEntity,
  OrderStatus,
  OrderExpenseType,
} from '../types';

export interface ValidatedRow<T> {
  rowNumber: number;
  data: T;
  raw: Record<string, string>;
}

export interface InvalidRow {
  rowNumber: number;
  raw: Record<string, string>;
  errors: string[];
}

export interface ParseSectionResult<T> {
  scope: 'orders' | 'expenses' | 'investments';
  totalRows: number;
  validRows: ValidatedRow<T>[];
  invalidRows: InvalidRow[];
}

export interface BusinessImportPreview {
  filename: string;
  scope: 'orders' | 'expenses' | 'investments' | 'all';
  ordersResult?: ParseSectionResult<OrderEntity>;
  expensesResult?: ParseSectionResult<OrderExpenseEntity>;
  investmentsResult?: ParseSectionResult<BusinessInvestmentEntity>;
  totalValidCount: number;
  totalInvalidCount: number;
}

/**
 * Standard RFC 4180 compliant CSV parser.
 * Handles escaped quotes (""), commas inside quotes, multiline cells, and removes UTF-8 BOM.
 */
export function parseCsvRows(text: string): string[][] {
  // Strip BOM if present
  let cleanText = text.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i += 2;
          continue;
        } else {
          // End of quoted cell
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i += 2;
        } else {
          i++;
        }
        currentRow.push(currentCell.trim());
        currentCell = '';
        if (currentRow.some((c) => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        continue;
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        currentCell = '';
        if (currentRow.some((c) => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    }
  }

  // Push last cell & row if remaining
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes user date string (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, etc.) to standard YYYY-MM-DD
 */
export function normalizeDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // 1. Check ISO YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    if (y >= 2000 && y <= 2100 && parseInt(m, 10) >= 1 && parseInt(m, 10) <= 12 && parseInt(d, 10) >= 1 && parseInt(d, 10) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // 2. Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
    const m = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
    const y = parseInt(dmyMatch[3], 10);
    if (y >= 2000 && y <= 2100 && parseInt(m, 10) >= 1 && parseInt(m, 10) <= 12 && parseInt(d, 10) >= 1 && parseInt(d, 10) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // 3. Fallback to JavaScript Date parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    if (y >= 2000 && y <= 2100) {
      return `${y}-${m}-${d}`;
    }
  }

  return null;
}

/**
 * Normalizes number/amount string (removes currency symbols, commas, spaces)
 */
export function normalizeNumber(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;

  const cleaned = String(val)
    .replace(/[₹$,]/g, '')
    .replace(/\s+/g, '')
    .trim();

  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Normalizes OrderStatus
 */
export function normalizeOrderStatus(statusStr: string | undefined): OrderStatus {
  if (!statusStr) return 'Pending';
  const s = statusStr.trim().toLowerCase();
  if (s.includes('progress') || s.includes('working') || s.includes('prep')) return 'In Progress';
  if (s.includes('complete') || s.includes('done') || s.includes('ready')) return 'Completed';
  if (s.includes('deliver') || s.includes('dispatched')) return 'Delivered';
  return 'Pending';
}

/**
 * Normalizes OrderExpenseType
 */
export function normalizeExpenseType(typeStr: string | undefined): OrderExpenseType {
  if (!typeStr) return 'Groceries / Raw Materials';
  const t = typeStr.trim().toLowerCase();
  if (t.includes('groc') || t.includes('raw') || t.includes('material') || t.includes('food') || t.includes('ingredient')) {
    return 'Groceries / Raw Materials';
  }
  if (t.includes('pack') || t.includes('box') || t.includes('cover') || t.includes('container')) {
    return 'Packaging';
  }
  if (t.includes('deliv') || t.includes('transport') || t.includes('tempo') || t.includes('fuel') || t.includes('travel')) {
    return 'Delivery';
  }
  return 'Other';
}

/**
 * Helper to match header column indices flexibly
 */
function findHeaderIndex(headers: string[], patterns: RegExp[]): number {
  return headers.findIndex((h) => {
    const clean = h.toLowerCase().trim();
    return patterns.some((p) => p.test(clean));
  });
}

/**
 * Automatically detects whether CSV rows belong to orders, expenses, investments, or combined all
 */
export function detectCsvScope(rows: string[][]): 'orders' | 'expenses' | 'investments' | 'all' {
  if (rows.length === 0) return 'orders';

  // Check for combined markers in any of the first 25 rows
  const textSample = rows.slice(0, 25).map((r) => r.join(' ')).join('\n').toLowerCase();
  if (
    (textSample.includes('orders ledger') && textSample.includes('expenses ledger')) ||
    textSample.includes('business tracker report summary') ||
    textSample.includes('=== 1. orders')
  ) {
    return 'all';
  }

  // Find header row (first non-empty row not starting with === or ---)
  const headerRow = rows.find((r) => r.some((c) => c && !c.startsWith('===') && !c.startsWith('---')));
  if (!headerRow) return 'orders';

  const cleanHeaders = headerRow.map((c) => c.toLowerCase().trim());

  // Check Orders indicators
  const hasCustomer = cleanHeaders.some((h) => h.includes('customer') || h.includes('client'));
  const hasOrderDate = cleanHeaders.some((h) => h.includes('order date') || h.includes('order_date'));
  const hasItem = cleanHeaders.some((h) => h.includes('item') || h.includes('product') || h.includes('menu'));
  const hasOrderPrice = cleanHeaders.some((h) => h.includes('order price') || h.includes('order_price') || h.includes('price'));

  if ((hasCustomer && hasItem) || (hasCustomer && hasOrderPrice) || (hasItem && hasOrderDate)) {
    return 'orders';
  }

  // Check Expenses indicators
  const hasExpenseType = cleanHeaders.some((h) => h.includes('expense type') || h.includes('expense_type'));
  const hasOrderRef = cleanHeaders.some((h) => h.includes('order reference') || h.includes('order ref') || h.includes('linked order'));
  if (hasExpenseType || (hasOrderRef && cleanHeaders.some((h) => h.includes('amount')))) {
    return 'expenses';
  }

  // Check Investments indicators
  const hasPurpose = cleanHeaders.some((h) => h.includes('purpose') || h.includes('asset') || h.includes('equipment'));
  const hasInvestmentId = cleanHeaders.some((h) => h.includes('investment id') || h.includes('investment'));
  if (hasPurpose || hasInvestmentId) {
    return 'investments';
  }

  // Fallback checks
  if (cleanHeaders.some((h) => h.includes('expense'))) return 'expenses';
  if (cleanHeaders.some((h) => h.includes('investment'))) return 'investments';

  return 'orders';
}

/**
 * Validates and parses Orders rows
 */
export function parseOrdersRows(rows: string[][], startRowIndex: number = 0): ParseSectionResult<OrderEntity> {
  const result: ParseSectionResult<OrderEntity> = {
    scope: 'orders',
    totalRows: 0,
    validRows: [],
    invalidRows: [],
  };

  if (rows.length === 0) return result;

  // Header matching
  const headers = rows[0];
  const idxCustomer = findHeaderIndex(headers, [/customer.*name/, /^customer$/, /^client$/, /^name$/]);
  const idxDate = findHeaderIndex(headers, [/order.*date/, /^date$/]);
  const idxItem = findHeaderIndex(headers, [/item.*details/, /item\/product/, /^item$/, /^product$/, /^items$/, /^menu$/]);
  const idxQty = findHeaderIndex(headers, [/^quantity$/, /^qty$/, /^count$/, /^plates$/]);
  const idxPrice = findHeaderIndex(headers, [/order.*price/, /^price$/, /^amount/, /^rate$/, /^total$/]);
  const idxStatus = findHeaderIndex(headers, [/^status$/, /order.*status/]);
  const idxNotes = findHeaderIndex(headers, [/notes/, /remark/, /description/, /comment/]);
  const idxId = findHeaderIndex(headers, [/order.*id/, /^id$/]);

  const dataRows = rows.slice(1);
  result.totalRows = dataRows.length;

  dataRows.forEach((row, index) => {
    const rowNum = startRowIndex + index + 2; // +1 for 0-indexed, +1 for header

    // Skip summary or divider rows
    const firstCell = (row[0] || '').trim();
    if (firstCell.startsWith('---') || firstCell.startsWith('===') || firstCell.toLowerCase().includes('total')) {
      return;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((h, i) => {
      rowObj[h || `Column ${i + 1}`] = row[i] || '';
    });

    const errors: string[] = [];

    // Customer Name
    const customer = (idxCustomer >= 0 ? row[idxCustomer] : row[0])?.trim() || '';
    if (!customer) {
      errors.push('Customer Name is required');
    }

    // Item / Product
    const item = (idxItem >= 0 ? row[idxItem] : row[2])?.trim() || '';
    if (!item) {
      errors.push('Item/Product details is required');
    }

    // Price
    const rawPrice = idxPrice >= 0 ? row[idxPrice] : row[4];
    const priceNum = normalizeNumber(rawPrice);
    if (priceNum === null || priceNum < 0) {
      errors.push('Order Price must be a valid non-negative number');
    }

    // Order Date
    const rawDate = idxDate >= 0 ? row[idxDate] : row[1];
    const validDate = normalizeDate(rawDate) || new Date().toISOString().split('T')[0];
    if (rawDate && !normalizeDate(rawDate)) {
      errors.push(`Invalid date format "${rawDate}" (expected YYYY-MM-DD or DD/MM/YYYY)`);
    }

    // Quantity
    const qty = (idxQty >= 0 ? row[idxQty] : row[3])?.trim() || '1';

    // Status
    const rawStatus = idxStatus >= 0 ? row[idxStatus] : row[5];
    const status = normalizeOrderStatus(rawStatus);

    // Notes
    const notes = idxNotes >= 0 ? row[idxNotes]?.trim() : '';

    // ID
    const explicitId = idxId >= 0 ? row[idxId]?.trim() : '';
    const uniqueId = explicitId || `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (errors.length > 0) {
      result.invalidRows.push({
        rowNumber: rowNum,
        raw: rowObj,
        errors,
      });
    } else {
      result.validRows.push({
        rowNumber: rowNum,
        raw: rowObj,
        data: {
          id: uniqueId,
          customerName: customer,
          orderDate: validDate,
          itemDetails: item,
          quantity: qty,
          orderPrice: priceNum || 0,
          orderStatus: status,
          notes: notes || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });
    }
  });

  return result;
}

/**
 * Validates and parses Expenses rows
 */
export function parseExpensesRows(
  rows: string[][],
  existingOrders: OrderEntity[] = [],
  startRowIndex: number = 0
): ParseSectionResult<OrderExpenseEntity> {
  const result: ParseSectionResult<OrderExpenseEntity> = {
    scope: 'expenses',
    totalRows: 0,
    validRows: [],
    invalidRows: [],
  };

  if (rows.length === 0) return result;

  const headers = rows[0];
  const idxRef = findHeaderIndex(headers, [/order.*ref/, /linked.*order/, /order.*id/, /customer/]);
  const idxType = findHeaderIndex(headers, [/expense.*type/, /^category$/, /^type$/]);
  const idxAmount = findHeaderIndex(headers, [/^amount/, /^cost$/, /^price$/]);
  const idxDate = findHeaderIndex(headers, [/date/]);
  const idxNotes = findHeaderIndex(headers, [/notes/, /remark/, /description/, /details/]);
  const idxId = findHeaderIndex(headers, [/expense.*id/, /^id$/]);

  const dataRows = rows.slice(1);
  result.totalRows = dataRows.length;

  dataRows.forEach((row, index) => {
    const rowNum = startRowIndex + index + 2;

    const firstCell = (row[0] || '').trim();
    if (firstCell.startsWith('---') || firstCell.startsWith('===') || firstCell.toLowerCase().includes('total')) {
      return;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((h, i) => {
      rowObj[h || `Column ${i + 1}`] = row[i] || '';
    });

    const errors: string[] = [];

    // Amount
    const rawAmount = idxAmount >= 0 ? row[idxAmount] : row[2];
    const amountNum = normalizeNumber(rawAmount);
    if (amountNum === null || amountNum <= 0) {
      errors.push('Amount must be a valid number greater than 0');
    }

    // Date
    const rawDate = idxDate >= 0 ? row[idxDate] : row[3];
    const validDate = normalizeDate(rawDate) || new Date().toISOString().split('T')[0];
    if (rawDate && !normalizeDate(rawDate)) {
      errors.push(`Invalid date format "${rawDate}" (expected YYYY-MM-DD or DD/MM/YYYY)`);
    }

    // Expense Type
    const rawType = idxType >= 0 ? row[idxType] : row[1];
    const expenseType = normalizeExpenseType(rawType);

    // Order Reference
    const orderRefRaw = (idxRef >= 0 ? row[idxRef] : row[0])?.trim() || '';
    let linkedOrderId = '';

    if (orderRefRaw) {
      // 1. Check if matches existing order ID
      const matchedById = existingOrders.find((o) => o.id.toLowerCase() === orderRefRaw.toLowerCase());
      if (matchedById) {
        linkedOrderId = matchedById.id;
      } else {
        // 2. Check if matches customer name
        const matchedByName = existingOrders.find((o) =>
          o.customerName.toLowerCase().includes(orderRefRaw.toLowerCase())
        );
        if (matchedByName) {
          linkedOrderId = matchedByName.id;
        } else {
          // If orders exist, link to first or use raw as reference
          linkedOrderId = existingOrders.length > 0 ? existingOrders[0].id : orderRefRaw;
        }
      }
    } else {
      if (existingOrders.length > 0) {
        linkedOrderId = existingOrders[0].id;
      } else {
        linkedOrderId = 'ord-general';
      }
    }

    // Notes
    const notes = idxNotes >= 0 ? row[idxNotes]?.trim() : '';

    // ID
    const explicitId = idxId >= 0 ? row[idxId]?.trim() : '';
    const uniqueId = explicitId || `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (errors.length > 0) {
      result.invalidRows.push({
        rowNumber: rowNum,
        raw: rowObj,
        errors,
      });
    } else {
      result.validRows.push({
        rowNumber: rowNum,
        raw: rowObj,
        data: {
          id: uniqueId,
          orderId: linkedOrderId,
          expenseType,
          amount: amountNum || 0,
          date: validDate,
          notes: notes || (orderRefRaw && orderRefRaw !== linkedOrderId ? `Ref: ${orderRefRaw}` : undefined),
          createdAt: Date.now(),
        },
      });
    }
  });

  return result;
}

/**
 * Validates and parses Investments rows
 */
export function parseInvestmentsRows(
  rows: string[][],
  startRowIndex: number = 0
): ParseSectionResult<BusinessInvestmentEntity> {
  const result: ParseSectionResult<BusinessInvestmentEntity> = {
    scope: 'investments',
    totalRows: 0,
    validRows: [],
    invalidRows: [],
  };

  if (rows.length === 0) return result;

  const headers = rows[0];
  const idxAmount = findHeaderIndex(headers, [/^amount/, /^cost$/, /^investment.*amount/, /^price$/]);
  const idxDate = findHeaderIndex(headers, [/date/]);
  const idxPurpose = findHeaderIndex(headers, [/purpose/, /asset/, /equipment/, /description/, /item/]);
  const idxNotes = findHeaderIndex(headers, [/notes/, /remark/, /comment/]);
  const idxId = findHeaderIndex(headers, [/investment.*id/, /^id$/]);

  const dataRows = rows.slice(1);
  result.totalRows = dataRows.length;

  dataRows.forEach((row, index) => {
    const rowNum = startRowIndex + index + 2;

    const firstCell = (row[0] || '').trim();
    if (firstCell.startsWith('---') || firstCell.startsWith('===') || firstCell.toLowerCase().includes('total')) {
      return;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((h, i) => {
      rowObj[h || `Column ${i + 1}`] = row[i] || '';
    });

    const errors: string[] = [];

    // Amount
    const rawAmount = idxAmount >= 0 ? row[idxAmount] : row[0];
    const amountNum = normalizeNumber(rawAmount);
    if (amountNum === null || amountNum <= 0) {
      errors.push('Amount must be a valid number greater than 0');
    }

    // Purpose / Description
    const purpose = (idxPurpose >= 0 ? row[idxPurpose] : row[2])?.trim() || '';
    if (!purpose) {
      errors.push('Purpose/Description is required');
    }

    // Date
    const rawDate = idxDate >= 0 ? row[idxDate] : row[1];
    const validDate = normalizeDate(rawDate) || new Date().toISOString().split('T')[0];
    if (rawDate && !normalizeDate(rawDate)) {
      errors.push(`Invalid date format "${rawDate}" (expected YYYY-MM-DD or DD/MM/YYYY)`);
    }

    // Notes
    const notes = idxNotes >= 0 ? row[idxNotes]?.trim() : '';

    // ID
    const explicitId = idxId >= 0 ? row[idxId]?.trim() : '';
    const uniqueId = explicitId || `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (errors.length > 0) {
      result.invalidRows.push({
        rowNumber: rowNum,
        raw: rowObj,
        errors,
      });
    } else {
      result.validRows.push({
        rowNumber: rowNum,
        raw: rowObj,
        data: {
          id: uniqueId,
          amount: amountNum || 0,
          date: validDate,
          purpose,
          notes: notes || undefined,
          createdAt: Date.now(),
        },
      });
    }
  });

  return result;
}

/**
 * Full CSV Import Parser that analyzes CSV text and produces a preview breakdown
 */
export function parseAndValidateBusinessCsv(
  csvText: string,
  filename: string,
  targetScope: 'auto' | 'orders' | 'expenses' | 'investments' = 'auto',
  existingOrders: OrderEntity[] = []
): BusinessImportPreview {
  const allRows = parseCsvRows(csvText);

  // If combined file (has sections like === 1. ORDERS, === 2. EXPENSES, === 3. INVESTMENTS)
  const isCombined =
    targetScope === 'auto' &&
    allRows.some((r) => r.some((c) => c.includes('=== 1. ORDERS') || c.includes('=== 2. ORDER EXPENSES')));

  if (isCombined) {
    let orderRows: string[][] = [];
    let expenseRows: string[][] = [];
    let investmentRows: string[][] = [];
    let currentSection: 'none' | 'orders' | 'expenses' | 'investments' = 'none';

    allRows.forEach((row) => {
      const lineStr = row.join(' ').toLowerCase();
      if (lineStr.includes('orders ledger') || lineStr.includes('=== 1. orders')) {
        currentSection = 'orders';
        return;
      } else if (lineStr.includes('order expenses ledger') || lineStr.includes('=== 2. order expenses')) {
        currentSection = 'expenses';
        return;
      } else if (lineStr.includes('capital investments') || lineStr.includes('=== 3. capital investments')) {
        currentSection = 'investments';
        return;
      }

      if (currentSection === 'orders') orderRows.push(row);
      else if (currentSection === 'expenses') expenseRows.push(row);
      else if (currentSection === 'investments') investmentRows.push(row);
    });

    const ordersRes = orderRows.length > 0 ? parseOrdersRows(orderRows) : undefined;
    const expensesRes = expenseRows.length > 0 ? parseExpensesRows(expenseRows, existingOrders) : undefined;
    const investmentsRes = investmentRows.length > 0 ? parseInvestmentsRows(investmentRows) : undefined;

    const totalValid =
      (ordersRes?.validRows.length || 0) +
      (expensesRes?.validRows.length || 0) +
      (investmentsRes?.validRows.length || 0);

    const totalInvalid =
      (ordersRes?.invalidRows.length || 0) +
      (expensesRes?.invalidRows.length || 0) +
      (investmentsRes?.invalidRows.length || 0);

    return {
      filename,
      scope: 'all',
      ordersResult: ordersRes,
      expensesResult: expensesRes,
      investmentsResult: investmentsRes,
      totalValidCount: totalValid,
      totalInvalidCount: totalInvalid,
    };
  }

  // Single section parsing
  const resolvedScope = targetScope === 'auto' ? detectCsvScope(allRows) : targetScope;

  if (resolvedScope === 'orders') {
    const res = parseOrdersRows(allRows);
    return {
      filename,
      scope: 'orders',
      ordersResult: res,
      totalValidCount: res.validRows.length,
      totalInvalidCount: res.invalidRows.length,
    };
  } else if (resolvedScope === 'expenses') {
    const res = parseExpensesRows(allRows, existingOrders);
    return {
      filename,
      scope: 'expenses',
      expensesResult: res,
      totalValidCount: res.validRows.length,
      totalInvalidCount: res.invalidRows.length,
    };
  } else {
    const res = parseInvestmentsRows(allRows);
    return {
      filename,
      scope: 'investments',
      investmentsResult: res,
      totalValidCount: res.validRows.length,
      totalInvalidCount: res.invalidRows.length,
    };
  }
}
