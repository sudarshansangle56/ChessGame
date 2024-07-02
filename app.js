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
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniqsocket) {
    console.log("connected");

    if (!players.white) {
        players.white = uniqsocket.id;
        uniqsocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniqsocket.id;
        uniqsocket.emit("playerRole", "b");
    } else {
        uniqsocket.emit("spectatorRole");
    }

    uniqsocket.on("disconnect", () => {
        console.log("disconnected", uniqsocket.id);
        if (uniqsocket.id === players.white) {
            delete players.white;
        } else if (uniqsocket.id === players.black) {
            delete players.black;
        }
    });

    uniqsocket.on("move", (move) => {
        try {
            if (chess.turn() == 'w' && uniqsocket.id !== players.white) return;
            if (chess.turn() == 'b' && uniqsocket.id !== players.black) return;
            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("something wrong", move);
                uniqsocket.emit("invalidMove", move);
            }
        } catch (error) {
            console.log(error);
        }
    });
});

server.listen(3000, function () {
    console.log("server on 3000");
});
