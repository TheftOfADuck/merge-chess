import {v4 as uuidv4} from "uuid";
import {DynamoDBClient, PutItemCommand} from "@aws-sdk/client-dynamodb";
import {marshall} from "@aws-sdk/util-dynamodb";
import randomWords from "random-words"

const QUEUE_TABLE = "merge-chess-private-queue"

export async function postStartPrivateGame(playerId, playerColour) {
    const client = new DynamoDBClient({region: "eu-west-2"})

    let allowWhiteOpponents = playerColour === "either" || playerColour === "black"
    let allowBlackOpponents = playerColour === "either" || playerColour === "white"
    let newGameId = uuidv4()
    let newGameCode = randomWords({exactly: 5, join: "-", maxLength: 7})

    let newQueuedGame = { // TODO - Add timestamp here, so I can clear down old queued games
        gameCode: newGameCode,
        gameId: newGameId,
        allowWhite: allowWhiteOpponents,
        allowBlack: allowBlackOpponents,
        initiatingPlayer: playerId
    }
    await client.send(new PutItemCommand({
        TableName: QUEUE_TABLE,
        Item: marshall(newQueuedGame)
    }))

    return {
        statusCode: 200,
        responseBody: {
            gameId: newGameId,
            gameCode: newGameCode
        }
    }
}
