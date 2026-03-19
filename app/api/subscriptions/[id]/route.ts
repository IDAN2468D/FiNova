import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Subscription from "@/models/Subscription";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * DELETE /api/subscriptions/[id] - Delete a subscription
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "לא מורשה." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: "מזהה מנוי חסר." }, { status: 400 });
    }

    await connectMongoDB();

    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "משתמש לא נמצא." }, { status: 404 });
    }

    const deleted = await Subscription.findOneAndDelete({
      _id: id,
      userId: user._id
    });

    if (!deleted) {
      return NextResponse.json({ message: "מנוי לא הוסר/לא נמצא." }, { status: 404 });
    }

    return NextResponse.json({ message: "המנוי הוסר בהצלחה." }, { status: 200 });
  } catch (error) {
    console.error("שגיאה במחיקת מנוי:", error);
    return NextResponse.json({ message: "שגיאת שרת." }, { status: 500 });
  }
}
