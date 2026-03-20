import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";

export async function GET() {
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
    const gmail = google.gmail({ version: "v1", auth });

    // חיפוש מיילים שמכילים קבלות או חשבוניות מספקים מוכרים בישראל ובעולם מהחודש האחרון
    const query = "(subject:קבלה OR subject:חשבונית OR subject:receipt OR subject:invoice OR Wolt OR Apple OR PayPal OR AliExpress) newer_than:30d";
    
    const response = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 6,
    });

    const messages = response.data.messages || [];
    const scannedReceipts = [];

    // משיכת התוכן המלא (או ה-Snippet) של כל מייל
    for (const msg of messages) {
      if (!msg.id) continue;
      const msgDetails = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "metadata",
        metadataHeaders: ["Subject", "Date", "From"]
      });

      const headers = msgDetails.data.payload?.headers || [];
      const subject = headers.find(h => h.name === "Subject")?.value || "ללא נושא";
      const dateStr = headers.find(h => h.name === "Date")?.value || "";
      const fromStr = headers.find(h => h.name === "From")?.value || "";

      scannedReceipts.push({
        id: msg.id,
        subject,
        from: fromStr,
        snippet: msgDetails.data.snippet,
        date: new Date(dateStr).toLocaleDateString("he-IL"),
      });
    }

    return NextResponse.json({ success: true, receipts: scannedReceipts });

  } catch (error) {
    console.error("Gmail Scan Error:", error);
    return NextResponse.json({ message: "שגיאה בסריקת תיבת ה-Gmail." }, { status: 500 });
  }
}
