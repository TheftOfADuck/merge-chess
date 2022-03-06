import React from "react";
import randomWords from 'random-words';

class NewGameWidget extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            colour: "either",
            privateGame: false,
        }
    }

    test() {
        let words = []
        for (let i = 0; i < 1000000; i++) {
            words.push(randomWords({exactly: 5, join: "-", maxLength: 5}))
        }
        console.log(new Set(words).size)
        console.log(words.length)
    }

    queueGame = (event) => {
        event.preventDefault()
        let colourChoice = [...event.target].filter(x => x.name === "colour").filter(x => x.checked)[0].value
        let privateGame = [...event.target].filter(x => x.name === "privateGame")[0].checked

        if (privateGame) {
        } else {
            this.props.joinPublicGame(colourChoice)
        }
    }


    render() {
        return (
            <>
                <form onSubmit={this.queueGame}>
                    <p>I play as:</p>
                    <fieldset>
                        <input type="radio" value="either" name="colour" defaultChecked/>Either<br/>
                        <input type="radio" value="white" name="colour"/>White<br/>
                        <input type="radio" value="black" name="colour"/>Black<br/>
                    </fieldset>
                    <input name="privateGame" type="checkbox" />Create Private Game<br/>
                    <input type="submit" value="Play" />
                </form>
            </>
        )
    }

}

export default NewGameWidget