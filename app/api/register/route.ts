import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * API Endpoint: /api/register
 * 
 * מסלול שרת עבור הרשמה של משתמשים חדשים.
 * הנתונים מתקבלים, נבדקים, הסיסמה עוברת הצפנה (Hashing) 
 * ולבסוף המשתמש נשמר למסד הנתונים הבטוח.
 */
export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "אנא מלא את כל השדות הדרושים: שם, אימייל וסיסמה." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // בדיקה האם כבר קיים במערכת משתמש כזה
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "כתובת האימייל כבר קיימת במערכת." },
        { status: 409 }
      );
    }

    // הצפנת הסיסמה בעזרת bcrypt עם מחזוריות 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // יצירה במאגר
    await User.create({ name, email, password: hashedPassword });

    return NextResponse.json(
      { message: "המשתמש נוצר בהצלחה בגאווה!" }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("שגיאה במערך יצירת המשתמש:", error);
    return NextResponse.json(
      { message: "אירעה שגיאה. נא לנסות שוב מאוחר יותר." },
      { status: 500 }
    );
  }
}
