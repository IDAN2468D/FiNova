import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";

const FOLDER_NAME = "Expense Tracker Receipts";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    // @ts-ignore
    const accessToken = session.accessToken;
    if (!accessToken) {
      return NextResponse.json({ message: "חסרה התחברות לגוגל." }, { status: 400 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: "v3", auth });

    const searchRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`,
      fields: "files(id, webViewLink)",
      spaces: "drive",
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      return NextResponse.json({ 
        success: true, 
        folderUrl: searchRes.data.files[0].webViewLink 
      });
    }

    // If folder doesn't exist yet, we don't have a URL, but we don't return an error.
    return NextResponse.json({ success: true, folderUrl: null });

  } catch (error) {
    console.error("Google Drive Fetch Error:", error);
    return NextResponse.json({ message: "אירעה שגיאה בחיפוש בתיקיית Google Drive." }, { status: 500 });
  }
}
