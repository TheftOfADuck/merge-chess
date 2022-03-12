const {DeleteItemCommand, DynamoDBClient, PutItemCommand} = require("@aws-sdk/client-dynamodb")
const {marshall} = require("@aws-sdk/util-dynamodb")
const randomWords = require("random-words")

const {ValidMovesHelper} = require("shared/src/validMovesHelper.js")
const {gamesTableName, privateQueueTableName, publicQueueTableName} = require("shared/src/constants.js")


async function queueNewGame(playerId, allowWhiteOpponents, allowBlackOpponents, isPrivate) {
    let clientConfig = {region: "eu-west-2"}
    if (process.env.AWS_DYNAMODB_ENDPOINT) {
        clientConfig.endpoint = process.env.AWS_DYNAMODB_ENDPOINT
    }
    const client = new DynamoDBClient(clientConfig)
    const queueTable = isPrivate ? privateQueueTableName : publicQueueTableName

    let newGameId = randomWords({exactly: 5, join: "-"})

    let newQueueItem = { // TODO - Add timestamp here, so I can clear down old queued games
        gameId: newGameId,
        allowWhite: allowWhiteOpponents,
        allowBlack: allowBlackOpponents,
        firstPlayerId: playerId
    }

    // TODO - Test how dynamoDB handles the rare cases of PK clashes, and write code to retry
    await client.send(new PutItemCommand({
        TableName: queueTable,
        Item: marshall(newQueueItem)
    }))
    console.log("Generated GameId:", newGameId)
    return newGameId
}

async function startQueuedGame(secondPlayerId, playerColour, queuedItem, isPrivate) {
    let clientConfig = {region: "eu-west-2"}
    if (process.env.AWS_DYNAMODB_ENDPOINT) {
        clientConfig.endpoint = process.env.AWS_DYNAMODB_ENDPOINT
    }
    const client = new DynamoDBClient(clientConfig)
    const queueTable = isPrivate ? privateQueueTableName : publicQueueTableName

    // Decide how to assign the white and black colours
    let playerConfig = {white: null, black: null}

    if (!(queuedItem.allowWhite && queuedItem.allowBlack)) { // A preference exists on the queue, fulfill it
        playerConfig.white = queuedItem.allowWhite ? secondPlayerId : queuedItem.firstPlayerId
        playerConfig.black = queuedItem.allowBlack ? secondPlayerId : queuedItem.firstPlayerId
    } else if (playerColour !== "either") { // A preference exists from the second player, fulfill it
        playerConfig.white = playerColour === "white" ? secondPlayerId: queuedItem.firstPlayerId
        playerConfig.black = playerColour === "black" ? secondPlayerId: queuedItem.firstPlayerId
    } else { // No preference exists, flip a coin to assign colours
        let coinToss = Math.random() > 0.5
        playerConfig.white = coinToss ? secondPlayerId : queuedItem.firstPlayerId
        playerConfig.black = coinToss ? queuedItem.firstPlayerId : secondPlayerId
    }

    // Create a new game, with the players set accordingly
    let newGame = Object.assign({players: playerConfig}, ValidMovesHelper.defaultGameState)
    newGame.gameId = queuedItem.gameId
    newGame.gameStatus = "started"
    await client.send(new PutItemCommand({
        TableName: gamesTableName,
        Item: marshall(newGame)
    }))

    // Remove this game from the queue
    await client.send(new DeleteItemCommand({
        TableName: queueTable,
        Key: marshall({gameId: queuedItem.gameId})
    }))

    return newGame.gameId
}

module.exports = {
    queueNewGame: queueNewGame,
    startQueuedGame: startQueuedGame
}
