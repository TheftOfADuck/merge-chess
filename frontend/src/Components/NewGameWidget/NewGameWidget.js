import React from "react"

class NewGameWidget extends React.Component {

    queueGame = (event) => {
        event.preventDefault()
        let colourChoice = [...event.target].filter(x => x.name === "colour").filter(x => x.checked)[0].value
        let privateGame = [...event.target].filter(x => x.name === "privateGame")[0].checked

        if (privateGame) {
            this.props.createPrivateGame(colourChoice)
        } else {
            this.props.joinPublicGame(colourChoice)
        }
    }

    joinPrivateGame = (event) => {
        event.preventDefault()
        let colourChoice = [...event.target].filter(x => x.name === "colour").filter(x => x.checked)[0].value
        let gameId = [...event.target].filter(x => x.id === "gameId")[0].value
        this.props.joinPrivateGame(colourChoice, gameId)
    }

    render() {
        return (
            <>
                {this.props.gameId && !this.props.checkmate ?
                    <>
                        <p><strong>Game ID:</strong> {this.props.gameId}</p>
                    </> :
                    <>
                        <div>
                            <fieldset>
                                <h3>Create New Game</h3>
                                <form onSubmit={this.queueGame}>
                                    <p>I play as:</p>
                                    <input type="radio" value="either" name="colour" defaultChecked/>Either<br/>
                                    <input type="radio" value="white" name="colour"/>White<br/>
                                    <input type="radio" value="black" name="colour"/>Black<br/><br/>
                                    <input name="privateGame" type="checkbox"/>Create Private Game<br/>
                                    <input type="submit" value="Play"/>
                                </form>
                            </fieldset>
                        </div>
                        <div>
                            <fieldset>
                                <h3>Join Private Game</h3>
                                <form onSubmit={this.joinPrivateGame}>
                                    <p>I play as:</p>
                                    <input type="radio" value="either" name="colour" defaultChecked/>Either<br/>
                                    <input type="radio" value="white" name="colour"/>White<br/>
                                    <input type="radio" value="black" name="colour"/>Black<br/>
                                    <label htmlFor="gameId">Game ID: </label><input id="gameId"/><br/>
                                    <input type="submit" value="Join"/>
                                </form>
                            </fieldset>
                        </div>
                    </>
                }
            </>
        )
    }

}

export default NewGameWidget
