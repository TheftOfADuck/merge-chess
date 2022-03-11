import React from "react"

import './PawnPromotionRank.css'


class PawnPromotionRank extends React.Component {

    render() {
        let queen = {colour: this.props.colour, value: "Queen", hasMoved: true}
        let knight = {colour: this.props.colour, value: "Knight", hasMoved: true}
        let rook = {colour: this.props.colour, value: "Rook", hasMoved: true}
        let bishop = {colour: this.props.colour, value: "Bishop", hasMoved: true}

        return (
            <div className="PromotionRank">
                <img alt="" onClick={() => this.props.onPawnPromotion(this.props.squareId, queen)} className="PromotionSquare" src={`images/${this.props.colour}Queen.png`}/>
                <img alt="" onClick={() => this.props.onPawnPromotion(this.props.squareId, knight)} className="PromotionSquare" src={`images/${this.props.colour}Knight.png`}/>
                <img alt="" onClick={() => this.props.onPawnPromotion(this.props.squareId, rook)} className="PromotionSquare" src={`images/${this.props.colour}Rook.png`}/>
                <img alt="" onClick={() => this.props.onPawnPromotion(this.props.squareId, bishop)} className="PromotionSquare" src={`images/${this.props.colour}Bishop.png`}/>
            </div>
        )
    }
}

export default PawnPromotionRank
