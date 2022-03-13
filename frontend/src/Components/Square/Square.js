import React from "react"

import './Square.css'
import PawnPromotionRank from "../PawnPromotionRank/PawnPromotionRank.js"


class Square extends React.Component {

    render() {
        const containerClass = this.props.isSelected ? "SelectedSquare" : `${this.props.squareType}Square`
        const imgClass = this.props.squareType === "Capture" ? "CaptureSquare" : "Square"
        const imageFile = this.props.piece ? `images/${this.props.piece.colour + this.props.piece.value}.png` : "images/blank.png"
        const clickFunction = () => this.props.onSquareSelect(this.props.squareId, this.props.piece)

        return (
            <span className={"Square " + containerClass}>
                {this.props.isAttackedKing ? <span onClick={clickFunction} className="CheckMarker"/> : null}
                {this.props.isValidMove ? <span onClick={clickFunction} className={this.props.piece ? "CaptureMarker" : "MoveMarker"}/> : null}
                {this.props.squareId && this.props.squareId === this.props.pawnBeingPromoted ?
                    <PawnPromotionRank
                    squareId={this.props.squareId}
                    colour={this.props.playerColour}
                    onPawnPromotion={this.props.onPawnPromotion}/> : null}
                <img id={this.props.squareId} alt="" onClick={clickFunction} className={imgClass} src={imageFile}/>
            </span>
        );
    }
}

export default Square
