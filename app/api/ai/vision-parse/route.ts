import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ message: "Image and mimeType are required" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ message: "Gemini API key is missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a smart financial data extractor. You will receive an image of a receipt, invoice, or financial document.
      Extract the following information and return it STRICTLY as a valid JSON object:
      - "amount": The number representing the total cost (e.g., 50). Do not include currency symbols. If not found, return null.
      - "description": A short, clear description of the business or item in Hebrew (e.g., "מסעדת ארומה"). If not found, return null.
      - "category": Choose the closest matching category from this predefined list of IDs ONLY:
        ['supermarket', 'bills', 'gas', 'eating_out', 'shopping', 'other', 'salary', 'gift', 'investment', 'other_income'].
      - "date": An ISO date string ONLY (YYYY-MM-DD) representing when the transaction happened. Assume today is ${new Date().toISOString().split('T')[0]} if missing.

      Example Response:
      {
        "amount": 120,
        "description": "דלק נתבג",
        "category": "gas",
        "date": "2026-03-19"
      }

      Respond ONLY with the raw, valid JSON object structure shown above without surrounding quotes or markdown formatting.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ]);

    const responseText = result.response.text();
    const cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    // Safe extraction of json if extra text exists
    const startIdx = cleanedText.indexOf('{');
    const endIdx = cleanedText.lastIndexOf('}') + 1;
    const jsonStr = startIdx !== -1 && endIdx !== -1 ? cleanedText.slice(startIdx, endIdx) : cleanedText;

    const data = JSON.parse(jsonStr);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error parsing vision:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
