interface Transaction {
  amount: number;
  category: string;
  date: string;
  description: string;
  type: "expense" | "income";
}

const catLabels: Record<string, string> = {
  supermarket: "סופרמרקט", bills: "חשבונות", gas: "דלק", eating_out: "מסעדות",
  shopping: "קניות", other: "אחר", salary: "משכורת", gift: "מתנה",
  investment: "השקעות", other_income: "הכנסה אחרת",
};

/**
 * Exports a list of transactions to a CSV file and triggers a browser download.
 * Prepends the UTF-8 BOM so Microsoft Excel renders Hebrew characters correctly.
 */
export function exportTransactionsToCSV(transactions: Transaction[]) {
  // 1. Define Column Headers
  const headers = ["תאריך", "תיאור", "קטגוריה", "סוג תנועה", "סכום (ILS)"];
  
  // 2. Map transaction data to CSV rows
  const rows = transactions.map(t => {
    const formattedDate = new Date(t.date).toLocaleDateString("he-IL");
    const categoryName = catLabels[t.category] || t.category;
    const typeLabel = t.type === "expense" ? "הוצאה" : "הכנסה";
    const amountStr = t.type === "expense" ? `-${t.amount}` : `${t.amount}`;
    
    return [
      `"${formattedDate}"`,
      `"${t.description.replace(/"/g, '""')}"`, // Escape double quotes for CSV
      `"${categoryName}"`,
      `"${typeLabel}"`,
      `"${amountStr}"`
    ].join(",");
  });

  // 3. Combine headers and rows
  const csvContent = [headers.join(","), ...rows].join("\n");

  // 4. Create Blob with UTF-8 BOM (\uFEFF)
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });

  // 5. Trigger Browser Download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `דוח_תנועות_${new Date().toISOString().split('T')[0]}.csv`);

  
  // For Firefox flexibility
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
