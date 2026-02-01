import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").unique().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const games = pgTable("games", {
    id: uuid("id").primaryKey().defaultRandom(),
    whitePlayerId: uuid("white_player").references(() => users.id),
    blackPlayerId: uuid("black_player").references(() => users.id),
    status: text("status", { enum: ["ongoing", "checkmate", "draw", "resigned"] }).default("ongoing").notNull(),
    winnerId: uuid("winner").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
});

export const moves = pgTable("moves", {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id").references(() => games.id).notNull(),
    moveNumber: integer("move_number").notNull(),
    playerId: uuid("player_id").references(() => users.id).notNull(),
    san: text("san").notNull(), // Standard Algebraic Notation (e.g. "Nf3")
    fen: text("fen").notNull(), // FEN string after the move
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
