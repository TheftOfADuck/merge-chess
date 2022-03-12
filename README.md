# Build Environment
To build this application, you must have the following tools globally installed:
- node >= 16.14.0.
- npm >= 8.3.1.
- docker >= 20.10.10. (Only for running the backend locally)
- serverless >= 3.7.3. [npm link](https://www.npmjs.com/package/serverless)
- serverless-domain-manager >= 6.0.2. [npm link](https://www.npmjs.com/package/serverless-domain-manager)
- serverless-offline >= 8.5.0. [npm link](https://www.npmjs.com/package/serverless-offline)
- serverless-dotenv-plugin >= 3.12.2. [npm link](https://www.npmjs.com/package/serverless-dotenv-plugin)

# Project Structure
This repository is a monorepo of three components:
- backend - APIs used to store game data and communicate between players
- frontend - HTML and JS seen by the user
- shared - Shared code used by both backend and frontend. This is not deployed alone, but is packaged into each frontend/backend deployment with the package.json deploy script.

Each component has its own package.json, installs its dependencies separately, and deploys separately.

## Backend
The backend is a collection of AWS lambda functions, co-ordinated by an API gateway instance. The serverless framework is used to deploy to AWS and host locally.
The primary purpose of the backend is to allow front-end clients to communicate with each other, and store state of the game.

## Frontend
The frontend is a single page React application, deployed to an S3 bucket configured for static website hosting.
The front-end JS will periodically poll the backend, asking for the current state of the game.
When a user queues a game, or makes a move in the game, the frontend will post that event to the backend.
The opponent's client will then pick up that change due to the periodic polling behaviour.

# Running locally
The frontend and backend are both configured to run locally, and talk to local instances of each other and AWS.
Each can be started with the command `npm run start` from the frontend and backend directory.

Before starting the backend, you will need to launch a local instance of dynamodb. To do that:
- Change directory to `backend\local_dynamodb`
- Run `docker compose up -d`
- Run `create_tables.sh`

This will launch a dockerised version of dynamodb, and create the tables needed for the backend. The tables are persisted in the `data` folder,
so old games and queues will exist between restarts. To remove persisted games, delete the `data` directory.

# Deployment Prerequisites
Deploying the application has some manual pre-requisites, that only need to be done once per project.

## Domains and Certificates
A domain must be purchased through AWS registrar, and a hosted zone created. An SSL certificate must also be purchased for that domain.
To set up a custom domain for the front-end, follow [this guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/website-hosting-custom-domain-walkthrough.html).

## S3 bucket
An S3 bucket configured for static website hosting must be created, and the frontend package.json scripts updated to use that.
Follow [this guide](https://andela.com/insights/how-to-deploy-your-react-app-to-aws-s3/).
