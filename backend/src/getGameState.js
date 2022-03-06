import {DynamoDBClient, GetItemCommand} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";

const GAME_TABLE = "merge-chess-games"
const PUBLIC_QUEUE_TABLE = "merge-chess-public-queue"

export async function getGameState(gameId, playerId) {
    const client = new DynamoDBClient({region: "eu-west-2"})
    let getGameResponse = await client.send(new GetItemCommand({
        TableName: GAME_TABLE,
        Key: marshall({"gameId": gameId})
    }))

    if (!getGameResponse.Item) {
        // See if that game has been queued, but not yet started
        let getQueueResponse = await client.send(new GetItemCommand({
            TableName: PUBLIC_QUEUE_TABLE,
            Key: marshall({"gameId": gameId})
        }))
        if (getQueueResponse.Item) {
            return {
                statusCode: 200,
                responseBody: {gameId: unmarshall(getQueueResponse.Item).gameId}
            }
        }

        return { // TODO - Figure out how to handle 400 responses in the AWS integration
            statusCode: 400,
            responseBody: {msg: "GameID not found"}
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
