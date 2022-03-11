const {GetItemCommand, PutItemCommand} = require("@aws-sdk/client-dynamodb")
const {marshall, unmarshall} = require("@aws-sdk/util-dynamodb")

const {ValidMovesHelper} = require("shared/src/validMovesHelper.js")
const {corsHeaders, gamesTableName} = require("shared/src/constants.js")
const {dynamodbClient} = require("../aws_clients");

async function lambdaHandler(event) {
    let gameId = event.pathParameters.gameId
    let requestBody = JSON.parse(event.body)
    let response = await postMove(
        gameId,
        requestBody.playerId,
        requestBody.nextTurnColour,
        requestBody.nextTurnNumber,
        requestBody.oldSquareId,
        requestBody.newSquareId,
        requestBody.promotionPiece,
        )

    return {
        statusCode: response.statusCode,
        headers: corsHeaders,
        body: JSON.stringify(response.responseBody),
    };
}

async function postMove(gameId, playerId, nextTurnColour, nextTurnNumber, oldSquareId, newSquareId, promotionPiece) {
    let getGameResponse = await dynamodbClient.send(new GetItemCommand({
        TableName: gamesTableName,
        Key: marshall({"gameId": gameId})
    }))

    if (!getGameResponse.Item) {
        return {
            statusCode: 400,
            responseBody: {msg: "Invalid gameId"}
        }
    }

    let game = unmarshall(getGameResponse.Item)

    // Check that the game has been started
    if (game.gameStatus !== "started") {
        return {
            statusCode: 400,
            responseBody: {msg: "Invalid game status"}
        }
    }

    let validMovesHelper = new ValidMovesHelper(game)

    // Check that the proposed move is the next turn in this game
    if (nextTurnColour !== (game.turnColour === "white" ? "black" : "white")
        || nextTurnNumber !== (game.turnColour === "black" ? game.turnNumber + 1 : game.turnNumber)) {
        return {
            statusCode: 400,
            responseBody: {msg: `Invalid turn counter ${game.turnColour === "white" ? "black" : "white"} ${game.turnColour === "black" ? game.turnNumber + 1 : game.turnNumber}`}
        }
    }

    // Check that the player sending this request is the correct player for that colour
    let nextPlayerId = nextTurnColour === "black" ? game.players.white : game.players.black
    if (playerId !== nextPlayerId) {
        return {
            statusCode: 400,
            responseBody: {msg: "Invalid playerId"}
        }
    }

    // Check that the proposed move is legal
    if (!game.activePieces[oldSquareId]
        || game.activePieces[oldSquareId].colour !== game.turnColour
        || !validMovesHelper.getValidMoves(oldSquareId, game.activePieces[oldSquareId]).includes(newSquareId)) {
        return {
            statusCode: 400,
            responseBody: {msg: "Invalid move"}
        }
    }

    // Allow the user to specify a piece, only in the case of pawn promotion
    let backRank = game.turnColour === "white" ? "8" : "1"
    let piece = game.activePieces[oldSquareId]
    if (game.activePieces[oldSquareId].value === "Pawn" && newSquareId[1] === backRank) {
        if (promotionPiece.colour !== game.turnColour) {
            return {
                statusCode: 400,
                responseBody: {msg: "Invalid promotionPiece"}
            }
        }
        piece = promotionPiece
    }

    let updatedBoard = validMovesHelper.updateBoardConfiguration(oldSquareId, newSquareId, piece)
    game.activePieces = updatedBoard.activePieces
    game[updatedBoard.captureList] = updatedBoard.capturedPieces
    game.turnColour = nextTurnColour
    game.turnNumber = nextTurnNumber
    game.attackedKing = validMovesHelper.getKingIsInCheck(updatedBoard.activePieces, game.turnColour) ? validMovesHelper.getKingPosition(updatedBoard.activePieces, game.turnColour) : null
    if (game.attackedKing && validMovesHelper.getCheckmate()) {
        game.checkmate = true
    }

    await dynamodbClient.send(new PutItemCommand({
        TableName: gamesTableName,
        Item: marshall(game)
    }))

    return {
        statusCode: 201,
        responseBody: {msg: "move accepted"}
    }
}

module.exports = {
    lambdaHandler: lambdaHandler
}
