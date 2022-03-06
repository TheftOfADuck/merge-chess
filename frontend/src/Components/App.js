import React from "react";
import Board from './Board'
import CaptureRow from './CaptureRow'
import {ValidMovesHelper} from "shared/src/validMovesHelper";
import {v4 as uuidv4} from 'uuid';
import NewGameWidget from "./NewGameWidget";

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

    joinPublicGame = (colour) => {
        fetch(`http://localhost:3001/api/v1/game/join-public`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({playerColour: colour, playerId: this.state.playerId})
        })
            .then(result => result.json())
            .then(result => this.updateState(result))
    }

    createPrivateGame = (colour) => {
        fetch(`http://localhost:3001/api/v1/game/create-private`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({opponentColour: colour, playerId: this.state.playerId})
        })
            .then(result => result.json())
            .then(result => this.updateState(result))
    }

    joinPrivateGame = (colour, gameCode) => {
        fetch(`http://localhost:3001/api/v1/game/join-private`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({opponentColour: colour, gameCode: gameCode, playerId: this.state.playerId})
        })
            .then(result => result.json())
            .then(result => this.updateState(result))
    }

    getGameState = () => {
        fetch(`http://localhost:3001/api/v1/game/${this.state.gameId}/state?playerId=${this.state.playerId}`)
            .then(result => result.json())
            .then(result => this.updateState(result)) // TODO - Fix rubber banding caused by old state from backend being applied
    }

    postMove = (requestBody) => {
        fetch(`http://localhost:3001/api/v1/game/${this.state.gameId}/move`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
    }

    componentDidMount = () => {

        // Poll the backend for current game state
        this.statePollProcess = setInterval(() => {
            if (this.state.gameId !== null) {
                this.getGameState()
            }
        }, 400)
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
                <h1>Merge Chess</h1>
                {this.state.gameId === null || this.state.checkmate ? <NewGameWidget joinPublicGame={this.joinPublicGame} /> : null}
                <p>Game ID: {this.state.gameId}</p>
                <p>Player ID: {this.state.playerId}</p>
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
