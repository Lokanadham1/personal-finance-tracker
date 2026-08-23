export type Language = 'en' | 'te';

export interface Translations {
  // Navigation & Header
  appTitle: string;
  appSubtitle: string;
  navHome: string;
  navTransactions: string;
  navAddEntry: string;
  navBreakdown: string;
  kotlinSource: string;
  dbSettings: string;
  langToggleLabel: string;

  // Subtitles
  subHome: string;
  subTransactions: string;
  subAddEntry: string;
  subBreakdown: string;

  // Dashboard Stats
  statementPeriod: string;
  totalIncome: string;
  totalSpent: string;
  remainingBalance: string;
  netSurplus: string;
  netDeficit: string;
  budgetUtilization: string;
  savingsRate: string;
  ofIncomeSpent: string;
  warningBudgetHigh: string;
  warningBudgetOver: string;
  quickActions: string;
  recentTransactions: string;
  viewAll: string;
  noTransactionsMonth: string;
  logFirstEntry: string;
  pdfReport: string;
  quickDownloadPdf: string;
  prevMonth: string;
  nextMonth: string;

  // Transactions Screen
  searchPlaceholder: string;
  filterAll: string;
  filterIncome: string;
  filterExpense: string;
  allCategories: string;
  rangeThisMonth: string;
  rangeLastMonth: string;
  rangeAllTime: string;
  rangeCustom: string;
  startDate: string;
  endDate: string;
  exportCsv: string;
  swipeHint: string;
  noMatchingTransactions: string;
  tryAdjustingFilters: string;
  transactionDetails: string;
  itemizedLedger: string;
  description: string;
  amount: string;
  category: string;
  date: string;
  type: string;
  edit: string;
  delete: string;
  saveChanges: string;
  cancel: string;
  undo: string;
  deletedMsg: string;
  confirmDelete: string;

  // Add Entry Screen
  addIncomeTab: string;
  addExpenseTab: string;
  enterAmount: string;
  quickAmounts: string;
  expenseCategoryLabel: string;
  incomeSourceLabel: string;
  descPlaceholderExpense: string;
  descPlaceholderIncome: string;
  notesOptional: string;
  notesPlaceholder: string;
  today: string;
  yesterday: string;
  saveExpenseBtn: string;
  saveIncomeBtn: string;
  saving: string;
  amountRequiredError: string;

  // Categories
  catFood: string;
  catRent: string;
  catTransport: string;
  catShopping: string;
  catBills: string;
  catOther: string;

  // Sources
  srcSalary: string;
  srcFreelance: string;
  srcInvestments: string;
  srcGift: string;
  srcBusiness: string;
  srcOther: string;

  // Breakdown Screen
  spendingAnalytics: string;
  categoryBreakdownTitle: string;
  pieChartView: string;
  barChartView: string;
  totalExpensesAnalyzed: string;
  highestExpense: string;
  noExpenseData: string;
  noExpenseDataDesc: string;
  addExpenseNow: string;
  shareOfExpense: string;
  transactionsCount: string;

  // Voice Command Widget
  voiceTitle: string;
  aiVoiceBadge: string;
  voiceSubtitle: string;
  examples: string;
  listening: string;
  capturedCommand: string;
  tapMicToSpeak: string;
  samplePromptNotice: string;
  retry: string;
  parsedCommand: string;
  fillIntoForm: string;
  instantSave: string;
  quickTestCommands: string;

  // Settings Modal
  settingsTitle: string;
  settingsSubtitle: string;
  storageType: string;
  totalRecordsStored: string;
  exportCsvBtn: string;
  exportBackupBtn: string;
  importBackupBtn: string;
  resetSampleBtn: string;
  clearAllBtn: string;
  confirmClearMsg: string;
  closeBtn: string;

  // PDF Report Modal
  pdfModalTitle: string;
  financialStatement: string;
  totalEntriesCount: string;
  printReport: string;
  downloadPdfFile: string;
  downloadSuccess: string;

