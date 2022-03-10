import {ValidMovesHelper} from "merge-chess-shared/src/validMovesHelper.js";
import {DynamoDBClient, GetItemCommand, PutItemCommand} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";

export async function lambdaHandler(event) {
    return {
        statusCode: 200,
        body: JSON.stringify({message: 'postMove', input: event}),
    };
}

export async function postMove(gameId, playerId, nextTurnColour, nextTurnNumber, oldSquareId, newSquareId, promotionPiece) {
    const client = new DynamoDBClient({region: "eu-west-2"})
    let getGameResponse = await client.send(new GetItemCommand({
        TableName: "merge-chess-games",
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

    await client.send(new PutItemCommand({
        TableName: "merge-chess-games",
        Item: marshall(game)
    }))

    return {
        statusCode: 201,
        responseBody: {msg: "move accepted"}
    }
}
