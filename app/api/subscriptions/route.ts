import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Subscription from "@/models/Subscription";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/subscriptions - Fetch all subscriptions for authenticated user
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

    const subscriptions = await Subscription.find({ userId: user._id }).sort({ nextBillingDate: 1 });

    return NextResponse.json(subscriptions, { status: 200 });
  } catch (error) {
    console.error("שגיאה בשליפת מנויים:", error);
    return NextResponse.json({ message: "שגיאת שרת." }, { status: 500 });
  }
}

/**
 * POST /api/subscriptions - Add a new subscription
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "לא מורשה." }, { status: 401 });
    }

    const { name, amount, billingCycle, nextBillingDate, category } = await req.json();

    if (!name || !amount || !billingCycle || !nextBillingDate || !category) {
      return NextResponse.json({ message: "נא למלא את כל השדות." }, { status: 400 });
    }

    if (!["monthly", "yearly"].includes(billingCycle)) {
      return NextResponse.json({ message: "מחזור חיוב לא תקין." }, { status: 400 });
    }

    await connectMongoDB();

    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "משתמש לא נמצא." }, { status: 404 });
    }

    const newSubscription = await Subscription.create({
      name,
      amount: Number(amount),
      billingCycle,
      nextBillingDate: new Date(nextBillingDate),
      category,
      userId: user._id,
    });

    return NextResponse.json({ message: "המנוי נשמר בהצלחה!", subscription: newSubscription }, { status: 201 });
  } catch (error) {
    console.error("שגיאה בשמירת מנוי:", error);
    return NextResponse.json({ message: "שגיאת שרת." }, { status: 500 });
  }
}
