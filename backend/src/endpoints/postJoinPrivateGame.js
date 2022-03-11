import {DynamoDBClient, GetItemCommand} from "@aws-sdk/client-dynamodb"
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb"

import {startQueuedGame} from "../shared/gameHelper.js"
import {corsHeaders} from "../shared/constants.js"

export async function lambdaHandler(event) {
    let gameId = event.pathParameters.gameId
    let requestBody = JSON.parse(event.body)
    let response = await postJoinPrivateGame(requestBody.playerId, requestBody.playerColour, gameId)
    return {
        statusCode: response.statusCode,
        headers: corsHeaders,
        body: JSON.stringify(response.responseBody),
    };
}

export async function postJoinPrivateGame(secondPlayerId, playerColour, gameId) {
    const client = new DynamoDBClient({region: "eu-west-2"})
    const queueTable = "merge-chess-private-queue"
    const gameTable = "merge-chess-games"

    let getQueueResults = await client.send(new GetItemCommand({
        TableName: queueTable,
        Key: marshall({gameId: gameId})
    }))

    if (!getQueueResults.Item) {
        // Check the active games table. Allows players to rejoin existing games by refreshing the page
        let getGameResults = await client.send(new GetItemCommand({
            TableName: gameTable,
            Key: marshall({gameId: gameId})
        }))
        if (getGameResults.Item) {
            let game = unmarshall(getGameResults.Item)
            if (game.players.white === secondPlayerId || game.players.black === secondPlayerId) {
                return {
                    statusCode: 200,
                    responseBody: {gameId: gameId}
                }
            }
        }

        return {
            statusCode: 400,
            responseBody: {"msg": "Invalid gameId"}
        }
    }

    let queueItem = unmarshall(getQueueResults.Item)
    await startQueuedGame(secondPlayerId, playerColour, queueItem, true)
    return {
        statusCode: 200,
        responseBody: {gameId: gameId}
    }
}
