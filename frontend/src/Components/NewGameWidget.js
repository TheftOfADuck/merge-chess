import React from "react";

class NewGameWidget extends React.Component {

    constructor(props) {
        super(props);
    }

    queueGame = (event) => {
        event.preventDefault()
        let colourChoice = [...event.target].filter(x => x.name === "colour").filter(x => x.checked)[0].value
        let privateGame = [...event.target].filter(x => x.name === "privateGame")[0].checked

        if (privateGame) {
            console.log("Created private game")
            this.props.createPrivateGame(colourChoice)
        } else {
            this.props.joinPublicGame(colourChoice)
        }
    }

    joinPrivateGame = (event) => {
        event.preventDefault()
    }

    render() {
        return (
            <>
                {this.props.gameCode ?
                    <>
                        <p><strong>Invite code:</strong> {this.props.gameCode}</p>
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
                                    <label htmlFor="gameCode">Game Code: </label><input id="gameCode"/>
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
