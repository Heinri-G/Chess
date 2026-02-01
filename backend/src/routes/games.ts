import { Router } from 'express';
import { db } from '../db/db.js';
import { games, moves, users } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { ChessEngine } from '../engine/chess.js';

const router = Router();

// Create a new game
router.post('/', async (req, res) => {
    const { whitePlayerId, blackPlayerId } = req.body;

    try {
        const [newGame] = await db.insert(games).values({
            whitePlayerId,
            blackPlayerId,
            status: 'ongoing',
        }).returning();

        // Initial FEN for a new game
        const engine = new ChessEngine();

        await db.insert(moves).values({
            gameId: newGame.id,
            moveNumber: 0,
            playerId: whitePlayerId, // Placeholder or just system move
            san: 'START',
            fen: engine.getFen(),
        });

        res.status(201).json(newGame);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Get game state
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const game = await db.query.games.findFirst({
            where: eq(games.id, id),
        });

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        const lastMove = await db.query.moves.findFirst({
            where: eq(moves.gameId, id),
            orderBy: [desc(moves.moveNumber)],
        });

        const engine = new ChessEngine(lastMove?.fen);

        res.json({
            ...game,
            state: engine.getState(),
            lastMove,
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Submit a move
router.post('/:id/move', async (req, res) => {
    const { id } = req.params;
    const { playerId, from, to, promotion } = req.body;

    try {
        const game = await db.query.games.findFirst({
            where: eq(games.id, id),
        });

        if (!game || game.status !== 'ongoing') {
            return res.status(400).json({ error: 'Game not active' });
        }

        const lastMove = await db.query.moves.findFirst({
            where: eq(moves.gameId, id),
            orderBy: [desc(moves.moveNumber)],
        });

        const engine = new ChessEngine(lastMove?.fen);

        // Validate turn
        const turn = engine.getState().turn;
        const isWhiteTurn = turn === 'w';
        const currentPlayerTurnId = isWhiteTurn ? game.whitePlayerId : game.blackPlayerId;

        if (playerId !== currentPlayerTurnId) {
            return res.status(403).json({ error: "Not your turn" });
        }

        // Make move
        try {
            const moveResult = engine.makeMove({ from, to, promotion });
            const newState = engine.getState();

            // Persist move
            const [newMove] = await db.insert(moves).values({
                gameId: id,
                moveNumber: (lastMove?.moveNumber ?? 0) + 1,
                playerId: playerId,
                san: moveResult.san,
                fen: engine.getFen(),
            }).returning();

            // Check if game ended
            let status: "ongoing" | "checkmate" | "draw" | "resigned" = 'ongoing';
            let winnerId = null;

            if (newState.isCheckmate) {
                status = 'checkmate';
                winnerId = playerId;
            } else if (newState.isDraw || newState.isStalemate) {
                status = 'draw';
            }

            if (status !== 'ongoing') {
                await db.update(games)
                    .set({ status, winnerId, endedAt: new Date() })
                    .where(eq(games.id, id));
            }

            res.json({ move: newMove, state: newState });
        } catch (e) {
            res.status(400).json({ error: 'Illegal move' });
        }
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Resign
router.post('/:id/resign', async (req, res) => {
    const { id } = req.params;
    const { playerId } = req.body;

    try {
        const game = await db.query.games.findFirst({
            where: eq(games.id, id),
        });

        if (!game || game.status !== 'ongoing') {
            return res.status(400).json({ error: 'Game not active' });
        }

        const winnerId = playerId === game.whitePlayerId ? game.blackPlayerId : game.whitePlayerId;

        await db.update(games)
            .set({ status: 'resigned', winnerId, endedAt: new Date() })
            .where(eq(games.id, id));

        res.json({ message: 'Resigned successfully' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;
