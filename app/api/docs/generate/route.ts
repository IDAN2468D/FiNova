import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { connectMongoDB } from "@/lib/mongodb";
import mongoose from "mongoose";

const getTransactionModel = () => mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({
    amount: Number,
    description: String,
    category: String,
    type: String,
    date: Date,
    userId: String,
  }, { timestamps: true }));

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    // @ts-ignore
    const accessToken = session.accessToken;
    if (!accessToken) {
      return NextResponse.json({ message: "נדרש חיבור מול גוגל." }, { status: 400 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const docs = google.docs({ version: "v1", auth });
    
    // Create Document
    const docTitle = `דוח הוצאות והכנסות - ${new Date().toLocaleDateString("he-IL")}`;
    const createRes = await docs.documents.create({
      requestBody: { title: docTitle }
    });
    
    const documentId = createRes.data.documentId;
    if (!documentId) throw new Error("Document creation failed");

    // Fetch transactions from DB
    await connectMongoDB();
    const Transaction = getTransactionModel();
    // @ts-ignore
    const transactions = await Transaction.find({ userId: session.user.id }).sort({ date: -1 });

    let incomeTotal = 0;
    let expenseTotal = 0;
    
    let textToInsert = `דוח מנהלים פיננסי מעודכן לתאריך ${new Date().toLocaleDateString("he-IL")}\n`;
    textToInsert += "=================================================\n\n";
    textToInsert += "פירוט התנועות האחרונות:\n\n";

    transactions.forEach(t => {
      const typeStr = t.type === "income" ? "הכנסה" : "הוצאה";
      if (t.type === "income") incomeTotal += t.amount;
      if (t.type === "expense") expenseTotal += t.amount;
      
      const niceDate = t.date ? new Date(t.date).toLocaleDateString("he-IL") : "ללא תאריך";
      textToInsert += `[${niceDate}] ${t.description} | ${t.amount}₪ (${typeStr})\n`;
    });

    textToInsert += "\n=================================================\n";
    textToInsert += `סיכום כולל:\n`;
    textToInsert += `הכנסות: ₪${incomeTotal}\n`;
    textToInsert += `הוצאות: ₪${expenseTotal}\n`;
    textToInsert += `מאזן: ₪${incomeTotal - expenseTotal}\n`;

    // Write content to Doc
    await docs.documents.batchUpdate({
      documentId: documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: textToInsert,
            }
          }
        ]
      }
    });

    // We can obtain the direct link directly by knowing the format
    const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    return NextResponse.json({ success: true, documentUrl: docUrl });

  } catch (error) {
    console.error("Google Docs Error:", error);
    return NextResponse.json({ message: "שגיאה ביצירת דוח בגוגל דוקס." }, { status: 500 }); // Google Docs 
  }
}
