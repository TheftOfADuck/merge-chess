import express from 'express'
import cors from 'cors'

import {postMove} from "./src/endpoints/postMove.js";
import {postStartPublicGame} from "./src/endpoints/postStartPublicGame.js";
import {getGameState} from "./src/endpoints/getGameState.js";
import {postStartPrivateGame} from "./src/endpoints/postStartPrivateGame.js";
import {postJoinPrivateGame} from "./src/endpoints/postJoinPrivateGame.js";

const app = express()
const port = 3001
app.use(express.json())
app.use(cors())

// aws dynamodb create-table --attribute-definitions=AttributeName=gameId,AttributeType=S --table-name merge-chess-queue --key-schema AttributeName=gameId,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url http://localhost:8000
// aws dynamodb create-table --attribute-definitions=AttributeName=gameId,AttributeType=S --table-name merge-chess-games --key-schema AttributeName=gameId,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url http://localhost:8000

app.post("/api/v1/game/start-public", (req, res) => {
    console.log("/api/v1/game/start-public:", req.body)
    postStartPublicGame(req.body.playerId, req.body.playerColour).then(x=> {
        console.log("Response:", x)
        res.status(x.statusCode)
        res.send(x.responseBody)
    })
})

app.post("/api/v1/game/start-private", (req, res) => {
    console.log("/api/v1/game/start-private:", req.body)
    postStartPrivateGame(req.body.playerId, req.body.playerColour).then(x=> {
        console.log("Response:", x)
        res.status(x.statusCode)
        res.send(x.responseBody)
    })
})

app.post("/api/v1/game/join-private", (req, res) => {
    console.log("/api/v1/game/join-private:", req.body)
    postJoinPrivateGame(req.body.playerId, req.body.playerColour, req.body.gameId).then(x=> {
        console.log("Response:", x)
        res.status(x.statusCode)
        res.send(x.responseBody)
    })
})

app.get("/api/v1/game/:gameId/state", (req, res) => {
    // console.log(`/api/v1/game/${req.params.gameId}/state`, req.body)
    getGameState(req.params.gameId, req.query.playerId).then(x => {
        // console.log("Response:", x)
        res.status(x.statusCode)
        res.send(x.responseBody)
    })
})

app.post("/api/v1/game/:gameId/move", (req, res) => {
    console.log(`/api/v1/game/${req.params.gameId}/move`, req.body)
    postMove(req.params.gameId, req.body.playerId, req.body.nextTurnColour, req.body.nextTurnNumber, req.body.oldSquareId, req.body.newSquareId, req.body.promotionPiece).then(x => {
        console.log("Response:", x)
        res.status(x.statusCode)
        res.send(x.responseBody)
    })
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
