
const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const app = express();





const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
    console.log("connected");

    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("spectatorRole");
        uniquesocket.emit("boardState", chess.fen());
    }

    uniquesocket.on("disconnect", function () {
        if (uniquesocket.id == players.white) {
            delete players.white;
            io.emit("playerDisconnected", "w");
        }
        if (uniquesocket.id == players.black) {
            delete players.black;
            io.emit("playerDisconnected", "b");
        }
    });

    uniquesocket.on("move", (move) => {
        try {
            if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
            if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());

                if (chess.isGameOver()) {
                    io.emit("gameOver", {
                        result: chess.in_checkmate() ? `${chess.turn()} lost` : "draw",
                    });
                    chess.reset(); // Reset the game after it ends
                    io.emit("boardState", chess.fen());
                }
            } else {
                console.log("Invalid Move: ", move);
                uniquesocket.emit("invalidMove", move);
            }
        } catch (err) {
            console.log(err);
            uniquesocket.emit("invalidMove", move);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, function () {
    console.log(`listening on port ${PORT}`);
});
