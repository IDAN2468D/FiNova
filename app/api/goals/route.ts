import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Goal from "@/models/Goal";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/goals - שליפת כל היעדים של המשתמש המחובר
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "לא מורשה." }, { status: 401 });
    }

    await connectMongoDB();

    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "משתמש לא נמצא." }, { status: 404 });
    }

    const goals = await Goal.find({ userId: user._id }).sort({ createdAt: -1 });

    return NextResponse.json(goals, { status: 200 });
  } catch (error) {
    console.error("שגיאה בשליפת יעדים:", error);
    return NextResponse.json({ message: "שגיאת שרת." }, { status: 500 });
  }
}

/**
 * POST /api/goals - יצירת יעד חיסכון חדש
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "לא מורשה." }, { status: 401 });
    }

    const { title, targetAmount, currentAmount, icon, color, deadline } = await req.json();

    if (!title || !targetAmount) {
      return NextResponse.json({ message: "נא למלא שם יעד וסכום יעד." }, { status: 400 });
    }

    await connectMongoDB();

    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "משתמש לא נמצא." }, { status: 404 });
    }

    const newGoal = await Goal.create({
      title,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount || 0),
      icon: icon || "target",
      color: color || "from-violet-500 to-indigo-400",
      deadline: deadline ? new Date(deadline) : undefined,
      userId: user._id,
    });

    return NextResponse.json({ message: "היעד נוצר בהצלחה!", goal: newGoal }, { status: 201 });
  } catch (error) {
    console.error("שגיאה ביצירת יעד:", error);
    return NextResponse.json({ message: "שגיאת שרת." }, { status: 500 });
  }
}

/**
 * PUT /api/goals - עדכון יעד (הפקדה / עריכה)
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "לא מורשה." }, { status: 401 });
    }

    const { id, title, targetAmount, currentAmount, icon, color, deadline } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "נא לספק מזהה יעד." }, { status: 400 });
    }

    await connectMongoDB();

    const updatedGoal = await Goal.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(targetAmount && { targetAmount: Number(targetAmount) }),
        ...(currentAmount !== undefined && { currentAmount: Number(currentAmount) }),
        ...(icon && { icon }),
        ...(color && { color }),
        ...(deadline && { deadline: new Date(deadline) }),
      },
      { new: true }
    );

    if (!updatedGoal) {
      return NextResponse.json({ message: "יעד לא נמצא." }, { status: 404 });
    }

    return NextResponse.json({ message: "היעד עודכן בהצלחה!", goal: updatedGoal }, { status: 200 });
  } catch (error) {
    console.error("שגיאה בעדכון יעד:", error);
    return NextResponse.json({ message: "שגיאת שרת." }, { status: 500 });
  }
}

/**
 * DELETE /api/goals - מחיקת יעד
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
      return NextResponse.json({ message: "נא לספק מזהה יעד." }, { status: 400 });
    }

    await connectMongoDB();

    const deleted = await Goal.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "יעד לא נמצא." }, { status: 404 });
    }

    return NextResponse.json({ message: "היעד נמחק בהצלחה." }, { status: 200 });
  } catch (error) {
    console.error("שגיאה במחיקת יעד:", error);
    return NextResponse.json({ message: "שגיאת שרת." }, { status: 500 });
  }
}
