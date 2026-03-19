/**
 * ממשק המייצג הוצאה בודדת במערכת
 */
export interface Expense {
  id: string | number;
  amount: number;
  date: string; // תאריך בפורמט ISO, למשל: "2026-03-18" או "2026-12-01T10:00:00.000Z"
  description?: string;
  category?: string;
}

/**
 * מסנן רשימת הוצאות לפי חודש ספציפי (מתעלם מהשנה, בודק רק את החודש)
 * 
 * @param expenses - מערך ההוצאות לסינון
 * @param month - מספר החודש (1 עד 12, כאשר 1 זה ינואר ו-12 זה דצמבר)
 * @returns מערך מסונן המכיל רק הוצאות שבוצעו בחודש המבוקש
 */
export function filterExpensesByMonth(expenses: Expense[], month: number): Expense[] {
  return expenses.filter(expense => {
    // ממירים את מחרוזת התאריך לאובייקט תאריך תקני
    const expenseDate = new Date(expense.date);
    
    // ב-JavaScript חודשים מתחילים מ-0 (0 = ינואר), לכן נוסיף 1
    const expenseMonth = expenseDate.getMonth() + 1;
    
    return expenseMonth === month;
  });
}

/**
 * ממיין את רשימת ההוצאות לפי גובה הסכום (מהגדול לקטן או מהקטן לגדול)
 * הפונקציה מחזירה עותק חדש של המערך ולא משנה את המערך המקורי (Pure function)
 * 
 * @param expenses - מערך ההוצאות למיון
 * @param order - סדר המיון: 'asc' לסדר עולה (מהקטן לגדול), 'desc' לסדר יורד (מהגדול לקטן)
 * @returns מערך הוצאות ממוין על פי סכום ההוצאה
 */
export function sortExpensesByAmount(expenses: Expense[], order: 'asc' | 'desc'): Expense[] {
  // יוצרים עותק של המערך כדי לשמור על הפונקציה טהורה (Pure)
  return [...expenses].sort((a, b) => {
    if (order === 'asc') {
      return a.amount - b.amount;
    } else {
      return b.amount - a.amount;
    }
  });
}
