const {queueNewGame} = require("../gameQueuer.js")
const {corsHeaders} = require("/shared/src/constants.js")

async function lambdaHandler(event) {
    let requestBody = JSON.parse(event.body)
    let response = await postStartPrivateGame(requestBody.playerId, requestBody.playerColour)
    return {
        statusCode: response.statusCode,
        headers: corsHeaders,
        body: JSON.stringify(response.responseBody),
    };
}

async function postStartPrivateGame(playerId, playerColour) {
    let allowWhiteOpponents = playerColour === "either" || playerColour === "black"
    let allowBlackOpponents = playerColour === "either" || playerColour === "white"
    let newGameId = await queueNewGame(playerId, allowWhiteOpponents, allowBlackOpponents, true)

    return {
        statusCode: 200,
        responseBody: {gameId: newGameId}
    }
}

module.exports = {
    lambdaHandler: lambdaHandler
}
