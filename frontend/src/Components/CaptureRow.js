import React from "react";
import Square from "./Square";


class CaptureRow extends React.Component {

    render() {
        return (
            <div>
                {this.props.capturedPieces.map((x, i) => <Square key={i} piece={x} squareType="Capture"/>)}
            </div>
        )
    }
}

export default CaptureRow
