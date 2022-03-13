import React from "react"
import {v4 as uuidv4} from 'uuid'

import Board from '../Board/Board.js'
import CaptureRow from '../CaptureRow/CaptureRow.js'
import NewGameWidget from "../NewGameWidget/NewGameWidget.js"
import {ValidMovesHelper} from "shared/src/validMovesHelper.js"
import {appName} from "shared/src/constants.js";

class App extends React.Component {

    constructor(props) {
        let playerId = localStorage.getItem("playerId")
        if (!playerId) {
            playerId = uuidv4()
            localStorage.setItem("playerId", playerId)
        }
        super(props);
        this.statePollProcess = null
        this.state = Object.assign({
            // Client-side only state. The backend doesn't know these
            playerId: playerId,
            playerColour: null,
            validMoves: [], // Array of squares the currently selected piece can move to
            selectedPiece: null, // Piece selected by user's first click
            selectedSquare: null, // Square ID selected b user's first click
            pawnBeingPromoted: null // squareId of a pawn currently being promoted
        }, ValidMovesHelper.defaultGameState)
        this.validMovesHelper = new ValidMovesHelper(this.state)
    }

    makApiCall = (endpoint, body) => {
        let hostName = process.env.REACT_APP_API_HOSTNAME || `https://${appName}-api.theftofaduck.com`
        console.log(`Requesting ${hostName}/${endpoint} with:`, body)
        fetch(`${hostName}/${endpoint}`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
            .then(result => result.json())
            .then(result => {
                console.log(`Response from ${endpoint}:`, result)
                this.updateState(result)
            })
    }

    joinPublicGame = (colour) => {
        this.makApiCall('game/start-public', {playerColour: colour, playerId: this.state.playerId})
    }

    createPrivateGame = (colour) => {
        this.makApiCall('game/start-private', {playerColour: colour, playerId: this.state.playerId})
    }

    joinPrivateGame = (colour, gameId) => {
        this.makApiCall(`game/${gameId}/join`, {playerColour: colour, gameId: gameId, playerId: this.state.playerId})
        // TODO - Feedback to UI if gameId is invalid. This will be for typos, or the game is in play and you're not a participant
    }

    postMove = (requestBody) => {
        this.makApiCall(`game/${this.state.gameId}/move`, requestBody)
    }

    getGameState = () => {
        let hostName = process.env.REACT_APP_API_HOSTNAME || `https://${appName}-api.theftofaduck.com`
        fetch(`${hostName}/game/${this.state.gameId}/state?playerId=${this.state.playerId}`)
            .then(result => result.json())
            .then(result => {
                // Only update state if the backend is ahead of the frontend. Prevents rubber-banding whilst the backend is updating
                if (this.state.playerColour === null
                    || result.turnNumber > this.state.turnNumber
                    || (result.turnNumber === this.state.turnNumber && result.turnColour !== this.state.turnColour)) {
                    this.updateState(result)
                }
            })
    }

    componentDidMount = () => {
        // Poll the backend for current game state, only when a game isn't started, or it's the opponent's turn
        this.statePollProcess = setInterval(() => {
            if ((this.state.gameId !== null && this.state.playerColour === null)
                || (this.state.gameId !== null && this.state.playerColour !== this.state.turnColour)) {
                this.getGameState()
            }
        }, 1000)
    }

    componentWillUnmount = () => {
        clearInterval(this.statePollProcess)
    }

    updateState(state, callback=null) {
        // To allow sharing of code between frontend and backend, part of the validation logic has been moved to ValidMovesHelper
        // Each time we update the state of the React components, we must also update the state of the helper
        // Otherwise, the helper state falls out of sync with the frontend state, and getValidMoves will return the wrong results
        this.setState(state, () => {
            this.validMovesHelper.state = this.state
            if (callback) {
                callback()
            }
        })
    }

    onPawnPromotion = (squareId, piece) => {
        let activePieces = Object.assign({}, this.state.activePieces)

        // Capture pieces in the target position, if they're present
        let captureList = this.state.turnColour === "white" ? "whiteCaptures" : "blackCaptures"
        let capturedPieces = [...this.state[captureList]]
        if (activePieces[squareId]) { // An opponent's piece has been captured. Add it to the appropriate capture pile
            capturedPieces.push(activePieces[squareId])
        }

        // Move the promoted piece to the back rank. Delete the pawn
        activePieces[squareId] = piece
        delete activePieces[this.state.selectedSquare]

        // Update state in UI and backend
        let nextTurnColour = this.state.turnColour === "white" ? "black" : "white"
        let nextTurnNumber = this.state.turnColour === "black" ? this.state.turnNumber + 1 : this.state.turnNumber

        let backendState = {
            playerId: this.state.playerId,
            nextTurnColour: nextTurnColour,
            nextTurnNumber: nextTurnNumber,
            oldSquareId: this.state.selectedSquare,
            newSquareId: squareId,
            promotionPiece: piece
        }

        let frontendState = {
            activePieces: activePieces,
            [captureList]: capturedPieces,
            attackedKing: this.validMovesHelper.getKingIsInCheck(activePieces, nextTurnColour) ? this.validMovesHelper.getKingPosition(this.state.activePieces, nextTurnColour) : null,

            selectedSquare: null,
            selectedPiece: null,
            validMoves: [],
            pawnBeingPromoted: null,
        }

        this.updateState(frontendState, () => this.postMove(backendState))
    }

    onSquareSelect = (squareId, piece) => {
        if (this.state.gameStatus !== "started" || this.state.turnColour !== this.state.playerColour) {
            return // Game not started or not this player's turn. Disallow square selection
        }

        if (this.state.pawnBeingPromoted) { // User has clicked away whilst promoting a pawn. Cancel the selection
            this.updateState({
                selectedPiece: null,
                selectedSquare: null,
                validMoves: [],
                pawnBeingPromoted: false
            })
            return
        }

        if (!this.state.selectedPiece && piece) { // Player is picking up a piece
            if (piece.colour !== this.state.turnColour) { // Player tried to pick up opponent's piece
                return
            }
            let validMoves = this.validMovesHelper.getValidMoves(squareId, piece)
            this.updateState({ // Set up the square highlighting for the next click
                selectedPiece: piece,
                selectedSquare: squareId,
                validMoves: validMoves,
            })
        } else { // Player has already picked up a piece, and is now putting it down
            if (!this.state.validMoves.includes(squareId)) { // Invalid choice. Drop the current piece, but it's still that player's move
                this.updateState({
                    selectedPiece: null,
                    selectedSquare: null,
                    validMoves: [],
                    pawnBeingPromoted: false
                })
                return
            }

            // Pawn promotion
            if (this.state.selectedPiece.value === "Pawn") {
                let backRank = this.state.turnColour === "white" ? "8" : "1"
                if (squareId[1] === backRank) {
                    this.updateState({pawnBeingPromoted: squareId})
                    return
                }
            }

            let updatedBoard = this.validMovesHelper.updateBoardConfiguration(this.state.selectedSquare, squareId, this.state.selectedPiece)
            let nextTurnColour = this.state.turnColour === "white" ? "black" : "white"
            let nextTurnNumber = this.state.turnColour === "black" ? this.state.turnNumber + 1 : this.state.turnNumber
            let attackedKing = this.validMovesHelper.getKingIsInCheck(updatedBoard.activePieces, nextTurnColour) ? this.validMovesHelper.getKingPosition(this.state.activePieces, nextTurnColour) : null

            let backendState = {
                playerId: this.state.playerId,
                nextTurnColour: nextTurnColour,
                nextTurnNumber: nextTurnNumber,
                oldSquareId: this.state.selectedSquare,
                newSquareId: squareId
            }

            let frontendState = {
                activePieces: updatedBoard.activePieces,
                [updatedBoard.captureList]: updatedBoard.capturedPieces, // [updatedBoard.captureList] takes the value of captureList (whiteCaptures|blackCaptures), and uses that as the key (Aka Computed Property Names)
                turnColour: nextTurnColour,
                turnNumber: nextTurnNumber,
                selectedPiece: null,
                selectedSquare: null,
                validMoves: [],
                attackedKing: attackedKing,
            }

            this.updateState(frontendState, () => {
                    this.postMove(backendState)
                    // State updates are asynchronous. We do this as a callback to ensure the state is correct when calculating valid moves
                    if (this.state.attackedKing && this.validMovesHelper.getCheckmate()) {
                        this.updateState({checkmate: true})
                    }
                })
        }
    }

    render() {
        return (
            <>
                <h1>base-chess</h1>
                <NewGameWidget
                    joinPublicGame={this.joinPublicGame}
                    joinPrivateGame={this.joinPrivateGame}
                    createPrivateGame={this.createPrivateGame}
                    gameId={this.state.gameId}
                    checkmate={this.state.checkmate}
                    />
                {this.state.gameId !== null && this.state.gameStatus !== "started" ? <p>Waiting for second player</p> : null}
                <CaptureRow capturedPieces={this.state.playerColour === "white" ? this.state.blackCaptures : this.state.whiteCaptures}/>
                <Board
                    playerColour={this.state.playerColour}
                    onSquareSelect={this.onSquareSelect}
                    pieces={this.state.activePieces}
                    selectedSquare={this.state.selectedSquare}
                    attackedKing={this.state.attackedKing}
                    validMoves={this.state.validMoves}
                    pawnBeingPromoted={this.state.pawnBeingPromoted}
                    onPawnPromotion={this.onPawnPromotion}
                />
                <CaptureRow capturedPieces={this.state.playerColour === "white" ? this.state.whiteCaptures : this.state.blackCaptures}/>

            </>
        );
    }
}

export default App
