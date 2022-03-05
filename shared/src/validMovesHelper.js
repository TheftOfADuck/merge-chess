export class ValidMovesHelper {

    static defaultGameState = {
        startDate: new Date().toLocaleDateString(),
        turnColour: "white",
        turnNumber: 1,
        checkmate: false,
        whiteCaptures: [], // Array of pieces captured by the black player
        blackCaptures: [], // Array of pieces captured by the white player
        attackedKing: null, // squareId of the king currently in check. Used to highlight the cell on the next turn
        gameId: null, // Unique ID for this game. Used for matchmaking / maintaining state server side
        gameStatus: "waiting",
        activePieces: {
            A1: {colour: "white", value: "Rook", hasMoved: false},
            B1: {colour: "white", value: "Knight", hasMoved: false},
            C1: {colour: "white", value: "Bishop", hasMoved: false},
            D1: {colour: "white", value: "Queen", hasMoved: false},
            E1: {colour: "white", value: "King", hasMoved: false},
            F1: {colour: "white", value: "Bishop", hasMoved: false},
            G1: {colour: "white", value: "Knight", hasMoved: false},
            H1: {colour: "white", value: "Rook", hasMoved: false},
            A2: {colour: "white", value: "Pawn", hasMoved: false},
            B2: {colour: "white", value: "Pawn", hasMoved: false},
            C2: {colour: "white", value: "Pawn", hasMoved: false},
            D2: {colour: "white", value: "Pawn", hasMoved: false},
            E2: {colour: "white", value: "Pawn", hasMoved: false},
            F2: {colour: "white", value: "Pawn", hasMoved: false},
            G2: {colour: "white", value: "Pawn", hasMoved: false},
            H2: {colour: "white", value: "Pawn", hasMoved: false},

            A8: {colour: "black", value: "Rook", hasMoved: false},
            B8: {colour: "black", value: "Knight", hasMoved: false},
            C8: {colour: "black", value: "Bishop", hasMoved: false},
            D8: {colour: "black", value: "Queen", hasMoved: false},
            E8: {colour: "black", value: "King", hasMoved: false},
            F8: {colour: "black", value: "Bishop", hasMoved: false},
            G8: {colour: "black", value: "Knight", hasMoved: false},
            H8: {colour: "black", value: "Rook", hasMoved: false},
            A7: {colour: "black", value: "Pawn", hasMoved: false},
            B7: {colour: "black", value: "Pawn", hasMoved: false},
            C7: {colour: "black", value: "Pawn", hasMoved: false},
            D7: {colour: "black", value: "Pawn", hasMoved: false},
            E7: {colour: "black", value: "Pawn", hasMoved: false},
            F7: {colour: "black", value: "Pawn", hasMoved: false},
            G7: {colour: "black", value: "Pawn", hasMoved: false},
            H7: {colour: "black", value: "Pawn", hasMoved: false},
        }
    }

    constructor(state) {
        this.state = state
        this.fileNames = ["A", "B", "C", "D", "E", "F", "G", "H"]
        this.rankNames = ["1", "2", "3", "4", "5", "6", "7", "8"]
        this.squareNames = []
        for (let file of this.fileNames) {
            for (let rank of this.rankNames) {
                this.squareNames.push(file + rank)
            }
        }
    }

    getValidMoves(squareId, piece) {
        let [file, rank] = squareId.split("")
        rank = parseInt(rank)
        let validMoves
        switch (piece.value) {
            case "Pawn":
                validMoves = this.getValidPawnMoves(file, rank, piece)
                break
            case "Rook":
                validMoves = this.getValidRookMoves(file, rank)
                break
            case "Knight":
                validMoves = this.getValidKnightMoves(file, rank)
                break
            case "Bishop":
                validMoves = this.getValidBishopMoves(file, rank)
                break
            case "King":
                validMoves = this.getValidKingMoves(file, rank, piece)
                break
            case "Queen":
                validMoves = this.getValidQueenMoves(file, rank)
                break
            default:
                validMoves = [];
                break
        }

        // Remove any moves that would leave the king in check
        validMoves = validMoves.filter(proposedMove => {
            let proposedBoard = Object.assign({}, this.state.activePieces)
            proposedBoard[proposedMove] = proposedBoard[squareId]
            delete proposedBoard[squareId]
            return !this.getKingIsInCheck(proposedBoard, this.state.turnColour)
        })
        return validMoves
    }

    getValidPawnMoves(file, rank, piece) {
        let direction = piece.colour === "white" ? 1 : -1
        let possibleSquares, possibleRanks
        let validMoves = []

        // First pass, get all spaces this piece could move to, if the board was empty
        if (!piece.hasMoved) { // Pawns can move 2 spaces on their first turn
            possibleRanks = [rank + direction, rank + direction * 2]
        } else {
            possibleRanks = [rank + direction]
        }
        possibleSquares = possibleRanks.map(rank => file + rank)

        // Check for other pieces in this pawn's way
        for (let squareId of possibleSquares) {
            if (this.state.activePieces[squareId]) {
                break
            }
            validMoves.push(squareId)
        }

        // Calculate whether the pawn can attack a piece in a neighbouring square
        // Attackable squares are on the files either side of the current file, and forwards on the rank
        for (let attackFile of [
            this.fileNames[this.fileNames.indexOf(file) - 1], // File to the left (as white)
            this.fileNames[this.fileNames.indexOf(file) + 1] // File to the right (as white)
        ]) {
            let attackSquare = attackFile + (rank + direction)
            if (this.state.activePieces[attackSquare] && this.state.activePieces[attackSquare].colour !== piece.colour) {
                validMoves.push(attackSquare)
            }

            // En-Passant. Check if there is a pawn next to this one, and if it moved 2 spaces on that player's last move
            // In chess, 1 turn comprises a white move, then a black. Hence, if it's white's move, black's last move was the previous turn
            if (this.state.activePieces[attackFile + rank] && this.state.activePieces[attackFile + rank].enPassant) {
                if ((this.state.turnColour === "black" && this.state.turnNumber === this.state.activePieces[attackFile + rank].enPassant)
                    || (this.state.turnColour === "white" && this.state.turnNumber - 1 === this.state.activePieces[attackFile + rank].enPassant)) {
                    validMoves.push(attackFile + (rank + direction))
                }
            }
        }
        return validMoves
    }

    getValidRookMoves(file, rank) {
        let validMoves = []

        for (let direction of [+1, -1]) { // Forwards and backwards
            for (let i = rank + direction; i > 0 && i <= 8; i += direction) {
                if (this.state.activePieces[file + i]) {
                    if (this.state.activePieces[file + i].colour === this.state.turnColour) {
                        break
                    } else {
                        validMoves.push(file + i)
                        break
                    }
                }
                validMoves.push(file + i)
            }
        }

        for (let direction of [1, -1]) { // Right and Left
            for (let i = this.fileNames.indexOf(file) + direction; i >= 0 && i <= 7; i+=direction) {
                if (this.state.activePieces[this.fileNames[i] + rank]) {
                    if (this.state.activePieces[this.fileNames[i] + rank].colour === this.state.turnColour) {
                        break
                    } else {
                        validMoves.push(this.fileNames[i] + rank)
                        break
                    }
                }
                validMoves.push(this.fileNames[i] + rank)
            }

        }
        return validMoves
    }

    getValidKnightMoves(file, rank) {
        const fileIndex = this.fileNames.indexOf(file)
        let validMoves = [
            this.fileNames[fileIndex + 1] + (rank + 2),
            this.fileNames[fileIndex - 1] + (rank + 2),
            this.fileNames[fileIndex + 1] + (rank - 2),
            this.fileNames[fileIndex - 1] + (rank - 2),
            this.fileNames[fileIndex + 2] + (rank + 1),
            this.fileNames[fileIndex - 2] + (rank + 1),
            this.fileNames[fileIndex + 2] + (rank - 1),
            this.fileNames[fileIndex - 2] + (rank - 1),
        ]

        // Remove any square occupied by this player's pieces
        validMoves = validMoves.filter(squareId => !(this.state.activePieces[squareId] && this.state.activePieces[squareId].colour === this.state.turnColour))
        validMoves = validMoves.filter(x => this.squareNames.includes(x)) // Remove any squares that are impossible/NaN/undefined
        return validMoves
    }

    getValidBishopMoves(file, rank) {
        let validMoves = []
        const fileIndex = this.fileNames.indexOf(file)

        for (let increments of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) {
            let [iDelta, jDelta] = [...increments]
            for (let i = fileIndex + iDelta, j = rank + jDelta; i >= 0 && i <= 7 && j >= 1 && j <= 8; i += iDelta, j += jDelta) {
                let squareId = this.fileNames[i] + j
                let piece = this.state.activePieces[squareId]
                if (piece) {
                    if (piece.colour !== this.state.turnColour) {
                        validMoves.push(squareId)
                        break
                    } else {
                        break
                    }
                }
                validMoves.push(squareId)
            }
        }

        return validMoves
    }

    getValidKingMoves(file, rank, piece) {
        const fileIndex = this.fileNames.indexOf(file)
        let validMoves = [
            this.fileNames[fileIndex    ] + (rank + 1),
            this.fileNames[fileIndex + 1] + (rank + 1),
            this.fileNames[fileIndex + 1] + (rank    ),
            this.fileNames[fileIndex + 1] + (rank - 1),
            this.fileNames[fileIndex    ] + (rank - 1),
            this.fileNames[fileIndex - 1] + (rank - 1),
            this.fileNames[fileIndex - 1] + (rank    ),
            this.fileNames[fileIndex - 1] + (rank + 1),
        ]

        // Remove any square occupied by this player's pieces
        validMoves = validMoves.filter(squareId => !(this.state.activePieces[squareId] && this.state.activePieces[squareId].colour === this.state.turnColour))
        validMoves = validMoves.filter(x => this.squareNames.includes(x)) // Remove any squares that are impossible/NaN/undefined

        // Castling
        if (!piece.hasMoved && !this.getKingIsInCheck(this.state.activePieces, this.state.turnColour)) {

            // Queenside
            if (this.state.activePieces["A" + rank] && this.state.activePieces["A" + rank].hasMoved === false // is Rook still present on A file, and not moved
                && !this.state.activePieces["B" + rank] // Check there are no pieces between the king and rook
                && !this.state.activePieces["C" + rank]
                && !this.state.activePieces["D" + rank]) {
                // Check that king won't pass through check
                let proposedBoard = Object.assign({}, this.state.activePieces)
                proposedBoard["D" + rank] = piece
                delete proposedBoard["E" + rank]
                if (!this.getKingIsInCheck(proposedBoard, this.state.turnColour)) {
                    validMoves.push("C" + rank)
                }
            }

            // Kingside
            if (this.state.activePieces["H" + rank] && this.state.activePieces["H" + rank].hasMoved === false // is Rook still present on H file, and not moved
                && !this.state.activePieces["F" + rank] // Check there are no pieces between the king and rook
                && !this.state.activePieces["G" + rank]) {
                // Check that the king won't pass through check
                let proposedBoard = Object.assign({}, this.state.activePieces)
                proposedBoard["F" + rank] = piece
                delete proposedBoard["E" + rank]
                if (!this.getKingIsInCheck(proposedBoard, this.state.turnColour)) {
                    validMoves.push("G" + rank)
                }
            }
        }
        return validMoves
    }

    getValidQueenMoves(file, rank) {
        let validMoves = this.getValidRookMoves(file, rank)
        validMoves.push(...this.getValidBishopMoves(file, rank))
        return validMoves
    }

    getKingPosition(proposedBoard, turnColour) {
        for (let squareId in proposedBoard) {
            if (proposedBoard[squareId] && proposedBoard[squareId].colour === turnColour && proposedBoard[squareId].value === "King") {
                return squareId
            }
        }
    }

    getKingIsInCheck(proposedBoard, turnColour) {
        let [file, rank] = this.getKingPosition(proposedBoard, turnColour).split("")
        rank = parseInt(rank)

        // Trace out from the king, as if it could move like a Knight. This finds any attacking knights
        for (let square of this.getValidKnightMoves(file, rank)) {
            if (proposedBoard[square] && proposedBoard[square].value === "Knight" && proposedBoard[square].colour !== turnColour) {
                return true
            }
        }

        // Check neighbouring squares for an attacking Pawn
        let direction = turnColour === "white" ? 1 : -1
        for (let attackFile of [this.fileNames[this.fileNames.indexOf(file) - 1], this.fileNames[this.fileNames.indexOf(file) + 1]]) {
            let attackSquare = attackFile + (rank + direction)
            if (proposedBoard[attackSquare] && proposedBoard[attackSquare].value === "Pawn" && proposedBoard[attackSquare].colour !== turnColour) {
                return true
            }
        }

        // Trace out from the king, as if it could move like a Bishop. This finds other attacking Bishops and Queens
        const kingFileIndex = this.fileNames.indexOf(file)
        for (let increments of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) {
            let [iDelta, jDelta] = [...increments]
            for (let i = kingFileIndex + iDelta, j = rank + jDelta; i >= 0 && i <= 7 && j >= 1 && j <= 8; i += iDelta, j += jDelta) {
                let squareId = this.fileNames[i] + j
                let piece = proposedBoard[squareId]
                if (piece) {
                    if (["Queen", "Bishop"].includes(piece.value) && piece.colour !== turnColour) {
                        return true
                    } else {
                        break
                    }
                }
            }
        }

        // Trace out from the king, as if it could move like a Rook, Forwards and backwards. This finds other attacking Rooks and Queens
        for (let direction of [+1, -1]) {
            for (let i = rank + direction; i > 0 && i <= 8; i += direction) {
                let piece = proposedBoard[file + i]
                if (piece) {
                    if (["Queen", "Rook"].includes(piece.value) && piece.colour !== turnColour) {
                        return true
                    } else {
                        break
                    }
                }
            }
        }

        // Trace out from the king, as if it could move like a Rook, Right and Left. This finds other attacking Rooks and Queens
        for (let direction of [1, -1]) {
            for (let i = this.fileNames.indexOf(file) + direction; i >= 0 && i <= 7; i+=direction) {
                let piece = proposedBoard[this.fileNames[i] + rank]
                if (piece) {
                    if (["Queen", "Rook"].includes(piece.value) && piece.colour !== turnColour) {
                        return true
                    } else {
                        break
                    }
                }
            }
        }
        return false
    }

    updateBoardConfiguration = (oldSquareId, newSquareId, piece) => {
        let activePieces = Object.assign({}, this.state.activePieces)
        let captureList = this.state.turnColour === "white" ? "whiteCaptures" : "blackCaptures"
        let capturedPieces = [...this.state[captureList]]

        piece.hasMoved = true
        if (activePieces[newSquareId]) { // An opponent's piece has been captured. Add it to the appropriate capture pile
            capturedPieces.push(activePieces[newSquareId])
        }

        if (piece.value === "Pawn") {
            // If moving a pawn 2 spaces, mark it to be capturable with En Passant. This is used in getValidPawnMoves
            if (Math.abs(oldSquareId[1] - newSquareId[1]) === 2) {
                // console.log("En Passant: ", oldSquareId, newSquareId, this.state.turnNumber)
                piece.enPassant = this.state.turnNumber
            }

            // Pawn has changed file, onto an empty square. This must be an En Passant capture. Capture the passed pawn
            if (oldSquareId[0] !== newSquareId[0] && !activePieces[newSquareId]) {
                let direction = piece.colour === "white" ? 1 : -1
                let captureSquare = newSquareId[0] + (parseInt(newSquareId[1]) - direction)
                capturedPieces.push(activePieces[captureSquare])
                activePieces[captureSquare] = null
            }


        } else if (piece.value === "King") {
            if (oldSquareId[0] === "E" && newSquareId[0] === "C") { // Castling Queenside, move the rook
                activePieces["D" + newSquareId[1]] = activePieces["A" + newSquareId[1]]
                delete activePieces["A" + newSquareId[1]]
            }
            if (oldSquareId[0] === "E" && newSquareId[0] === "G") { // Castling Kingside, move the rook
                activePieces["F" + newSquareId[1]] = activePieces["H" + newSquareId[1]]
                delete activePieces["H" + newSquareId[1]]
            }
        }

        activePieces[newSquareId] = piece
        delete activePieces[oldSquareId]
        return {
            activePieces: activePieces,
            captureList: captureList,
            capturedPieces: capturedPieces

        }
    }

    getCheckmate = () => {
        for (let squareId in this.state.activePieces) {
            if (this.state.activePieces[squareId].colour === this.state.turnColour && this.getValidMoves(squareId, this.state.activePieces[squareId]).length !== 0) {
                return false
            }
        }
        return true
    }
}
