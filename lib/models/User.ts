import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Return cached model if it exists to prevent recompilation errors during hot reload
export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);