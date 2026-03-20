import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { Readable } from "stream";

const FOLDER_NAME = "Expense Tracker Receipts";

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
        message: "גיבוי תמונות ענן מצריך הגדרת התחברות עם חשבון Google." 
      }, { status: 400 });
    }

    const { imageBase64, mimeType, filename } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ message: "לא נשלחה תמונה." }, { status: 400 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: "v3", auth });

    // 1. חפש אם יש כבר תיקייה בשם הזה
    let folderId = null;
    const searchRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      folderId = searchRes.data.files[0].id;
    } else {
      // 2. צור את התיקייה אם היא לא קיימת
      const folderMetadata = {
        name: FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder",
      };
      const folderRes = await drive.files.create({
        requestBody: folderMetadata,
        fields: "id",
      });
      folderId = folderRes.data.id;
    }

    // 3. יצירת קובץ Drive מתוך התמונה והוספתו לתיקייה
    const fileMetadata = {
      name: filename || `קבלה-${new Date().toLocaleDateString("he-IL").replace(/\//g, "-")}.${mimeType?.split('/')[1] || 'jpeg'}`,
      parents: folderId ? [folderId] : [], // הכנס לתיקייה החדשה
    };

    const media = {
      mimeType: mimeType || "image/jpeg",
      body: Readable.from(Buffer.from(imageBase64, 'base64')),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    return NextResponse.json({ 
      success: true, 
      fileId: file.data.id,
      webViewLink: file.data.webViewLink
    });

  } catch (error) {
    console.error("Google Drive Upload Error:", error);
    return NextResponse.json({ message: "אירעה שגיאה בגיבוי הקבלה ל-Google Drive." }, { status: 500 });
  }
}
