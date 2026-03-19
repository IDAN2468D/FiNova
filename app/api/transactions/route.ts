import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/transactions - שליפת כל התנועות של המשתמש המחובר
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "לא מורשה." }, { status: 401 });
    }

    await connectMongoDB();

    // שליפת ה-userId מהסשן
    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "משתמש לא נמצא." }, { status: 404 });
    }

    // שליפת כל התנועות ממוינות לפי תאריך (החדשות קודם)
    const transactions = await Transaction.find({ userId: user._id }).sort({ date: -1 });

    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error("שגיאה בשליפת תנועות:", error);
    return NextResponse.json({ message: "שגיאת שרת." }, { status: 500 });
  }
}

/**
 * POST /api/transactions - הוספת תנועה חדשה (הוצאה/הכנסה)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "לא מורשה." }, { status: 401 });
    }

    const { amount, category, date, description, type } = await req.json();

    // ולידציה בסיסית
    if (!amount || !category || !date || !description || !type) {
      return NextResponse.json({ message: "נא למלא את כל השדות." }, { status: 400 });
    }

    if (!["expense", "income"].includes(type)) {
      return NextResponse.json({ message: "סוג תנועה לא תקין." }, { status: 400 });
    }

    await connectMongoDB();

    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "משתמש לא נמצא." }, { status: 404 });
    }

    const newTransaction = await Transaction.create({
      amount: Number(amount),
      category,
      date: new Date(date),
      description,
      type,
      userId: user._id,
    });

    return NextResponse.json({ message: "התנועה נשמרה בהצלחה!", transaction: newTransaction }, { status: 201 });
  } catch (error) {
    console.error("שגיאה בשמירת תנועה:", error);
    return NextResponse.json({ message: "שגיאת שרת." }, { status: 500 });
  }
}

/**
 * DELETE /api/transactions - מחיקת תנועה לפי ID
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "לא מורשה." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "נא לספק מזהה תנועה." }, { status: 400 });
    }

    await connectMongoDB();

    const deleted = await Transaction.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "תנועה לא נמצאה." }, { status: 404 });
    }

    return NextResponse.json({ message: "התנועה נמחקה בהצלחה." }, { status: 200 });
  } catch (error) {
    console.error("שגיאה במחיקת תנועה:", error);
    return NextResponse.json({ message: "שגיאת שרת." }, { status: 500 });
  }
}
