import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Asset from "@/models/Asset";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    await connectMongoDB();
    const assets = await Asset.find({ userId: user.id }).sort({ createdAt: -1 });

    return NextResponse.json(assets);
  } catch (error) {
    console.error("שגיאה במשיכת נכסים:", error);
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    const { name, type, value } = await req.json();

    if (!name || !type || value === undefined) {
      return NextResponse.json({ message: "חסרים נתונים" }, { status: 400 });
    }

    await connectMongoDB();
    
    // Create new asset document
    const asset = await Asset.create({
      name,
      type,
      value: Number(value),
      userId: user.id,
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("שגיאה ביצירת נכס:", error);
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}
