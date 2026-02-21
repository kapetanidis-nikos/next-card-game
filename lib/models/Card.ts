import mongoose, { Schema, Document } from "mongoose";

export type CardType = "regular" | "wizard" | "jester";
export type CardColor = "red" | "blue" | "green" | "yellow" | null;

export interface ICard extends Document {
  type: CardType;
  color: CardColor;
  value: number | null;
}

const CardSchema = new Schema<ICard>({
  type: {
    type: String,
    enum: ["regular", "wizard", "jester"],
    required: true,
  },
  color: {
    type: String,
    enum: ["red", "blue", "green", "yellow", null],
    default: null,
  },
  value: {
    type: Number,
    min: 1,
    max: 13,
    default: null,
  },
});

// Checks if Card schema is already established or it creates a new one
export default mongoose.models.Card || mongoose.model<ICard>("Card", CardSchema);