  // Android Mobile Free App Install
  androidFreeBadge: string;
  installAndroidBtn: string;
  installAndroidTitle: string;
  installAndroidSubtitle: string;
  androidInstallStep1: string;
  androidInstallStep1Desc: string;
  androidInstallStep2: string;
  androidInstallStep2Desc: string;
  androidInstallStep3: string;
  androidInstallStep3Desc: string;
  instant1TapInstall: string;
  instantInstallPromptNotice: string;
  scanQrCodeTitle: string;
  copyAppLink: string;
  linkCopied: string;
  shareViaApp: string;
  apkSourceCodeNotice: string;
  freeForeverNotice: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation & Header
    appTitle: 'Money Mitra',
    appSubtitle: 'Personal offline finance dashboard',
    navHome: 'Home',
    navTransactions: 'Transactions',
    navAddEntry: 'Add Entry',
    navBreakdown: 'Breakdown',
    kotlinSource: 'Kotlin Source',
    dbSettings: 'Database Settings',
    langToggleLabel: 'తెలుగు',

    // Subtitles
    subHome: 'Personal offline dashboard',
    subTransactions: 'total entries',
    subAddEntry: 'Save to local database',
    subBreakdown: 'Expense analytics',

    // Dashboard Stats
    statementPeriod: 'Statement Period',
    totalIncome: 'Total Income',
    totalSpent: 'Total Spent',
    remainingBalance: 'Remaining Balance',
    netSurplus: 'Net Surplus',
    netDeficit: 'Net Deficit',
    budgetUtilization: 'Budget Utilization',
    savingsRate: 'Savings Rate',
    ofIncomeSpent: 'of income spent this month',
    warningBudgetHigh: 'Caution: Approaching monthly income limit',
    warningBudgetOver: 'Alert: Monthly expenses exceed total income',
    quickActions: 'Quick Actions',
    recentTransactions: 'Recent Transactions',
    viewAll: 'View All',
    noTransactionsMonth: 'No transactions recorded for this month.',
    logFirstEntry: 'Log your first income or expense entry',
    pdfReport: 'PDF Report',
    quickDownloadPdf: 'Quick Download PDF',
    prevMonth: 'Previous Month',
    nextMonth: 'Next Month',

    // Transactions Screen
    searchPlaceholder: 'Search description, category, or ₹ amount...',
    filterAll: 'All',
    filterIncome: 'Income (+)',
    filterExpense: 'Expense (−)',
    allCategories: 'All Categories',
    rangeThisMonth: 'This Month',
    rangeLastMonth: 'Last Month',
    rangeAllTime: 'All Time',
    rangeCustom: 'Custom Range',
    startDate: 'Start Date',
    endDate: 'End Date',
    exportCsv: 'Export CSV',
    swipeHint: 'Swipe card left to delete • Tap for full details',
    noMatchingTransactions: 'No matching transactions found',
    tryAdjustingFilters: 'Try adjusting your search query, type filter, or date range.',
    transactionDetails: 'Transaction Details',
    itemizedLedger: 'Itemized Ledger',
    description: 'Description',
    amount: 'Amount',
    category: 'Category',
    date: 'Date',
    type: 'Type',
    edit: 'Edit',
    delete: 'Delete',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    undo: 'Undo',
    deletedMsg: 'Deleted',
    confirmDelete: 'Are you sure you want to delete this transaction?',

    // Add Entry Screen
    addIncomeTab: 'Income (+)',
    addExpenseTab: 'Expense (−)',
    enterAmount: 'Enter amount',
    quickAmounts: 'Quick amounts',
    expenseCategoryLabel: 'Expense Category',
    incomeSourceLabel: 'Income Source',
    descPlaceholderExpense: 'e.g. Grocery store, Uber cab, Dinner bill',
    descPlaceholderIncome: 'e.g. Monthly salary, Client invoice, Bonus',
    notesOptional: 'Notes (Optional)',
    notesPlaceholder: 'Add any additional notes or details...',
    today: 'Today',
    yesterday: 'Yesterday',
    saveExpenseBtn: 'Save Expense',
    saveIncomeBtn: 'Save Income',
    saving: 'Saving...',
    amountRequiredError: 'Please enter a valid amount greater than 0',

    // Categories
    catFood: 'Food',
    catRent: 'Rent',
    catTransport: 'Transport',
    catShopping: 'Shopping',
    catBills: 'Bills',
    catOther: 'Other',

    // Sources
    srcSalary: 'Salary',
    srcFreelance: 'Freelance',
    srcInvestments: 'Investments',
    srcGift: 'Gift',
    srcBusiness: 'Business',
    srcOther: 'Other',

