import {queueNewGame} from "../shared/gameHelper.js";
import {corsHeaders} from "../shared/constants.js";

export async function lambdaHandler(event) {
    let requestBody = JSON.parse(event.body)
    let response = await postStartPrivateGame(requestBody.playerId, requestBody.playerColour)
    return {
        statusCode: response.statusCode,
        headers: corsHeaders,
        body: JSON.stringify(response.responseBody),
    };
}

export async function postStartPrivateGame(playerId, playerColour) {
    let allowWhiteOpponents = playerColour === "either" || playerColour === "black"
    let allowBlackOpponents = playerColour === "either" || playerColour === "white"
    let newGameId = await queueNewGame(playerId, allowWhiteOpponents, allowBlackOpponents, true)

    return {
        statusCode: 200,
        responseBody: {gameId: newGameId}
    }
}
