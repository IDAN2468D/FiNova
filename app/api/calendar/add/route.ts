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
      return NextResponse.json({ message: "נתונים חסרים לפתיחת תזכורת ביומן" }, { status: 400 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: "v3", auth });

    // יצירת תזכורת תשלום / אירוע ביומן שיחל בשעה 10 בדיוק בתאריך שנבחר
    const eventDate = new Date(date);
    eventDate.setHours(10, 0, 0, 0); 
    const eventEndDate = new Date(eventDate);
    eventEndDate.setHours(11, 0, 0, 0);

    const event = {
      summary: `🚨 תזכורת תשלום הוצאה: ${description}`,
      description: `מערכת Expense Tracker הכניסה תזכורת לתשלום של ₪${amount} עבור: ${description}`,
      colorId: "11", // צבע אדום בולט בגוגל יומן
      start: {
        dateTime: eventDate.toISOString(),
        timeZone: "Asia/Jerusalem",
      },
      end: {
        dateTime: eventEndDate.toISOString(),
        timeZone: "Asia/Jerusalem",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // תזכורת במייל יום לפני
          { method: "popup", minutes: 60 }, // תזכורת פופ-אפ שעה לפני
        ],
      },
    };

    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return NextResponse.json({ success: true, eventLink: res.data.htmlLink });

  } catch (error) {
    console.error("Google Calendar Error:", error);
    return NextResponse.json({ message: "שגיאה ביצירת אירוע ביומן גוגל." }, { status: 500 });
  }
}
