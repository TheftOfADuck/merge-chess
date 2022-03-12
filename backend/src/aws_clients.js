const {DynamoDBClient} = require("@aws-sdk/client-dynamodb")

let clientConfig = {region: "eu-west-2"}
if (process.env.AWS_DYNAMODB_ENDPOINT) {
    clientConfig.endpoint = process.env.AWS_DYNAMODB_ENDPOINT
}
module.exports.dynamodbClient = new DynamoDBClient(clientConfig)
