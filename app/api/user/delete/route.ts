import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * API Route: DELETE /api/user/delete
 * מחיקת חשבון המשתמש לצמיתות ממסד הנתונים.
 * פעולה זו בלתי הפיכה - המשתמש יוסר לחלוטין.
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ message: "לא מורשה - יש להתחבר קודם." }, { status: 401 });
    }

    await connectMongoDB();

    // מחיקת המשתמש מהמסד
    const deletedUser = await User.findOneAndDelete({ email: session.user.email });

    if (!deletedUser) {
      return NextResponse.json({ message: "משתמש לא נמצא." }, { status: 404 });
    }

    // TODO: בעתיד למחוק גם את כל ההוצאות, ההכנסות והיעדים של המשתמש

    return NextResponse.json({ message: "החשבון נמחק בהצלחה. להתראות." }, { status: 200 });
  } catch (error) {
    console.error("שגיאה במחיקת חשבון:", error);
    return NextResponse.json({ message: "שגיאת שרת פנימית." }, { status: 500 });
  }
}
