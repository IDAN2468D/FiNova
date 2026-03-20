import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { connectMongoDB } from "@/lib/mongodb";
import mongoose from "mongoose";

// טעינה מושהית (Lazy) של המודל כדי להמנע מתלות ישירה במקרה שהוא לא טעון
const getTransactionModel = () => {
  return mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({}));
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    // @ts-ignore
    const accessToken = session.accessToken;
    
    if (!accessToken) {
      return NextResponse.json({ 
        message: "על מנת לסנכרן לגוגל, יש להתחבר עם כפתור 'המשך עם Google' בהתחברות." 
      }, { status: 400 });
    }

    await connectMongoDB();
    const Transaction = getTransactionModel();
    // @ts-ignore
    const userTransactions = await Transaction.find({ userId: session.user.id }).sort({ date: -1 });

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: "v4", auth });

    // יצירת גיליון אלקטרוני חדש בדשבורד של המשתמש
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `ניהול תקציב (גיבוי יומי) - ${new Date().toLocaleDateString("he-IL")}`,
        }
      }
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    // ארגון המערך לפי עמודות מוגדרות
    const values = [
      ["תאריך", "תיאור הפעולה", "קטגוריה", "סכום (₪)", "סוג הפעולה"], // שורת הכותרות
      // @ts-ignore
      ...userTransactions.map(t => [
        t.date ? new Date(t.date).toLocaleDateString("he-IL") : "",
        t.description || "",
        t.category || "",
        t.amount || 0,
        t.type === "expense" ? "הוצאה" : "הכנסה"
      ])
    ];

    // כתיבת הנתונים לגיליון האלקטרוני החדש שנוצר
    if (spreadsheetId) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values }
      });
    }

    return NextResponse.json({ 
      success: true,
      spreadsheetUrl: spreadsheet.data.spreadsheetUrl 
    });

  } catch (error) {
    console.error("Google Sheets Export Error:", error);
    return NextResponse.json({ message: "אירעה שגיאה בחיבור מול שרתי Google." }, { status: 500 });
  }
}
