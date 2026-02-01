import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';

interface ChessboardProps {
    fen: string;
    onMove: (from: string, to: string) => void;
    turn: 'w' | 'b';
    isGameOver: boolean;
}

const Chessboard: React.FC<ChessboardProps> = ({ fen, onMove, turn, isGameOver }) => {
    const [game, setGame] = useState(new Chess(fen));
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [validMoves, setValidMoves] = useState<string[]>([]);

    useEffect(() => {
        setGame(new Chess(fen));
        setSelectedSquare(null);
        setValidMoves([]);
    }, [fen]);

    const pieces: Record<string, string> = {
        'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
        'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
    };

    const board = game.board();

    const handleSquareClick = (square: Square) => {
        if (isGameOver) return;

        if (selectedSquare === square) {
            setSelectedSquare(null);
            setValidMoves([]);
            return;
        }

        // If a piece is already selected, try to move
        if (selectedSquare) {
            const move = game.moves({ square: selectedSquare, verbose: true })
                .find(m => m.to === square);

            if (move) {
                onMove(selectedSquare, square);
                setSelectedSquare(null);
                setValidMoves([]);
                return;
            }
        }

        // Select a piece if it's the player's turn (simplified for now, assumes player is whatever's turn it is)
        const piece = game.get(square);
        if (piece && piece.color === turn) {
            setSelectedSquare(square);
            const moves = game.moves({ square, verbose: true }).map(m => m.to);
            setValidMoves(moves);
        } else {
            setSelectedSquare(null);
            setValidMoves([]);
        }
    };

    return (
        <div className="chessboard">
            {board.map((row, i) =>
                row.map((cell, j) => {
                    const square = String.fromCharCode(97 + j) + (8 - i) as Square;
                    const isLight = (i + j) % 2 === 0;
                    const isSelected = selectedSquare === square;
                    const isHighlight = validMoves.includes(square);

                    return (
                        <div
                            key={square}
                            className={`square ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${isHighlight ? 'highlight' : ''}`}
                            onClick={() => handleSquareClick(square)}
                        >
                            {cell && (
                                <span className="piece">
                                    {pieces[cell.color === 'w' ? cell.type.toUpperCase() : cell.type]}
                                </span>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default Chessboard;
