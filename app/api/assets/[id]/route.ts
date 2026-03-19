import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Asset from "@/models/Asset";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // In Next 15 params must be destructured after resolving or implicitly typed
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ message: "מזהה חסר" }, { status: 400 });

    await connectMongoDB();
    
    // Make sure the user owns the asset before deleting
    const deletedAsset = await Asset.findOneAndDelete({
      _id: id,
      userId: user.id
    });

    if (!deletedAsset) {
      return NextResponse.json({ message: "לא נמצא נכס" }, { status: 404 });
    }

    return NextResponse.json({ message: "נמחק בהצלחה" }, { status: 200 });

  } catch (error) {
    console.error("שגיאה במחיקת נכס:", error);
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}
