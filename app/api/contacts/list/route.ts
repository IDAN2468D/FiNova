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
    const people = google.people({ version: "v1", auth });

    const response = await people.people.connections.list({
      resourceName: "people/me",
      pageSize: 100,
      personFields: "names,emailAddresses",
      sortOrder: "FIRST_NAME_ASCENDING",
    });

    const connections = response.data.connections || [];
    const contactsList = connections
      .map(c => ({
        name: c.names?.[0]?.displayName || "",
      }))
      .filter(c => c.name.length > 0);

    return NextResponse.json({ success: true, contacts: contactsList });

  } catch (error) {
    console.error("Google Contacts Error:", error);
    return NextResponse.json({ message: "שגיאה במשיכת אנשי קשר מגוגל." }, { status: 500 });
  }
}
