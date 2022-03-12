const appName = "merge-chess"
module.exports.appName = appName
module.exports.gamesTableName = `${appName}-games`
module.exports.publicQueueTableName = `${appName}-public-queue`
module.exports.privateQueueTableName = `${appName}-private-queue`
module.exports.corsHeaders = {
    'Access-Control-Allow-Origin': "*" // Wildcard acceptable here, as I want this to be a publically accessible API
}
