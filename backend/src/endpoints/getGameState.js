const {GetItemCommand} = require("@aws-sdk/client-dynamodb")
const {marshall, unmarshall} = require("@aws-sdk/util-dynamodb")

const {corsHeaders, gamesTableName, privateQueueTableName, publicQueueTableName} = require("shared/src/constants.js")
const {dynamodbClient} = require("../aws_clients");

async function lambdaHandler(event) {
    let gameId = event.pathParameters.gameId
    let playerId = event.queryStringParameters ? event.queryStringParameters.playerId : null
    let gameState = await getGameState(gameId, playerId)
    return {
        statusCode: gameState.statusCode,
        headers: corsHeaders,
        body: JSON.stringify(gameState.responseBody),
    };
}

async function getGameState(gameId, playerId) {

    let getGameResponse = await dynamodbClient.send(new GetItemCommand({
        TableName: gamesTableName,
        Key: marshall({"gameId": gameId})
    }))

    if (!getGameResponse.Item) {
        // See if that game has been queued, but not yet started
        let getPublicQueueResponse = await dynamodbClient.send(new GetItemCommand({
            TableName: publicQueueTableName,
            Key: marshall({"gameId": gameId})
        }))
        let getPrivateQueueResponse = await dynamodbClient.send(new GetItemCommand({
            TableName: privateQueueTableName,
            Key: marshall({"gameId": gameId})
        }))

        if (!getPublicQueueResponse.Item && !getPrivateQueueResponse.Item ) {
            return {
                statusCode: 400,
                responseBody: {msg: "Invalid GameId"}
            }
        }

        let game = getPublicQueueResponse.Item ? unmarshall(getPublicQueueResponse.Item) : unmarshall(getPrivateQueueResponse.Item)
        return {
            statusCode: 200,
            responseBody: {gameId: game.gameId}
        }
    }
    let game = unmarshall(getGameResponse.Item)
    let playerColour = game.players.white === playerId ?  "white" : game.players.black === playerId ? "black" : null
    return {
        statusCode: 200,
        responseBody: {
            gameId: game.gameId,
            gameStatus: game.gameStatus,
            playerColour: playerColour,
            activePieces: game.activePieces,
            turnColour: game.turnColour,
            turnNumber: game.turnNumber,
            checkmate: game.checkmate,
            whiteCaptures: game.whiteCaptures,
            blackCaptures: game.blackCaptures,
            attackedKing: game.attackedKing
        }
    }
}

module.exports = {
    lambdaHandler: lambdaHandler
}