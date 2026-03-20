import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { connectMongoDB } from "@/lib/mongodb";
import mongoose from "mongoose";

const getTransactionModel = () => {
  return mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({
    amount: Number,
    description: String,
    category: String,
    type: String,
    date: Date,
    userId: String,
  }, { timestamps: true }));
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "לא מורשה קודם התחבר לאפליקציה." }, { status: 401 });
    }

    // @ts-ignore
    const accessToken = session.accessToken;
    if (!accessToken) {
      return NextResponse.json({ message: "נדרש חיבור מול חשבון גוגל כדי לבצע ייבוא." }, { status: 400 });
    }

    const { spreadsheetId } = await req.json();
    if (!spreadsheetId) {
      return NextResponse.json({ message: "חסרה כתובת / מזהה של גיליון הנתונים (Spreadsheet ID)." }, { status: 400 });
    }

    // ניקוי מזהה הגיליון ממחרוזת של URL מלא אם המשתמש הדביק לינק שלם
    let cleanId = spreadsheetId;
    if (spreadsheetId.includes("/d/")) {
      cleanId = spreadsheetId.split("/d/")[1].split("/")[0];
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: "v4", auth });

    // תפיסת נתוני הגיליון (ניסיון לקרוא מהעמודה הראשונה A עד E שמכילה את הדאטה שלנו)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: cleanId,
      range: "A2:E", // דילוג על שורת הכותרות (A1:E1)
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ message: "לא נמצאו נתוני הוצאות והכנסות בתבנית המתאימה בטבלה זו." }, { status: 400 });
    }

    await connectMongoDB();
    const Transaction = getTransactionModel();
    let importedCount = 0;

    for (const row of rows) {
      // עמודות: [תאריך, תיאור, קטגוריה, סכום, סוג]
      if (row.length < 5) continue; 
      
      const [dateStr, description, category, amountStr, typeStr] = row;
      const amount = parseFloat(amountStr) || 0;
      const type = typeStr.includes("הכנסה") ? "income" : "expense";
      
      // המרת התאריך - המבנה המקובל בעברית הוא DD.MM.YYYY או DD/MM/YYYY
      let dateObj = new Date();
      if (typeof dateStr === "string") {
        const parts = dateStr.split(/[\/\-\.]/); // חיתוך לפי נקודה, סלאש או מקף
        if (parts.length === 3) {
          dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      }
      
      await Transaction.create({
        // @ts-ignore
        userId: session.user.id,
        amount,
        description: description || "פעולה מיובאת",
        category: category || "other",
        type,
        date: dateObj,
      });
      importedCount++;
    }

    return NextResponse.json({ success: true, count: importedCount });

  } catch (error) {
    console.error("Google Sheets Import Error:", error);
    return NextResponse.json({ message: "אירעה שגיאת קריאה מגוגל, ודא שהקובץ קיים ויש לך גישה אליו." }, { status: 500 });
  }
}
