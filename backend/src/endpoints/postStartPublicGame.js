import {DynamoDBClient, ScanCommand} from "@aws-sdk/client-dynamodb";
import {unmarshall} from "@aws-sdk/util-dynamodb";
import {queueNewGame, startQueuedGame} from "../shared/gameHelper.js";

export async function lambdaHandler(event) {
    return {
        statusCode: 200,
        body: JSON.stringify({message: 'postStartPublicGame', input: event}),
    };
}

export async function postStartPublicGame(playerId, playerColour) {
    let allowWhiteOpponents = playerColour === "either" || playerColour === "black"
    let allowBlackOpponents = playerColour === "either" || playerColour === "white"
    const client = new DynamoDBClient({region: "eu-west-2"})
    const queueTable = "merge-chess-public-queue"

    // TODO - Make this a query rather than scan
    let scanResults = await client.send(new ScanCommand({TableName: queueTable}))
    if (scanResults.Count === 0) { // Nothing in the queue matching player requirements. Queue a new game
        let newGameId = await queueNewGame(playerId, allowWhiteOpponents, allowBlackOpponents, false)
        return {
            statusCode: 200,
            responseBody: {gameId: newGameId}
        }
    } else { // A matching queued game has been found. Join and start it
        for (let queuedGame of scanResults.Items) {
            queuedGame = unmarshall(queuedGame)
            // TODO - Filter this at the scan/query level, not here in the application
            // Check that this player's and the queuing player's colour choices are compatible
            if ((!queuedGame.allowWhite && playerColour === "white") || (!queuedGame.allowBlack && playerColour === "black")) {
                continue
            }
            let newGameId = await startQueuedGame(playerId, playerColour, queuedGame, false)
            return {
                statusCode: 200,
                responseBody: {gameId: newGameId}
            }

        }
        // Couldn't find a compatible game, queue a new one
        let newGameId = await queueNewGame(playerId, allowWhiteOpponents, allowBlackOpponents, false)
        return {
            statusCode: 200,
            responseBody: {gameId: newGameId}
        }
    }
}
