import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse(null, { status: 401 });
    }

    await connectMongoDB();

    const user = await User.findOne({ email: session.user.email }).select("image");

    if (!user || !user.image) {
      return new NextResponse(null, { status: 404 });
    }

    // Convert Base64 back to binary Buffer
    // Usually Base64 strings from FileReader look like "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
    const base64Data = user.image.split(',')[1] || user.image;
    const contentType = user.image.split(';')[0].split(':')[1] || "image/jpeg";
    
    const imageBuffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400", // Cache for 1 day
      },
    });
  } catch (error) {
    console.error("שגיאה במשיכת תמונת פרופיל:", error);
    return new NextResponse(null, { status: 500 });
  }
}
