# Build Environment
To build this application, you must have the following tools globally installed:
- node >= 16.14.0
- npm >= 8.3.1
- serverless >= 3.7.3. [npm link](https://www.npmjs.com/package/serverless)
- serverless-domain-manager >= 6.0.2. [npm link](https://www.npmjs.com/package/serverless-domain-manager)
- serverless-offline >= 8.5.0. [npm link](https://www.npmjs.com/package/serverless-offline)

# Project Structure
This repository is a monorepo of three components:
- backend - APIs used to store game data and communicate between players
- frontend - HTML and JS seen by the user
- shared - Shared code used by both backend and frontend. This is not deployed alone, but is packaged into each frontend/backend deployment with the package.json deploy script.

Each component has its own package.json, installs its dependencies separately, and deploys separately.

## Backend
The backend is a collection of AWS lambda functions, co-ordinated by an API gateway instance. The serverless framework is used to run locally and deploy to AWS.
The primary purpose of the backend is to allow front-end clients to communicate with each other, and store state of the game

## Frontend
The frontend is a single page React application, deployed to an S3 bucket configured for static website hosting.
The front-end JS will periodically poll the backend, asking for the current state of the game.
When a user queues a game, or makes a move in the game, the frontend will post that event to the backend.
The opponent's client will then pick up that change due to the periodic polling behaviour.

# Deployment Prerequisites
Deploying the application has some manual pre-requisites, that only need to be done once per project.

## Domains and Certificates
A domain must be purchased through AWS registrar, and a hosted zone created. An SSL certificate must also be purchased for that domain.
To set up a custom domain for the front-end, follow [this guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/website-hosting-custom-domain-walkthrough.html).

## S3 bucket
An S3 bucket configured for static website hosting must be created, and the frontend package.json scripts updated to use that.
Follow [this guide](https://andela.com/insights/how-to-deploy-your-react-app-to-aws-s3/).
