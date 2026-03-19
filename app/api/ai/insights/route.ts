import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { transactions } = await req.json();

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ message: "נא לספק תנועות לניתוח." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ message: "מפתח API חסר." }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const totalSpent = transactions
      .filter((t: any) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalIncome = transactions
      .filter((t: any) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const prompt = `
You are an expert financial advisor named 'יועץ פיננסי חכם'.
I am going to provide you with my recent transactions, my total spent, and my total income.
Your job is to provide exactly 2-3 short sentences of friendly, insightful financial advice or tips based on these numbers.
1. The response MUST be entirely in natural Hebrew (RTL, native phrasing).
2. The response MUST be formatted as safe HTML (e.g., using <b> for emphasis). Do NOT use complex markdown or wrappers. 
3. Make it encouraging but analytical. Mention a specific pattern if you notice one (e.g., spending too much on restaurants or a high savings rate).

Total Income: ${totalIncome}
Total Spent: ${totalSpent}
Transactions length: ${transactions.length}
Recent Transactions (as JSON): ${JSON.stringify(transactions.slice(0, 10))}

Return only the raw HTML text string forming those 2-3 sentences. Do not use block quotes or write anything else.
`;

    const result = await model.generateContent(prompt);
    let insightHtml = result.response.text().trim();
    insightHtml = insightHtml.replace(/```html/gi, "").replace(/```/g, "").trim();

    return NextResponse.json({ insight: insightHtml }, { status: 200 });
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    return NextResponse.json({ message: "שגיאה ביצירת התובנות." }, { status: 500 });
  }
}
