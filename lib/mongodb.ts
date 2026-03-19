import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("אנא הגדר את משתנה הסביבה MONGODB_URI");
}

/**
 * שמירת החיבור במטמון הגלובלי (Caching) כדי למנוע 
 * פתיחת חיבורים מרובים בכל קריאת API חוזרת ממערכת Serverless (כמו Vercel/Next).
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * פונקציה מרכזית ליצירת חיבור או שימוש בחיבור קיים למסד הנתונים MongoDB
 * @returns חיבור למסד הנתונים
 */
export const connectMongoDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
};
