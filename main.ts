enum Player {
    //% block="blue"
    //% block.loc.nl="blauw"
    A,
    //% block="yellow"
    //% block.loc.nl="geel"
    B
}

let PLAYER = Player.A
let PLAYING = false

// Next code is original to the current 'pxt-soccer-player' library.
// (MIT-license)

let DIAMETER = 100 // field diameter in cm
let NEAR = false   // close to the oppenent after running to it

basic.showNumber(1)
basic.pause(1000)
display()

enum Move {
    //% block="forward"
    //% block.loc.nl="vooruit"
    Forward,
    //% block="backward"
    //% block.loc.nl="achteruit"
    Backward
}

enum Bend {
    //% block="go straight"
    //% block.loc.nl="ga rechtdoor"
    None,
    //% block="turn to the left"
    //% block.loc.nl="draai naar links"
    Left,
    //% block="turn to the right"
    //% block.loc.nl="draai naar rechts"
    Right
}

enum Side {
    //% block="both sides"
    //% block.loc.nl="beide kanten"
    Both,
    //% block="the left side"
    //% block.loc.nl="de linker kant"
    Left,
    //% block="the right side"
    //% block.loc.nl="de rechter kant"
    Right
}

type eventHandler = () => void
let EventLeftOutOfField: eventHandler
let EventRightOutOfField: eventHandler
let EventBothOutOfField: eventHandler
let EventWinner: eventHandler
let EventLoser: eventHandler

setMatchHandling(() => {
    switch (MATCH) {
        case Match.Start:
            PLAYING = true
            break;
        case Match.Stop:
            Cutebot.setSpeed(0, 0)
            PLAYING = false
            break;
        case Match.WinnerA:
        case Match.DisqualB:
            if (PLAYER == Player.A) {
                if (EventWinner) EventWinner()
                display()
            }
            else {
                if (EventLoser) EventLoser()
                display()
            }
            break;
        case Match.WinnerB:
        case Match.DisqualA:
            if (PLAYER == Player.B) {
                if (EventWinner) EventWinner()
                display()
            }
            else {
                if (EventLoser) EventLoser()
                display()
            }
            break;
    }
    PLAYING = (MATCH == Match.Start)
})

function display() {
    if (PLAYER == Player.A)
        Cutebot.ledColor(Led.Both, Color.Blue)
    else
        Cutebot.ledColor(Led.Both, Color.Yellow)
}

displayAfterLogo(() => {
    display()
})

input.onButtonPressed(Button.A, function () {
    if (PLAYER == Player.A)
        PLAYER = Player.B
    else
        PLAYER = Player.A
    display()
})

input.onButtonPressed(Button.B, function () {
    Cutebot.setSpeed(0, 0)
    PLAYING = false
})

basic.forever(function () {
    let state = Cutebot.readTracking()
    let left = state & (TrackSensor.FarLeft + TrackSensor.Left)
    let right = state & (TrackSensor.FarRight + TrackSensor.Right)
    if (left && right)
        if (EventBothOutOfField) EventBothOutOfField
    if (left)
        if (EventLeftOutOfField) EventLeftOutOfField
    if (right)
        if (EventRightOutOfField) EventRightOutOfField
})

//% color="#00CC00" icon="\uf1f9"
//% block="Sumo"
//% block.loc.nl="Sumo"
namespace CSumoPlayer {

    //% color="#FFCC00"
    //% block="when %side is out of the field"
    //% block.loc.nl="wanneer %side buiten het speelveld is"
    export function onEventLeftOutOfField(side: Side, programmableCode: () => void): void {
        switch (side) {
            case Side.Both: EventBothOutOfField = programmableCode; break;
            case Side.Left: EventLeftOutOfField = programmableCode; break;
            case Side.Right: EventRightOutOfField = programmableCode; break;
        }
    }

    //% block="game started"
    //% block.loc.nl="spel is gestart"
    export function isPlaying() {
        return PLAYING
    }

    //% block="stop"
    //% block.loc.nl="stop"
    export function stop() {
        Cutebot.setSpeed(0, 0)
    }

    //% block="move %dir and %bend"
    //% block.loc.nl="rijd %dir en %bend"
    export function move(dir: Move, bend: Bend) {
        let speed: number
        if (dir == Move.Forward) speed = 20
        else speed = -20

        switch (bend) {
            case Bend.None: Cutebot.setSpeed(speed, speed); break;
            case Bend.Left: Cutebot.setSpeed(speed/2, speed); break;
            case Bend.Right: Cutebot.setSpeed(speed, speed/2); break;
        }
    }

    //% block="push the opponent"
    //% block.loc.nl="duw de tegenstander"
    export function pushOpponent() {
        let cm = Cutebot.readDistance()
        if (cm > 20) return
        Cutebot.setSpeed(100, 100)
    }

    //% block="the opponent is close"
    //% block.loc.nl="de tegenstander dichtbij is"
    export function nearOpponent(): boolean {
        let val = NEAR
        NEAR = false
        return val
    }

    //% block="run to the opponent"
    //% block.loc.nl="rijd naar de tegenstander"
    export function runToOpponent() {
        NEAR = false
        let cm = Cutebot.readDistance()
        if (cm > DIAMETER) return
        let tm = input.runningTime() + cm * 1000 / 25
        Cutebot.setSpeed(20, 20)
        do {
            cm = Cutebot.readDistance()
            if (cm > DIAMETER) {
                Cutebot.setSpeed(0, 0)
                return;
            }
        } while (cm > 20  && input.runningTime() < tm)
        Cutebot.setSpeed(0, 0)
        NEAR = true
    }

    //% block="turn to the opponent"
    //% block.loc.nl="draai richting tegenstander"
    export function findOpponent() {
        Cutebot.setSpeed(-15, 15)
        while (Cutebot.readDistance() > DIAMETER) {}
        Cutebot.setSpeed(0, 0)
    }

    //% block="choose player %player"
    //% block.loc.nl="kies speler %player"
    export function setPlayer(player: Player) {
        PLAYER = player
        display()
    }

    //% subcategory="Show"
    //% color="#00CC00"
    //% block="turn %led color %color"
    //% block.loc.nl="kleur %led %color"
    //% color.defl=Color.White
    export function showColor(led: Led, color: Color) {
        Cutebot.ledColor(led, color)
    }

    //% subcategory="Show"
    //% color="#00CC00"
    //% block="turn both leds off"
    //% block.loc.nl="schakel beide leds uit"
    export function turnLedsOff() {
        Cutebot.ledColor( Led.Both, Color.None)
    }

    //% subcategory="Show"
    //% color="#FFCC00"
    //% block="when the loser"
    //% block.loc.nl="als er verloren is"
    export function onEventLoser(programmableCode: () => void): void {
        EventLoser = programmableCode;
    }

    //% subcategory="Show"
    //% color="#FFCC00"
    //% block="when the winner"
    //% block.loc.nl="als er gewonnen is"
    export function onEventWinner(programmableCode: () => void): void {
        EventWinner = programmableCode;
    }
}
