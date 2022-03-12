const {ScanCommand} = require("@aws-sdk/client-dynamodb")
const {unmarshall} = require("@aws-sdk/util-dynamodb")

const {queueNewGame, startQueuedGame} = require("../gameQueuer.js")
const {corsHeaders, publicQueueTableName} = require("shared/src/constants.js")
const {dynamodbClient} = require("../aws_clients");

async function lambdaHandler(event) {
    let requestBody = JSON.parse(event.body)
    let response = await postStartPublicGame(requestBody.playerId, requestBody.playerColour)
    return {
        statusCode: response.statusCode,
        headers: corsHeaders,
        body: JSON.stringify(response.responseBody),
    };
}

async function postStartPublicGame(playerId, playerColour) {
    let allowWhiteOpponents = playerColour === "either" || playerColour === "black"
    let allowBlackOpponents = playerColour === "either" || playerColour === "white"

    // TODO - Make this a query rather than scan
    let scanResults = await dynamodbClient.send(new ScanCommand({TableName: publicQueueTableName}))
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

module.exports = {
    lambdaHandler: lambdaHandler
}