    // Breakdown Screen
    spendingAnalytics: 'Spending Analytics',
    categoryBreakdownTitle: 'Category Breakdown',
    pieChartView: 'Pie Chart View',
    barChartView: 'Bar Chart View',
    totalExpensesAnalyzed: 'Total Expenses Analyzed',
    highestExpense: 'Highest Expense',
    noExpenseData: 'No expense data to analyze',
    noExpenseDataDesc: 'Add some expenses in categories like Food, Rent, or Shopping to view the breakdown.',
    addExpenseNow: 'Add Expense Now',
    shareOfExpense: 'Share of total expense',
    transactionsCount: 'transactions',

    // Voice Command Widget
    voiceTitle: 'Voice Entry (Web Speech API)',
    aiVoiceBadge: 'AI Voice',
    voiceSubtitle: 'Speak naturally like "Spent 500 on dinner for food"',
    examples: 'Examples',
    listening: 'Listening... Speak your transaction now',
    capturedCommand: 'Captured Voice Command',
    tapMicToSpeak: 'Tap microphone to speak transaction',
    samplePromptNotice: 'e.g. "Spent 500 on dinner for food"',
    retry: 'Retry',
    parsedCommand: 'Parsed Command',
    fillIntoForm: 'Fill into Form',
    instantSave: 'Instant Save',
    quickTestCommands: 'Quick Test Commands (Tap to simulate voice):',

    // Settings Modal
    settingsTitle: 'Database & Storage Settings',
    settingsSubtitle: 'Offline SQLite local storage & backups',
    storageType: 'Storage Engine',
    totalRecordsStored: 'Total Transactions Stored',
    exportCsvBtn: 'Export All Data to CSV (Excel / Spreadsheet)',
    exportBackupBtn: 'Export JSON Backup File',
    importBackupBtn: 'Import JSON Backup File',
    resetSampleBtn: 'Reset to Sample Data',
    clearAllBtn: 'Clear All Database Records',
    confirmClearMsg: 'Are you sure you want to clear all transactions from the Room DB?',
    closeBtn: 'Close',

    // PDF Report Modal
    pdfModalTitle: 'Monthly PDF Summary Report',
    financialStatement: 'Financial Statement',
    totalEntriesCount: 'total entries',
    printReport: 'Print Report',
    downloadPdfFile: 'Download PDF File',
    downloadSuccess: 'PDF Summary Report downloaded successfully!',

