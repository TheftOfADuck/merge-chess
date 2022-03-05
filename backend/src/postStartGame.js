import {v4 as uuidv4} from "uuid";
import {ValidMovesHelper} from "shared/src/validMovesHelper.js";
import {DynamoDBClient, ScanCommand, PutItemCommand, GetItemCommand, DeleteItemCommand} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";

const GAME_TABLE = "merge-chess-games"
const QUEUE_TABLE = "merge-chess-queue"

export async function postStartGame(playerId) {
    const client = new DynamoDBClient({region: "eu-west-2"})
    const scanCommand = new ScanCommand({TableName: QUEUE_TABLE})
    let scanResults = await client.send(scanCommand)

    if (scanResults.Count === 0) {
        let newGameId = uuidv4()
        let newGame = Object.assign({players: {white: null, black: null}}, ValidMovesHelper.defaultGameState)
        newGame.gameId = newGameId
        newGame.players.white = playerId

        await client.send(new PutItemCommand({
            TableName: QUEUE_TABLE,
            Item: marshall({"gameId": newGameId})
        }))
        await client.send(new PutItemCommand({
            TableName: GAME_TABLE,
            Item: marshall(newGame)
        }))

        console.log("Queued game:", newGameId)
        return {
            statusCode: 200,
            responseBody: {
                gameId: newGameId,
                playerColour: "white"
            }
        }
    } else {
        // Retrieve a previously queued game
        let getGameResponse = await client.send(new GetItemCommand({
            TableName: GAME_TABLE,
            Key: scanResults.Items[0]
        }))
        let game = unmarshall(getGameResponse.Item)
        game.gameStatus = "started"
        game.players.black = playerId

        // Remove this game from the queue
        await client.send(new DeleteItemCommand({
            TableName: QUEUE_TABLE,
            Key: scanResults.Items[0]
        }))

        // Write the updated game back to DB
        await client.send(new PutItemCommand({
                TableName: GAME_TABLE,
                Item: marshall(game)
            }
        ))

        console.log("Retrieved game from queue:", game.gameId)
        return {
            statusCode: 200,
            responseBody: {
                gameId: game.gameId,
                playerColour: "black"
            }
        }
    }
}
