import {DynamoDBClient, GetItemCommand} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";

const GAME_TABLE = "merge-chess-games"

export async function getGameState(gameId) {
    const client = new DynamoDBClient({region: "eu-west-2"})
    let getGameResponse = await client.send(new GetItemCommand({
        TableName: GAME_TABLE,
        Key: marshall({"gameId": gameId})
    }))

    if (!getGameResponse.Item) {
        return { // TODO - Figure out how to handle 400 responses in the AWS integration
            statusCode: 400,
            responseBody: {msg: "GameID not found"}
        }
    }
    let game = unmarshall(getGameResponse.Item)
    return {
        statusCode: 200,
        responseBody: {
            gameId: game.gameId,
            gameStatus: game.gameStatus,
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
