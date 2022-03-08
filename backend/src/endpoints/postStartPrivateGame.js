import {queueNewGame} from "../shared/gameHelper.js";


export async function postStartPrivateGame(playerId, playerColour) {
    let allowWhiteOpponents = playerColour === "either" || playerColour === "black"
    let allowBlackOpponents = playerColour === "either" || playerColour === "white"
    let newGameId = await queueNewGame(playerId, allowWhiteOpponents, allowBlackOpponents, true)

    return {
        statusCode: 200,
        responseBody: {gameId: newGameId}
    }
}
