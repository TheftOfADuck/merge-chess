import React from "react"

import './board.css'
import Square from "../Square/Square.js"

class Board extends React.Component {

    render() {

        let rankNames = ["1", "2", "3", "4", "5", "6", "7", "8"]
        let fileNames = ["A", "B", "C", "D", "E", "F", "G", "H"]
        let grid = []

        for (let i = 0; i < rankNames.length; i++) {
            let rank = []
            for (let j = 0; j < fileNames.length; j++) {
                let squareIsBlack = (i % 2 === 0 && j % 2 === 0) || (i % 2 === 1 && j % 2 === 1)
                let squareType = squareIsBlack ? "Black" : "White"
                let squareId = fileNames[j] + rankNames[i]
                rank.push((
                    <Square key={j}
                            squareId={squareId}
                            piece={this.props.pieces[squareId]}
                            squareType={squareType}
                            onSquareSelect={this.props.onSquareSelect}

                            // Attributes used to draw marker circles
                            isSelected={squareId === this.props.selectedSquare}
                            isValidMove={this.props.validMoves.includes(squareId)}
                            isAttackedKing={squareId === this.props.attackedKing}

                            // Attributes used to render the PawnPromotionRank
                            pawnBeingPromoted={this.props.pawnBeingPromoted}
                            onPawnPromotion={this.props.onPawnPromotion}
                            playerColour={this.props.playerColour}
                    />
                ))
            }
            if (this.props.playerColour === "black") {
                rank.reverse()
            }
            grid.splice(0, 0, <div key={i} className="boardRank">{rank}</div>)
        }

        if (this.props.playerColour === "black") {
            grid.reverse()
        }
        return grid
    }
}

export default Board
