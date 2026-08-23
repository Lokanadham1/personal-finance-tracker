import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TransactionEntity } from '../types';

export interface MonthlyReportData {
  selectedMonth: string;
  monthTitle: string;
  totalIncome: number;
  totalExpense: number;
  remainingBalance: number;
  spentPercentage: number;
  transactions: TransactionEntity[];
  categoryBreakdown: { category: string; total: number; percentage: number; color: string }[];
}

export function generateMonthlyPDFReport(data: MonthlyReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header Banner
  doc.setFillColor(0, 92, 178); // #005cb2 Primary Blue
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MONEY MITRA - FINANCIAL SUMMARY', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${data.monthTitle} (${data.selectedMonth})`, 14, 22);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 27);

  // 2. Key Metrics Summary Cards
  let yPos = 40;

  // Box 1: Total Income
  doc.setFillColor(236, 253, 245); // Emerald-50
  doc.setDrawColor(167, 243, 208); // Emerald-200
  doc.roundedRect(14, yPos, 56, 24, 3, 3, 'FD');
  doc.setTextColor(6, 95, 70); // Emerald-800
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL INCOME', 18, yPos + 7);
  doc.setFontSize(14);
  doc.setTextColor(4, 120, 87); // Emerald-700
  doc.text(`+Rs. ${data.totalIncome.toLocaleString('en-IN')}`, 18, yPos + 16);

  // Box 2: Total Spent
  doc.setFillColor(255, 241, 242); // Rose-50
  doc.setDrawColor(254, 205, 211); // Rose-200
  doc.roundedRect(77, yPos, 56, 24, 3, 3, 'FD');
  doc.setTextColor(159, 18, 57); // Rose-800
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL SPENT', 81, yPos + 7);
  doc.setFontSize(14);
  doc.setTextColor(190, 18, 60); // Rose-700
  doc.text(`-Rs. ${data.totalExpense.toLocaleString('en-IN')}`, 81, yPos + 16);

  // Box 3: Net Balance
  const isPositive = data.remainingBalance >= 0;
  if (isPositive) {
    doc.setFillColor(239, 246, 255); // Blue-50
    doc.setDrawColor(191, 219, 254); // Blue-200
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(252, 165, 165);
  }
  doc.roundedRect(140, yPos, 56, 24, 3, 3, 'FD');
  doc.setTextColor(isPositive ? 30 : 153, isPositive ? 58 : 27, isPositive ? 138 : 27);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(isPositive ? 'NET SURPLUS' : 'NET DEFICIT', 144, yPos + 7);
  doc.setFontSize(14);
  doc.text(
    `${isPositive ? '+' : '-'}Rs. ${Math.abs(data.remainingBalance).toLocaleString('en-IN')}`,
    144,
    yPos + 16
  );

  yPos += 30;

  // Spending Rate Subtext
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  if (data.totalIncome > 0) {
    doc.text(
      `Budget Utilization: ${data.spentPercentage.toFixed(1)}% of income spent (${(100 - data.spentPercentage).toFixed(1)}% savings rate)`,
      14,
      yPos
    );
  } else {
    doc.text('No income recorded for this period.', 14, yPos);
  }

  yPos += 6;

  // 3. Category Breakdown Table
  const activeCategories = data.categoryBreakdown.filter((c) => c.total > 0);
  if (activeCategories.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 28, 30);
    doc.text('Expense Breakdown by Category', 14, yPos);
    yPos += 3;

    const categoryRows = activeCategories.map((c) => [
      c.category,
      `Rs. ${c.total.toLocaleString('en-IN')}`,
      `${c.percentage.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Total Amount', '% of Total Expense']],
      body: categoryRows,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 92, 178],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable on doc
    yPos = (doc.lastAutoTable ? doc.lastAutoTable.finalY : yPos + 30) + 10;
  }

  // Check if we need a new page for transactions
  if (yPos > 210) {
    doc.addPage();
    yPos = 20;
  }

  // 4. Detailed Transactions Ledger for Month
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 28, 30);
  doc.text(`Itemized Transactions (${data.transactions.length} entries)`, 14, yPos);
  yPos += 3;

  if (data.transactions.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text('No transactions recorded for this month.', 14, yPos + 6);
  } else {
    // Sort transactions chronologically descending
    const sortedTx = [...data.transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const txRows = sortedTx.map((t) => [
      t.date,
      t.type === 'INCOME' ? 'Income (+)' : 'Expense (-)',
      t.category,
      t.description,
      `${t.type === 'INCOME' ? '+' : '-'}Rs. ${t.amount.toLocaleString('en-IN')}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Type', 'Category / Source', 'Description', 'Amount (INR)']],
      body: txRows,
      theme: 'striped',
      headStyles: {
        fillColor: [50, 55, 65],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 24 },
        2: { cellWidth: 32 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });
  }

  // 5. Footer with page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Money Mitra  •  ${data.monthTitle} Report  •  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  // Save the PDF
  const sanitizedTitle = data.selectedMonth;
  doc.save(`monthly-financial-report-${sanitizedTitle}.pdf`);
}
