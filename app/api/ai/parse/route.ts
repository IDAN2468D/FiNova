import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ message: "נא לספק טקסט." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ message: "מפתח API חסר." }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are a precise financial data extraction API. 
The user will provide a free-text description of a transaction (in Hebrew, English, or mixed).
Your job is to extract the following 4 fields:
1. amount: Number. Only the numeric value of the transaction.
2. description: String. A concise label or name for the transaction in Hebrew.
3. category: String. MUST BE exactly one of the following predefined IDs:
   - "supermarket" (for groceries, food)
   - "bills" (for utilities, phone, electricity, water)
   - "gas" (for car fuel, petrol)
   - "eating_out" (for restaurants, cafes, take-out)
   - "shopping" (for clothes, electronics, general items)
   - "salary" (for monthly wage)
   - "gift" (for receiving money as a gift)
   - "investment" (for stocks, crypto)
   - "other_income" (for other positive revenue)
   - "other" (if none of the above fit)
4. date: String in ISO format (YYYY-MM-DD). If no date is mentioned in the text, use today's date: ${new Date().toISOString().split("T")[0]}.

Return ONLY a valid JSON object. Do not wrap it in markdown block quotes (\`\`\`json). Just the raw JSON object.
Example: {"amount": 50, "description": "קפה בבוקר", "category": "eating_out", "date": "2026-03-19"}

User text: "${text}"
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Clean potential markdown blocks just in case
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsedData = JSON.parse(cleanedText);

    return NextResponse.json(parsedData, { status: 200 });
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return NextResponse.json({ message: "שגיאה בניתוח הטקסט." }, { status: 500 });
  }
}
