

const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = ""; // Clear previous board

    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + colIndex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = colIndex;

            // Add piece if exists
            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);

                // Make pieces draggable for the current player
                if (square.color === playerRole) {
                    pieceElement.draggable = true;

                    pieceElement.addEventListener("dragstart", (e) => {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: colIndex };
                        e.dataTransfer.setData("text/plain", ""); // Required for drag-and-drop in some browsers
                    });

                    pieceElement.addEventListener("dragend", () => {
                        draggedPiece = null;
                        sourceSquare = null;
                    });
                }

                squareElement.appendChild(pieceElement);
            }

            // Drag and Drop Handlers
            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault(); // Allow dropping
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if(playerRole === "b"){
        boardElement.classList.add("flipped");
    }
    else{
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q",
    };


    // Attempt to make the move
    if (chess.move(move)) {
        renderBoard(); // Re-render the board on a valid move
        socket.emit("move", move); // Send move to the server
    } else {
        console.log("Invalid move:", move);
    }
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        'K': '\u2654', // White King
        'Q': '\u2655', // White Queen
        'R': '\u2656', // White Rook
        'B': '\u2657', // White Bishop
        'N': '\u2658', // White Knight
        'P': '\u2659', // White Pawn
        'k': '\u265A', // Black King
        'q': '\u265B', // Black Queen
        'r': '\u265C', // Black Rook
        'b': '\u265D', // Black Bishop
        'n': '\u265E', // Black Knight
        'p': '\u265F'  // Black Pawn
    };

    return unicodePieces[piece.type] || "";
};

// Receive player role from server
socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function () {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function (fen) {
   chess.load(fen);
    renderBoard();
});



// Handle server moves
socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});


// Initial render
renderBoard();
