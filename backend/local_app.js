import express from 'express'
import {postStartGame} from "./src/postStartGame.js";
import {getGameState} from "./src/getGameState.js";
import cors from 'cors'
import {postMove} from "./src/postMove.js";

const app = express()
const port = 3001
app.use(express.json())
app.use(cors())

// aws dynamodb create-table --attribute-definitions=AttributeName=gameId,AttributeType=S --table-name merge-chess-queue --key-schema AttributeName=gameId,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url http://localhost:8000
// aws dynamodb create-table --attribute-definitions=AttributeName=gameId,AttributeType=S --table-name merge-chess-games --key-schema AttributeName=gameId,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url http://localhost:8000

app.post("/api/v1/game/join-public", (req, res) => {
    postStartGame(req.body.playerId, req.body.playerColour).then(x=> {
        console.log(x)
        res.status(x.statusCode)
        res.send(x.responseBody)
    })
})

app.get("/api/v1/game/:gameId/state", (req, res) => {
    getGameState(req.params.gameId, req.query.playerId).then(x => {
        res.status(x.statusCode)
        res.send(x.responseBody)
    })
})

app.post("/api/v1/game/:gameId/move", (req, res) => {
    postMove(req.params.gameId, req.body.playerId, req.body.nextTurnColour, req.body.nextTurnNumber, req.body.oldSquareId, req.body.newSquareId, req.body.promotionPiece).then(x => {
        res.status(x.statusCode)
        res.send(x.responseBody)
    })
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
