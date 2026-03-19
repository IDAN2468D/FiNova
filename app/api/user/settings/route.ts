import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ message: "לא מורשה - יש להתחבר קודם." }, { status: 401 });
    }

    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ message: "נא למלא את כל השדות." }, { status: 400 });
    }

    await connectMongoDB();

    // בדיקה אם האימייל החדש כבר קיים אצל משתמש אחר
    if (email !== session.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
         return NextResponse.json({ message: "האימייל הזה כבר בשימוש אצל משתמש אחר." }, { status: 400 });
      }
    }

    // עדכון המשתמש במסד הנתונים
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { name, email },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: "משתמש לא נמצא במערכת." }, { status: 404 });
    }

    return NextResponse.json({ message: "הפרטים עודכנו בהצלחה!", user: { name: updatedUser.name, email: updatedUser.email } }, { status: 200 });
  } catch (error) {
    console.error("שגיאה בעדכון ההגדרות:", error);
    return NextResponse.json({ message: "שגיאת שרת פנימית." }, { status: 500 });
  }
}
