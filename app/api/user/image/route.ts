import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "לא מורשה." }, { status: 401 });
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ message: "לא סופקה תמונה." }, { status: 400 });
    }

    await connectMongoDB();

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { image: imageBase64 },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ message: "משתמש לא נמצא." }, { status: 404 });
    }

    return NextResponse.json({ message: "התמונה הועלתה בהצלחה", image: user.image }, { status: 200 });
  } catch (error) {
    console.error("שגיאה בהעלאת תמונה:", error);
    return NextResponse.json({ message: "שגיאת שרת." }, { status: 500 });
  }
}
