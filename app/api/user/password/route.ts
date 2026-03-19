import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * API Route: PUT /api/user/password
 * מאפשר למשתמש מחובר לשנות את הסיסמה שלו.
 * מוודא את הסיסמה הנוכחית לפני שמבצע את השינוי.
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ message: "לא מורשה - יש להתחבר קודם." }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "נא למלא את כל שדות הסיסמה." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: "הסיסמה החדשה חייבת להכיל לפחות 6 תווים." }, { status: 400 });
    }

    await connectMongoDB();

    // שליפת המשתמש מהמסד כולל השדה של הסיסמה המוצפנת
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "משתמש לא נמצא במערכת." }, { status: 404 });
    }

    // אימות הסיסמה הנוכחית מול ההצפנה
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "הסיסמה הנוכחית שגויה. נסה שוב." }, { status: 400 });
    }

    // הצפנת הסיסמה החדשה ושמירתה
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ message: "הסיסמה שונתה בהצלחה!" }, { status: 200 });
  } catch (error) {
    console.error("שגיאה בשינוי סיסמה:", error);
    return NextResponse.json({ message: "שגיאת שרת פנימית." }, { status: 500 });
  }
}