    // Android Mobile Free App Install
    androidFreeBadge: '100% Free',
    installAndroidBtn: 'Android App',
    installAndroidTitle: 'Get for Android Mobile (100% Free)',
    installAndroidSubtitle: 'Install on your Android phone with zero cost, no ads, and full offline Room DB.',
    androidInstallStep1: 'Step 1: Open in Chrome on Android',
    androidInstallStep1Desc: 'Open this website link in Google Chrome, Edge, or Samsung Internet on your Android phone.',
    androidInstallStep2: 'Step 2: Tap the 3-Dots Menu (⋮)',
    androidInstallStep2Desc: 'Tap the three vertical dots in the upper right corner of your Android browser.',
    androidInstallStep3: 'Step 3: Tap "Install app" or "Add to Home screen"',
    androidInstallStep3Desc: 'Confirm the prompt. The app icon will appear instantly on your Android home screen and app launcher!',
    instant1TapInstall: '1-Tap Direct Install',
    instantInstallPromptNotice: 'Click below to trigger the native Android app installation prompt on supported browsers.',
    scanQrCodeTitle: 'Scan QR Code on Android Phone',
    copyAppLink: 'Copy App Link',
    linkCopied: 'Link Copied to Clipboard!',
    shareViaApp: 'Share via WhatsApp / Phone',
    apkSourceCodeNotice: 'Includes full Kotlin & Jetpack Compose native source code for Android Studio.',
    freeForeverNotice: 'Completely free forever • 100% offline & private • No subscription required',
  },

  te: {
    // Navigation & Header
    appTitle: 'మనీ మిత్ర (Money Mitra)',
    appSubtitle: 'వ్యక్తిగత ఆఫ్‌లైన్ డాష్‌బోర్డ్',
    navHome: 'హోమ్',
    navTransactions: 'లావాదేవీలు',
    navAddEntry: 'ఎంట్రీ జోడించండి',
    navBreakdown: 'విశ్లేషణ',
    kotlinSource: 'కోట్లిన్ కోడ్',
    dbSettings: 'డేటాబేస్ సెట్టింగ్స్',
    langToggleLabel: 'English',

    // Subtitles
    subHome: 'వ్యక్తిగత ఆఫ్‌లైన్ డాష్‌బోర్డ్',
    subTransactions: 'మొత్తం ఎంట్రీలు',
    subAddEntry: 'స్థానిక డేటాబేస్‌లో భద్రపరచండి',
    subBreakdown: 'ఖర్చుల వర్గాల విశ్లేషణ',

    // Dashboard Stats
    statementPeriod: 'స్టేట్‌మెంట్ వ్యవధి',
    totalIncome: 'మొత్తం ఆదాయం',
    totalSpent: 'మొత్తం ఖర్చు',
    remainingBalance: 'మిగిలిన బ్యాలెన్స్',
    netSurplus: 'నికర మిగులు',
    netDeficit: 'నికర లోటు',
    budgetUtilization: 'బడ్జెట్ వినియోగం',
    savingsRate: 'పొదుపు శాతం',
    ofIncomeSpent: 'ఈ నెల ఆదాయంలో ఖర్చు అయ్యింది',
    warningBudgetHigh: 'హెచ్చరిక: నెలవారీ ఆదాయ పరిమితికి చేరుకుంటున్నారు',
    warningBudgetOver: 'జాగ్రత్త: నెలవారీ ఖర్చులు మొత్తం ఆదాయాన్ని మించాయి',
    quickActions: 'త్వరిత చర్యలు',
    recentTransactions: 'ఇటీవలి లావాదేవీలు',
    viewAll: 'అన్నీ చూడండి',
    noTransactionsMonth: 'ఈ నెలకు ఎటువంటి లావాదేవీలు నమోదు కాలేదు.',
    logFirstEntry: 'మీ మొదటి ఆదాయం లేదా ఖర్చు ఎంట్రీని నమోదు చేయండి',
    pdfReport: 'PDF నివేదిక',
    quickDownloadPdf: 'త్వరిత PDF డౌన్‌లోడ్',
    prevMonth: 'మునుపటి నెల',
    nextMonth: 'తదుపరి నెల',

    // Transactions Screen
    searchPlaceholder: 'వివరణ, వర్గం లేదా ₹ మొత్తాన్ని వెతకండి...',
    filterAll: 'అన్నీ',
    filterIncome: 'ఆదాయం (+)',
    filterExpense: 'ఖర్చు (−)',
    allCategories: 'అన్ని వర్గాలు',
    rangeThisMonth: 'ఈ నెల',
    rangeLastMonth: 'గత నెల',
    rangeAllTime: 'మొత్తం కాలం',
    rangeCustom: 'అనుకూల వ్యవధి',
    startDate: 'ప్రారంభ తేదీ',
    endDate: 'ముగింపు తేదీ',
    exportCsv: 'CSV ఎగుమతి',
    swipeHint: 'తొలగించడానికి కార్డ్‌ను ఎడమవైపుకు స్వైప్ చేయండి • వివరాల కోసం నొక్కండి',
    noMatchingTransactions: 'ఎటువంటి లావాదేవీలు కనుగొనబడలేదు',
    tryAdjustingFilters: 'మీ శోధన లేదా ఫిల్టర్లను మార్చి మళ్లీ ప్రయత్నించండి.',
    transactionDetails: 'లావాదేవీ వివరాలు',
    itemizedLedger: 'వివరణాత్మక లెడ్జర్',
    description: 'వివరణ',
    amount: 'మొత్తం',
    category: 'వర్గం',
    date: 'తేదీ',
    type: 'రకం',
    edit: 'సవరించండి',
    delete: 'తొలగించండి',
    saveChanges: 'మార్పులను భద్రపరచండి',
    cancel: 'రద్దు చేయండి',
    undo: 'వెనక్కి తీసుకోండి (Undo)',
    deletedMsg: 'తొలగించబడింది',
    confirmDelete: 'మీరు ఖచ్చితంగా ఈ లావాదేవీని తొలగించాలనుకుంటున్నారా?',

    // Add Entry Screen
    addIncomeTab: 'ఆదాయం (+)',
    addExpenseTab: 'ఖర్చు (−)',
    enterAmount: 'మొత్తాన్ని నమోదు చేయండి',
    quickAmounts: 'త్వరిత మొత్తాలు',
    expenseCategoryLabel: 'ఖర్చు వర్గం',
    incomeSourceLabel: 'ఆదాయ మూలం',
    descPlaceholderExpense: 'ఉదా: కిరాణా, ఆటో ఛార్జీలు, భోజనం బిల్లు',
    descPlaceholderIncome: 'ఉదా: నెల జీతం, ప్రాజెక్ట్ ఫీజు, బహుమతి',
    notesOptional: 'గమనికలు (ఐచ్ఛికం)',
    notesPlaceholder: 'అదనపు వివరాలను ఇక్కడ రాయండి...',
    today: 'ఈరోజు',
    yesterday: 'నిన్న',
    saveExpenseBtn: 'ఖర్చును భద్రపరచండి',
    saveIncomeBtn: 'ఆదాయాన్ని భద్రపరచండి',
    saving: 'భద్రపరుస్తోంది...',
    amountRequiredError: 'దయచేసి 0 కంటే ఎక్కువ సరైన మొత్తాన్ని నమోదు చేయండి',

    // Categories
    catFood: 'ఆహారం / భోజనం',
    catRent: 'అద్దె',
    catTransport: 'రవాణా / ప్రయాణం',
    catShopping: 'షాపింగ్',
    catBills: 'బిల్లులు',
    catOther: 'ఇతరములు',

    // Sources
    srcSalary: 'జీతం',
    srcFreelance: 'ఫ్రీలాన్స్',
    srcInvestments: 'పెట్టుబడులు',
    srcGift: 'బహుమతి',
    srcBusiness: 'వ్యాపారం',
    srcOther: 'ఇతరములు',

    // Breakdown Screen
    spendingAnalytics: 'ఖర్చుల విశ్లేషణ',
    categoryBreakdownTitle: 'వర్గాల వారీగా ఖర్చులు',
    pieChartView: 'పై చార్ట్ వీక్షణ',
    barChartView: 'బార్ చార్ట్ వీక్షణ',
    totalExpensesAnalyzed: 'విశ్లేషించిన మొత్తం ఖర్చులు',
    highestExpense: 'అత్యధిక ఖర్చు వర్గం',
    noExpenseData: 'విశ్లేషించడానికి ఎటువంటి ఖర్చులు లేవు',
    noExpenseDataDesc: 'విశ్లేషణను చూడటానికి ఆహారం, అద్దె లేదా షాపింగ్ వంటి వర్గాలలో ఖర్చులను జోడించండి.',
    addExpenseNow: 'ఇప్పుడే ఖర్చును జోడించండి',
    shareOfExpense: 'మొత్తం ఖర్చులో వాటా',
    transactionsCount: 'లావాదేవీలు',

    // Voice Command Widget
    voiceTitle: 'వాయిస్ ఎంట్రీ (Web Speech API)',
    aiVoiceBadge: 'AI వాయిస్',
    voiceSubtitle: 'సహజంగా మాట్లాడండి: "Spent 500 on dinner for food" లేదా "భోజనం కోసం 500 ఖర్చు"',
    examples: 'ఉదాహరణలు',
    listening: 'వింటున్నాము... మీ లావాదేవీని మాట్లాడండి',
    capturedCommand: 'గుర్తించిన వాయిస్ ఆదేశం',
    tapMicToSpeak: 'మాట్లాడటానికి మైక్రోఫోన్ నొక్కండి',
    samplePromptNotice: 'ఉదా: "Spent 500 on dinner for food"',
    retry: 'మళ్లీ ప్రయత్నించండి',
    parsedCommand: 'విశ్లేషించిన వివరాలు',
    fillIntoForm: 'ఫారమ్‌లో నింపండి',
    instantSave: 'వెంటనే భద్రపరచండి',
    quickTestCommands: 'త్వరిత పరీక్ష ఆదేశాలు (ట్యాప్ చేయండి):',

    // Settings Modal
    settingsTitle: 'డేటాబేస్ & నిల్వ సెట్టింగ్స్',
    settingsSubtitle: 'ఆఫ్‌లైన్ SQLite లోకల్ స్టోరేజ్ & బ్యాకప్‌లు',
    storageType: 'స్టోరేజ్ ఇంజిన్',
    totalRecordsStored: 'నిల్వ చేయబడిన మొత్తం లావాదేవీలు',
    exportCsvBtn: 'మొత్తం డేటాను CSV లోకి ఎగుమతి చేయండి (Excel / స్ప్రెడ్‌షీట్)',
    exportBackupBtn: 'JSON బ్యాకప్ ఫైల్‌ను డౌన్‌లోడ్ చేయండి',
    importBackupBtn: 'JSON బ్యాకప్ ఫైల్‌ను అప్‌లోడ్ చేయండి',
    resetSampleBtn: 'నమూనా డేటాకు రీసెట్ చేయండి',
    clearAllBtn: 'అన్ని రికార్డులను శాశ్వతంగా తొలగించండి',
    confirmClearMsg: 'మీరు ఖచ్చితంగా డేటాబేస్ నుండి అన్ని లావాదేవీలను తొలగించాలనుకుంటున్నారా?',
    closeBtn: 'మూసివేయండి',

    // PDF Report Modal
    pdfModalTitle: 'నెలవారీ PDF సారాంశ నివేదిక',
    financialStatement: 'ఆర్థిక నివేదిక పత్రం',
    totalEntriesCount: 'మొత్తం ఎంట్రీలు',
    printReport: 'నివేదికను ప్రింట్ చేయండి',
    downloadPdfFile: 'PDF ఫైల్‌ను డౌన్‌లోడ్ చేయండి',
    downloadSuccess: 'PDF సారాంశ నివేదిక విజయవంతంగా డౌన్‌లోడ్ అయింది!',

    // Android Mobile Free App Install
    androidFreeBadge: '100% ఉచితం',
    installAndroidBtn: 'Android యాప్',
    installAndroidTitle: 'Android మొబైల్ కోసం పొందండి (100% ఉచితం)',
    installAndroidSubtitle: 'ఎటువంటి ఖర్చు లేకుండా, ప్రకటనలు లేకుండా, పూర్తి ఆఫ్‌లైన్ Room DB తో మీ Android ఫోన్‌లో ఇన్‌స్టాల్ చేసుకోండి.',
    androidInstallStep1: 'దశ 1: మీ Android ఫోన్ Chrome లో తెరవండి',
    androidInstallStep1Desc: 'మీ Android మొబైల్ బ్రౌజర్‌లో (Google Chrome లేదా Edge) ఈ లింక్‌ను తెరవండి.',
    androidInstallStep2: 'దశ 2: 3-చుక్కల మెనూ (⋮) నొక్కండి',
    androidInstallStep2Desc: 'మీ బ్రౌజర్ ఎగువ కుడి మూలలో ఉన్న మూడు నిలువు చుక్కలను నొక్కండి.',
    androidInstallStep3: 'దశ 3: "Install app" లేదా "Add to Home screen" నొక్కండి',
    androidInstallStep3Desc: 'ఇన్‌స్టాలేషన్‌ను నిర్ధారించండి. మీ ఫోన్ హోమ్ స్క్రీన్ మరియు యాప్ డ్రాయర్‌లో యాప్ ఐకాన్ నేరుగా కనిపిస్తుంది!',
    instant1TapInstall: '1-ట్యాప్ డైరెక్ట్ ఇన్‌స్టాల్',
    instantInstallPromptNotice: 'మద్దతు ఉన్న బ్రౌజర్‌లలో నేరుగా Android యాప్‌ను ఇన్‌స్టాల్ చేయడానికి క్రింద నొక్కండి.',
    scanQrCodeTitle: 'Android ఫోన్‌లో QR కోడ్‌ను స్కాన్ చేయండి',
    copyAppLink: 'యాప్ లింక్‌ను కాపీ చేయండి',
    linkCopied: 'లింక్ క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది!',
    shareViaApp: 'WhatsApp / ఫోన్ ద్వారా షేర్ చేయండి',
    apkSourceCodeNotice: 'Android Studio కోసం పూర్తి Kotlin & Jetpack Compose నేటివ్ సోర్స్ కోడ్ చేర్చబడింది.',
    freeForeverNotice: 'ఎప్పటికీ పూర్తిగా ఉచితం • 100% ఆఫ్‌లైన్ & ప్రైవేట్ • ఎలాంటి సబ్‌స్క్రిప్షన్ అవసరం లేదు',
  },
};

export function getLocalizedCategory(category: string, lang: Language): string {
  const t = translations[lang];
  switch (category) {
    case 'Food':
      return t.catFood;
    case 'Rent':
      return t.catRent;
    case 'Transport':
      return t.catTransport;
    case 'Shopping':
      return t.catShopping;
    case 'Bills':
      return t.catBills;
    case 'Salary':
      return t.srcSalary;
    case 'Freelance':
      return t.srcFreelance;
    case 'Investments':
      return t.srcInvestments;
    case 'Gift':
      return t.srcGift;
    case 'Business':
      return t.srcBusiness;
    case 'Other':
      return t.catOther;
    default:
      return category;
  }
}
