import { ExpenseCategory, IncomeSource, TransactionType } from '../types';

export interface ParsedVoiceCommand {
  type: TransactionType;
  amount: number | null;
  categoryOrSource: string;
  description: string;
  date: string;
  rawTranscript: string;
  confidence: number;
}

const EXPENSE_CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  Food: [
    'food', 'dinner', 'lunch', 'breakfast', 'snack', 'snacks', 'coffee', 'tea',
    'cafe', 'restaurant', 'meal', 'eating', 'burger', 'pizza', 'groceries', 'grocery',
    'swiggy', 'zomato', 'supermarket', 'fruits', 'vegetables', 'milk', 'bread', 'dining'
  ],
  Rent: [
    'rent', 'housing', 'lease', 'apartment', 'flat', 'landlord', 'room', 'hostel', 'pg', 'maintenance'
  ],
  Transport: [
    'transport', 'travel', 'taxi', 'cab', 'uber', 'ola', 'auto', 'rickshaw', 'metro',
    'bus', 'fuel', 'petrol', 'diesel', 'flight', 'train', 'commute', 'parking', 'toll',
    'bike', 'scooter', 'car'
  ],
  Shopping: [
    'shopping', 'clothes', 'amazon', 'flipkart', 'myntra', 'shoes', 'shirt', 'pants',
    'electronics', 'gadget', 'mall', 'store', 'purchase', 'dress', 'watch', 'book',
    'retail', 'items'
  ],
  Bills: [
    'bills', 'bill', 'electricity', 'power', 'water', 'wifi', 'internet', 'mobile',
    'phone', 'recharge', 'broadband', 'dth', 'gas', 'lpg', 'utility', 'utilities',
    'subscription', 'netflix', 'spotify', 'prime', 'insurance'
  ],
  Other: ['other', 'misc', 'miscellaneous', 'general'],
};

const INCOME_SOURCE_KEYWORDS: Record<IncomeSource, string[]> = {
  Salary: ['salary', 'paycheck', 'wages', 'job', 'payroll', 'company', 'office', 'monthly pay'],
  Freelance: ['freelance', 'freelancing', 'client', 'project', 'contract', 'gig', 'upwork', 'fiverr', 'consulting'],
  Investments: ['investment', 'investments', 'dividend', 'dividends', 'stocks', 'shares', 'mutual fund', 'crypto', 'returns', 'interest', 'trading'],
  Gift: ['gift', 'present', 'parents', 'mom', 'dad', 'friend', 'birthday', 'reward', 'cash gift', 'family'],
  Business: ['business', 'sales', 'revenue', 'store profit', 'shop', 'customer', 'clients', 'vendor payout'],
  Other: ['other', 'misc', 'income source', 'side gig'],
};

// Word number parser for common spoken numbers
const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000, lakh: 100000,
  crore: 10000000,
};

function parseSpokenWordsToNumber(text: string): number | null {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
  let total = 0;
  let current = 0;
  let hasNumber = false;

  for (const word of words) {
    if (/^\d+(\.\d+)?$/.test(word)) {
      current += parseFloat(word);
      hasNumber = true;
    } else if (WORD_NUMBERS[word] !== undefined) {
      hasNumber = true;
      const val = WORD_NUMBERS[word];
      if (val === 100) {
        current = current === 0 ? 100 : current * 100;
      } else if (val === 1000 || val === 100000 || val === 10000000) {
        current = current === 0 ? val : current * val;
        total += current;
        current = 0;
      } else {
        current += val;
      }
    }
  }

  total += current;
  return hasNumber && total > 0 ? total : null;
}

