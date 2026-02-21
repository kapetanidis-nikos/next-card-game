import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import pusher from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username || username.trim() === "") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Ensure database connection is established before querying
    await connectToDatabase();

    let user = await User.findOne({ username: username.trim().toLowerCase() });

    if (!user) {
      user = await User.create({ username: username.trim().toLowerCase() });
    }

      // Notify all connected clients that a user has logged in
    await pusher.trigger("users-channel", "user-logged-in", {
      user: { _id: user._id, username: user.username },
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}