const {GetItemCommand} = require("@aws-sdk/client-dynamodb")
const {marshall, unmarshall} = require("@aws-sdk/util-dynamodb")

const {startQueuedGame} = require("../gameQueuer.js")
const {corsHeaders, gamesTableName, privateQueueTableName} = require("shared/src/constants.js")
const {dynamodbClient} = require("../aws_clients");

async function lambdaHandler(event) {
    let gameId = event.pathParameters.gameId
    let requestBody = JSON.parse(event.body)
    let response = await postJoinPrivateGame(requestBody.playerId, requestBody.playerColour, gameId)
    return {
        statusCode: response.statusCode,
        headers: corsHeaders,
        body: JSON.stringify(response.responseBody),
    };
}

async function postJoinPrivateGame(secondPlayerId, playerColour, gameId) {
    let getQueueResults = await dynamodbClient.send(new GetItemCommand({
        TableName: privateQueueTableName,
        Key: marshall({gameId: gameId})
    }))

    if (!getQueueResults.Item) {
        // Check the active games table. Allows players to rejoin existing games by refreshing the page
        let getGameResults = await dynamodbClient.send(new GetItemCommand({
            TableName: gamesTableName,
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

module.exports = {
    lambdaHandler: lambdaHandler
}
