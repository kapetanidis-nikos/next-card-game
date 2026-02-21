import mongoose, { Schema, Document } from "mongoose";

// ---- Sub-document interfaces ----

export interface ICardInPlay {
  cardId: mongoose.Types.ObjectId;
  type: string;
  color: string | null;
  value: number | null;
}

export interface ITrickCard {
  playerId: mongoose.Types.ObjectId;
  username: string;
  card: ICardInPlay;
}

export interface ITrick {
  cards: ITrickCard[];
  winnerId: mongoose.Types.ObjectId | null;
  winnerUsername: string | null;
}

export interface IPlayer {
  userId: mongoose.Types.ObjectId;
  username: string;
  hand: ICardInPlay[];
  bid: number | null;
  score: number;
  tricksWon: number;
}

// ---- Main document interface ----

export interface IGameSession extends Document {
  code: string;
  status: "waiting" | "in_progress" | "finished";
  hostId: mongoose.Types.ObjectId;
  players: IPlayer[];
  round: number;
  totalRounds: number;
  deck: ICardInPlay[];
  trumpCard: ICardInPlay | null;
  trumpColor: "red" | "blue" | "green" | "yellow" | null;
  currentPlayerIndex: number;
  currentTrick: ITrickCard[];
  completedTricks: ITrick[];
  createdAt: Date;
}

// ---- Sub-document schemas ----

const CardInPlaySchema = new Schema<ICardInPlay>({
  cardId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
  type: { type: String, required: true },
  color: { type: String, default: null },
  value: { type: Number, default: null },
});

const TrickCardSchema = new Schema<ITrickCard>({
  playerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  card: { type: CardInPlaySchema, required: true },
});

const TrickSchema = new Schema<ITrick>({
  cards: { type: [TrickCardSchema], default: [] },
  winnerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  winnerUsername: { type: String, default: null },
});

const PlayerSchema = new Schema<IPlayer>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  hand: { type: [CardInPlaySchema], default: [] },
  bid: { type: Number, default: null },
  score: { type: Number, default: 0 },
  tricksWon: { type: Number, default: 0 },
});

// ---- Main schema ----

const GameSessionSchema = new Schema<IGameSession>({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ["waiting", "in_progress", "finished"],
    default: "waiting",
  },
  hostId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  players: {
    type: [PlayerSchema],
    default: [],
  },
  round: {
    type: Number,
    default: 1,
  },
  totalRounds: {
    type: Number,
    required: true,
  },
  deck: {
    type: [CardInPlaySchema],
    default: [],
  },
  trumpCard: {
    type: CardInPlaySchema,
    default: null,
  },
  trumpColor: {
    type: String,
    enum: ["red", "blue", "green", "yellow", null],
    default: null,
  },
  currentPlayerIndex: {
    type: Number,
    default: 0,
  },
  currentTrick: {
    type: [TrickCardSchema],
    default: [],
  },
  completedTricks: {
    type: [TrickSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Checks if GameSession schema is already established or it creates a new one
export default mongoose.models.GameSession ||
  mongoose.model<IGameSession>("GameSession", GameSessionSchema);