export function parseVoiceCommand(transcript: string): ParsedVoiceCommand {
  const rawTranscript = transcript.trim();
  const lower = rawTranscript.toLowerCase();

  // 1. Determine Type (INCOME vs EXPENSE)
  let type: TransactionType = 'EXPENSE';
  const incomeIndicators = [
    'income', 'received', 'got', 'earned', 'credited', 'salary', 'freelance',
    'dividend', 'bonus', 'gift from', 'deposit', 'cash from', 'made', 'paid to me'
  ];
  const expenseIndicators = [
    'spent', 'spend', 'paid', 'bought', 'cost', 'expense', 'purchased', 'gave',
    'charged', 'debited', 'bill for', 'for food', 'on food', 'for dinner', 'on dinner'
  ];

  let incomeScore = 0;
  let expenseScore = 0;

  for (const ind of incomeIndicators) {
    if (lower.includes(ind)) incomeScore += 2;
  }
  for (const ind of expenseIndicators) {
    if (lower.includes(ind)) expenseScore += 2;
  }

  if (incomeScore > expenseScore) {
    type = 'INCOME';
  } else {
    type = 'EXPENSE';
  }

  // 2. Extract Amount
  let amount: number | null = null;

  // Try regex for numbers with optional symbols like ₹, $, rs, inr, k
  const rupeeMatch = lower.match(/(?:₹|rs\.?|inr|rupees)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
  const numberAfterVerb = lower.match(/(?:spent|spend|paid|cost|received|got|add|amount|of)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
  const generalNumber = lower.match(/\b(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k\b|thousand\b|rupees\b|rs\b|inr\b)?/i);

  if (rupeeMatch && rupeeMatch[1]) {
    amount = parseFloat(rupeeMatch[1].replace(/,/g, ''));
  } else if (numberAfterVerb && numberAfterVerb[1]) {
    amount = parseFloat(numberAfterVerb[1].replace(/,/g, ''));
  } else if (generalNumber && generalNumber[1]) {
    let base = parseFloat(generalNumber[1].replace(/,/g, ''));
    if (lower.includes(`${generalNumber[1]}k`) || lower.includes(`${generalNumber[1]} k`)) {
      base *= 1000;
    }
    amount = base;
  }

  // Fallback to spoken words parser (e.g. "five hundred")
  if (!amount || isNaN(amount)) {
    const wordParsed = parseSpokenWordsToNumber(lower);
    if (wordParsed) amount = wordParsed;
  }

  // 3. Extract Category or Source
  let matchedCategoryOrSource = type === 'EXPENSE' ? 'Food' : 'Salary';
  let bestMatchCount = 0;

  if (type === 'EXPENSE') {
    for (const [catName, keywords] of Object.entries(EXPENSE_CATEGORY_KEYWORDS) as [ExpenseCategory, string[]][]) {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          matchedCategoryOrSource = catName;
          bestMatchCount++;
          break;
        }
      }
    }
    if (bestMatchCount === 0) {
      matchedCategoryOrSource = 'Food'; // Default standard expense
    }
  } else {
    for (const [srcName, keywords] of Object.entries(INCOME_SOURCE_KEYWORDS) as [IncomeSource, string[]][]) {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          matchedCategoryOrSource = srcName;
          bestMatchCount++;
          break;
        }
      }
    }
    if (bestMatchCount === 0) {
      matchedCategoryOrSource = 'Salary';
    }
  }

  // 4. Extract Date (Today vs Yesterday)
  const today = new Date();
  let date = today.toISOString().split('T')[0];
  if (lower.includes('yesterday')) {
    const yDay = new Date();
    yDay.setDate(yDay.getDate() - 1);
    date = yDay.toISOString().split('T')[0];
  }

  // 5. Generate / Clean Description
  // Clean out command keywords to leave the meaningful object / reason
  let cleanDesc = rawTranscript;
  const stripWords = [
    /^(please\s+)?(add\s+)?(a\s+)?(new\s+)?(transaction\s+)?(expense\s+)?(income\s+)?/i,
    /^(i\s+)?(have\s+)?(spent|spend|paid|bought|received|got|earned)\s+/i,
    /(today|yesterday|rupees|rs\.?|inr|for\s+food|for\s+rent|for\s+transport|for\s+shopping|for\s+bills)/gi,
    /\b\d+(\.\d+)?\b/g,
    /₹/g,
    /\s+/g,
  ];

  let extractedDesc = rawTranscript;
  // Specific pattern matcher: "Spent 500 on dinner for food" -> "Dinner"
  const onPattern = rawTranscript.match(/(?:on|for)\s+([a-zA-Z\s]+?)(?:\s+(?:for|in|category|under|date|yesterday|today|\d+)|$)/i);
  if (onPattern && onPattern[1] && onPattern[1].trim().length > 1) {
    extractedDesc = onPattern[1].trim();
  } else {
    // Basic cleanup
    extractedDesc = rawTranscript
      .replace(/^(spent|paid|received|got|add expense|add income)\s+/i, '')
      .replace(/\b\d+(\.\d+)?\b/g, '')
      .replace(/(rupees|rs|inr|today|yesterday)/gi, '')
      .trim();
  }

  // Capitalize first letter
  if (!extractedDesc || extractedDesc.length < 2) {
    extractedDesc = type === 'EXPENSE' ? `${matchedCategoryOrSource} expense` : `${matchedCategoryOrSource} income`;
  } else {
    extractedDesc = extractedDesc.charAt(0).toUpperCase() + extractedDesc.slice(1);
  }

  return {
    type,
    amount,
    categoryOrSource: matchedCategoryOrSource,
    description: extractedDesc,
    date,
    rawTranscript,
    confidence: amount ? 0.9 : 0.6,
  };
}
