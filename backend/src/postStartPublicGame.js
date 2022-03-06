import {ValidMovesHelper} from "shared/src/validMovesHelper.js";
import {DynamoDBClient, ScanCommand, PutItemCommand, DeleteItemCommand} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";
import randomWords from "random-words";

const GAME_TABLE = "merge-chess-games"
const QUEUE_TABLE = "merge-chess-public-queue"


export async function queueNewGame(client, playerId, allowWhiteOpponents, allowBlackOpponents) {
    let newGameId = randomWords({exactly: 5, join: "-"})
    let newQueuedGame = { // TODO - Add timestamp here, so I can clear down old queued games
        gameId: newGameId,
        allowWhite: allowWhiteOpponents,
        allowBlack: allowBlackOpponents,
        initiatingPlayer: playerId
    }
    await client.send(new PutItemCommand({
        TableName: QUEUE_TABLE,
        Item: marshall(newQueuedGame)
    }))
    return newGameId
}

export async function postStartPublicGame(playerId, playerColour) {
    let allowWhiteOpponents = playerColour === "either" || playerColour === "black"
    let allowBlackOpponents = playerColour === "either" || playerColour === "white"
    const client = new DynamoDBClient({region: "eu-west-2"})

    // TODO - Make this a query rather than scan
    let scanResults = await client.send(new ScanCommand({TableName: QUEUE_TABLE}))
    if (scanResults.Count === 0) {
        return {
            statusCode: 200,
            responseBody: {gameId: await queueNewGame(client, playerId, allowWhiteOpponents, allowBlackOpponents)}
        }
    } else {
        for (let queuedGame of scanResults.Items) {
            queuedGame = unmarshall(queuedGame)
            // TODO - Filter this at the scan/query level, not here in the application
            // Check that this player's and the queuing player's colour choices are compatible
            if ((!queuedGame.allowWhite && playerColour === "white") || (!queuedGame.allowBlack && playerColour === "black")) {
                continue
            }

            // Decide how to assign the white and black colours
            let playerConfig = {white: null, black: null}
            if (!(queuedGame.allowWhite && queuedGame.allowBlack)) {
                playerConfig.white = queuedGame.allowWhite ? playerId : queuedGame.initiatingPlayer
                playerConfig.black = queuedGame.allowBlack ? playerId : queuedGame.initiatingPlayer
            } else {
                let coinToss = Math.random() > 0.5
                playerConfig.white = coinToss ? playerId : queuedGame.initiatingPlayer
                playerConfig.black = coinToss ? queuedGame.initiatingPlayer : playerId
            }

            // Create a new game, with the players set accordingly
            let newGame = Object.assign({players: playerConfig}, ValidMovesHelper.defaultGameState)
            newGame.gameId = queuedGame.gameId
            newGame.gameStatus = "started"
            await client.send(new PutItemCommand({
                TableName: GAME_TABLE,
                Item: marshall(newGame)
            }))

            // Remove this game from the queue
            await client.send(new DeleteItemCommand({
                TableName: QUEUE_TABLE,
                Key: marshall({gameId: queuedGame.gameId})
            }))

            return {
                statusCode: 200,
                responseBody: {gameId: newGame.gameId}
            }

        }
        // Couldn't find a compatible game, queue a new one
        return {
            statusCode: 200,
            responseBody: {gameId: await queueNewGame(client, playerId, allowWhiteOpponents, allowBlackOpponents)}
        }
    }
}
