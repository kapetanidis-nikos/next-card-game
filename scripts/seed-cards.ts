import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI!;

const CardSchema = new mongoose.Schema({
  type: String,
  color: String,
  value: Number,
});

const Card = mongoose.models.Card || mongoose.model("Card", CardSchema);

const colors = ["red", "blue", "green", "yellow"] as const;

const generateDeck = () => {
  const cards = [];

  // 4 suits of 13 cards each
  for (const color of colors) {
    for (let value = 1; value <= 13; value++) {
      cards.push({ type: "regular", color, value });
    }
  }

  // 4 Wizards
  for (let i = 0; i < 4; i++) {
    cards.push({ type: "wizard", color: null, value: null });
  }

  // 4 Jesters
  for (let i = 0; i < 4; i++) {
    cards.push({ type: "jester", color: null, value: null });
  }

  return cards;
};

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing cards
    await Card.deleteMany({});
    console.log("🗑️  Cleared existing cards");

    const deck = generateDeck();
    await Card.insertMany(deck);
    console.log(`🃏 Inserted ${deck.length} cards`);

    await mongoose.disconnect();
    console.log("✅ Done!");
    process.exit(0);
  } catch (error) {
    console.error("💥 Seed failed", error);
    process.exit(1);
  }
};

seed();