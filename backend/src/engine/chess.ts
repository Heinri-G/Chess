import { Chess, Move } from 'chess.js';

export interface GameState {
    fen: string;
    isCheck: boolean;
    isCheckmate: boolean;
    isDraw: boolean;
    isStalemate: boolean;
    isThreefoldRepetition: boolean;
    isInsufficientMaterial: boolean;
    isGameOver: boolean;
    turn: 'w' | 'b';
}

export class ChessEngine {
    private game: Chess;

    constructor(fen?: string) {
        this.game = new Chess(fen);
    }

    public getFen(): string {
        return this.game.fen();
    }

    public getState(): GameState {
        return {
            fen: this.game.fen(),
            isCheck: this.game.inCheck(),
            isCheckmate: this.game.isCheckmate(),
            isDraw: this.game.isDraw(),
            isStalemate: this.game.isStalemate(),
            isThreefoldRepetition: this.game.isThreefoldRepetition(),
            isInsufficientMaterial: this.game.isInsufficientMaterial(),
            isGameOver: this.game.isGameOver(),
            turn: this.game.turn(),
        };
    }

    public makeMove(move: string | { from: string; to: string; promotion?: string }): Move {
        try {
            const result = this.game.move(move);
            return result;
        } catch (e) {
            throw new Error('Illegal move');
        }
    }

    public getLegalMoves(): string[] {
        return this.game.moves();
    }
}
