import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    const { messages, transactions } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ message: "Messages array is required" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ message: "Gemini API key is missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const totalSpent = transactions.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
    const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);

    const systemPrompt = `
      You are an interactive, smart financial assistant (יועץ פיננסי אישי).
      The user will ask you questions about their finances.
      You must reply entirely in natural Hebrew (RTL friendly).
      You have access to their transaction history.
      Total Spent: ₪${totalSpent}
      Total Income: ₪${totalIncome}
      Total Transactions: ${transactions.length}
      Transaction Details (JSON): ${JSON.stringify(transactions.map((t: any) => ({
        date: t.date, type: t.type, amount: t.amount, category: t.category, desc: t.description
      })))}

      Rules:
      1. Answer their question contextually and succinctly. 
      2. Use HTML line breaks (<br/>) or bolding (<b>) if formatting is needed, but NEVER use markdown blocks like \`\`\`html.
      3. Be friendly, clear, and insightful. 
      4. If they ask about saving, suggest areas they can cut back based on the data.
      5. If they ask about anomalies, check the transactions above.
    `;

    const history = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "הבנתי, אני מוכן לעזור!" }] },
      ...messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
    ];

    const chat = model.startChat({ history });
    const userMessage = messages[messages.length - 1].content;
    
    const result = await chat.sendMessage(userMessage);
    const text = result.response.text().trim();

    // Clean up any weird wrappers the model might return:
    const cleanHtml = text.replace(/```html/gi, "").replace(/```/g, "").trim();

    return NextResponse.json({ reply: cleanHtml }, { status: 200 });

  } catch (error) {
    console.error("Error in AI chat:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
