import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";

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

    const { description, amount, date } = await req.json();
    
    if (!description || !amount || !date) {
      return NextResponse.json({ message: "נתונים חסרים ליצירת משימה" }, { status: 400 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const tasks = google.tasks({ version: "v1", auth });

    const dueDate = new Date(date).toISOString();

    const res = await tasks.tasks.insert({
      tasklist: "@default",
      requestBody: {
        title: `לשלם חשבון: ${description}`,
        notes: `משימה לתשלום שנוצרה מ-Expense Tracker. סכום מדורש: ₪${amount}`,
        due: dueDate,
      }
    });

    return NextResponse.json({ success: true, taskId: res.data.id });

  } catch (error) {
    console.error("Google Tasks Error:", error);
    return NextResponse.json({ message: "שגיאה ביצירת משימה בגוגל משימות." }, { status: 500 });
  }
}
