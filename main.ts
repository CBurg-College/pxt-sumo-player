enum Player {
    //% block="A"
    //% block.loc.nl="A"
    A,
    //% block="B"
    //% block.loc.nl="B"
    B
}

let PLAYER = Player.A
let PLAYING = false
let POINTS = 0

/*
From here to the 'pxt-sudo-player' specific code,
the code below is a composition and refactoring of:
- the ElecFreaks 'pxt-Cutebot-Pro' library:
  https://github.com/elecfreaks/pxt-Cutebot-Pro/blob/master/v2.ts
All under MIT-license.
*/

enum Led {
    //% block="left"
    //% block.loc.nl="links"
    Left,
    //% block="right"
    //% block.loc.nl="rechts"
    Right,
    //% block="both"
    //% block.loc.nl="beide"
    Both
}

enum Color {
    //% block="none"
    //% block.loc.nl="geen"
    None = 0x000000,
    //% block="green"
    //% block.loc.nl="groen"
    Green = 0x00FF00,
    //% block="blue"
    //% block.loc.nl="blauw"
    Blue = 0x0000FF,
    //% block="yellow"
    //% block.loc.nl="geel"
    Yellow = 0xFFFF00,
    //% block="black"
    //% block.loc.nl="zwart"
    Black = 0x000000,
    //% block="red"
    //% block.loc.nl="rood"
    Red = 0xFF0000,
    //% block="white"
    //% block.loc.nl="wit"
    White = 0xFFFFFF,
    //% block="orange"
    //% block.loc.nl="oranje"
    Orange = 0xFFA500,
    //% block="cyan"
    //% block.loc.nl="cyaan"
    Cyan = 0x00FFFF,
    //% block="magenta"
    //% block.loc.nl="magenta"
    Magenta = 0xFF00FF,
    //% block="indigo"
    //% block.loc.nl="indigo"
    Indigo = 0x4b0082,
    //% block="violet"
    //% block.loc.nl="violet"
    Violet = 0x8a2be2,
    //% block="purple"
    //% block.loc.nl="paars"
    Purple = 0xFF00FF
}

enum Tracking {
    //% block="◌ ◌ ◌ ◌" 
    State_0,
    //% block="● ◌ ◌ ◌" 
    State_1,
    //% block="◌ ● ◌ ◌" 
    State_2,
    //% block="● ● ◌ ◌" 
    State_3,
    //% block="◌ ◌ ● ◌" 
    State_4,
    //% block="● ◌ ● ◌" 
    State_5,
    //% block="◌ ● ● ◌" 
    State_6,
    //% block="● ● ● ◌" 
    State_7,
    //% block="◌ ◌ ◌ ●" 
    State_8,
    //% block="● ◌ ◌ ●" 
    State_9,
    //% block="◌ ● ◌ ●" 
    State_10,
    //% block="● ● ◌ ●"
    State_11,
    //% block="◌ ◌ ● ●" 
    State_12,
    //% block="● ◌ ● ●" 
    State_13,
    //% block="◌ ● ● ●" 
    State_14,
    //% block="● ● ● ●" 
    State_15
}

enum TrackValue {
    //% block="◌" 
    Off = 0,
    //% block="●" 
    On = 1
}

enum TrackSensor {
    //% block="far left"
    //% block.loc.nl="ver links"
    FarLeft = 1,
    //% block="left"
    //% block.loc.nl="links"
    Left = 2,
    //% block="right"
    //% block.loc.nl="rechts"
    Right = 4,
    //% block="far right"
    //% block.loc.nl="ver rechts"
    FarRight = 8
}

namespace CutebotProV2 {

    const cutebotProAddr = 0x10

    function delay_ms(ms: number) {
        let endTime = input.runningTime() + ms;
        while (endTime > input.runningTime()) { }
    }

    export function pid_delay_ms(ms: number) {
        let time = control.millis() + ms
        while (1) {
            i2cCommandSend(0xA0, [0x05])
            if (pins.i2cReadNumber(cutebotProAddr, NumberFormat.UInt8LE, false) || control.millis() >= time) {
                basic.pause(500)
                break
            }
            basic.pause(10)
        }
    }

    export function i2cCommandSend(command: number, params: number[]) {
        let buff = pins.createBuffer(params.length + 4);
        buff[0] = 0xFF;
        buff[1] = 0xF9;
        buff[2] = command;
        buff[3] = params.length;
        for (let i = 0; i < params.length; i++) {
            buff[i + 4] = params[i];
        }
        pins.i2cWriteBuffer(cutebotProAddr, buff);
        delay_ms(1);
    }

    export function motorControl(leftSpeed: number, rightSpeed: number): void {
        // speed in % [-100, 100]

        if (!PLAYING) return

        let direction: number = 0;
        if (leftSpeed < 0)
            direction |= 0x01;
        if (rightSpeed < 0)
            direction |= 0x02;
        i2cCommandSend(0x10, [2, Math.abs(leftSpeed), Math.abs(rightSpeed), direction]);
    }

    export function runDistance(speed: number, distance: number): void {
        // speed in % [-100, -40] backward and [40, 100] forward
        // distance in cm [0, 6000]

        if (!PLAYING) return

        distance = ((distance > 6000 ? 6000 : distance) < 0 ? 0 : distance);
        distance *= 10 // cm to mm
        let distance_h = distance >> 8;
        let distance_l = distance & 0xFF;

        let direction: number
        if (speed <= 0) {
            speed = -speed
            direction = 3
        } else
            direction = 0
  
        speed *= 5 // % to mm/s
        speed = ((speed > 500 ? 500 : speed) < 200 ? 200 : speed);
        let speed_h = speed >> 8;
        let speed_l = speed & 0xFF;

        i2cCommandSend(0x84, [distance_h, distance_l, speed_h, speed_l, direction]);
        pid_delay_ms(Math.round(distance * 1.0 / 1000 * 8000 + 3000))
    }

    export function servoControl(angle: number): void {
        // angle [0, 180]

        if (!PLAYING) return

        i2cCommandSend(0x40, [1, angle]);
    }

    export function ledColor(led: Led, rgb: number): void {
        let red = (rgb >> 16) & 0xFF;
        let green = (rgb >> 8) & 0xFF;
        let blue = (rgb) & 0xFF;
        i2cCommandSend(0x20, [led, red, green, blue]);
    }

    export function trackingState(): number {
        i2cCommandSend(0x60, [0x00])
        let state = pins.i2cReadNumber(cutebotProAddr, NumberFormat.UInt8LE, true)
        return state
    }

/*
    export function trackSensor(sensor: TrackSensor): number {
        let channel: number
        switch (sensor) {
            case TrackSensor.FarLeft: channel = 0; break;
            case TrackSensor.Left: channel = 0; break;
            case TrackSensor.Right: channel = 0; break;
            case TrackSensor.FarRight: channel = 0; break;
        }
        i2cCommandSend(0x60, [0x02, channel])
        return pins.i2cReadNumber(cutebotProAddr, NumberFormat.UInt8LE, false)
    }
*/
}

/*
Next code is original to the current 'pxt-soccer-player' library.
(MIT-license)
*/

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

input.onButtonPressed(Button.A, function () {
    if (PLAYER == Player.A)
        PLAYER = Player.B
    else
        PLAYER = Player.A
    display()
})

input.onButtonPressed(Button.B, function () {
    CutebotProV2.motorControl(0, 0)
})

type eventHandler = () => void
let EventLeftOutOfField: eventHandler
let EventRightOutOfField: eventHandler
let EventBothOutOfField: eventHandler
let EventWinner: eventHandler
let EventLoser: eventHandler

function handle(cmd: number) {

    /*
        commands are defined in pxt-soccer as:
    
        export enum COMMAND {
            Start,
            Stop,
            PointA,
            PointB,
            DisallowA,
            DisallowB,
            WinnerA,
            WinnerB,
            DisqualA,
            DisqualB
        }
    */
    switch (cmd) {
        case CMatch.COMMAND.Start:
            PLAYING = true
            break;
        case CMatch.COMMAND.PointA:
            if (PLAYER == Player.A) {
                POINTS += 1
                display()
            }
            break;
        case CMatch.COMMAND.PointB:
            if (PLAYER == Player.B) {
                POINTS += 1
                display()
            }
            break;
        case CMatch.COMMAND.DisallowA:
            if (PLAYER == Player.A && POINTS > 0) {
                POINTS -= 1
                display()
            }
            break;
        case CMatch.COMMAND.DisallowB:
            if (PLAYER == Player.B && POINTS > 0) {
                POINTS -= 1
                display()
            }
            break;
        case CMatch.COMMAND.WinnerA:
        case CMatch.COMMAND.DisqualB:
            if (PLAYER == Player.A) {
                if (EventWinner) EventWinner()
                display()
            }
            else {
                if (EventLoser) EventLoser()
                display()
            }
            break;
        case CMatch.COMMAND.WinnerB:
        case CMatch.COMMAND.DisqualA:
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
    PLAYING = (cmd == CMatch.COMMAND.Start)
}

function display() {
    basic.showNumber(POINTS)
}

//% color="#00CC00" icon="\uf1f9"
//% block="Sudo"
//% block.loc.nl="Sudo"
namespace CSudoPlayer {

    let SPEED = 0

    //% color="#FFCC00"
    //% block="when left side is out of the field"
    //% block.loc.nl="wanneer de linkerkant buiten het speelveld is"
    export function onEventLeftOutOfField(programmableCode: () => void): void {
        EventLeftOutOfField = programmableCode;
    }

    //% color="#FFCC00"
    //% block="when right side is out of the field"
    //% block.loc.nl="wanneer de rechterkant buiten het speelveld is"
    export function onEventRightOutOfField(programmableCode: () => void): void {
        EventRightOutOfField = programmableCode;
    }

    //% color="#FFCC00"
    //% block="when both sides are out of the field"
    //% block.loc.nl="wanneer beide kanten uit het speelveld zijn"
    export function onEventBothOutOfField(programmableCode: () => void): void {
        EventBothOutOfField = programmableCode;
    }

    basic.forever(function () {
        let state = CutebotProV2.trackingState()
        let left = state & (TrackSensor.FarLeft + TrackSensor.Left)
        let right = state & (TrackSensor.FarRight + TrackSensor.Right)
        if (left && right) {
            if (EventBothOutOfField) EventBothOutOfField
        }
        else
        if (left) {
            if (EventLeftOutOfField) EventLeftOutOfField
        }
        else
        if (right) {
            if (EventRightOutOfField) EventRightOutOfField
        }
    })

    //% block="game started"
    //% block.loc.nl="spel is gestart"
    export function isPlaying() {
        return PLAYING
    }

    //% subcategory="Bewegen"
    //% block="run %cm cm %dir and %bend"
    //% block.loc.nl="rijd %cm cm %dir en %bend"
    //% cm.max=200 cm.min=0
    export function run(cm: number, dir: Move, bend: Bend) {
    }

    //% subcategory="Bewegen"
    //% block="push the opponent"
    //% block.loc.nl="duw de tegenstander"
    export function pushOpponent() {
    }

    //% subcategory="Bewegen"
    //% block="run to the opponent"
    //% block.loc.nl="rijd naar de tegenstander"
    export function approachOpponent() {
    }

    //% subcategory="Bewegen"
    //% block="turn to the opponent"
    //% block.loc.nl="draai richting tegenstander"
    export function findOpponent() {
    }

    //% subcategory="Bewegen"
    //% block="stop"
    //% block.loc.nl="stop"
    export function stop() {
        CutebotProV2.motorControl(0, 0)
    }

    //% subcategory="Kleuren"
    //% color="#FFCC44"
    //% block="show color %color"
    //% block.loc.nl="toon de kleur %color"
    //% color.defl=Color.White
    export function showColor(color: Color) {
    }

    //% subcategory="Kleuren"
    //% color="#FFCC44"
    //% block="turn both leds off"
    //% block.loc.nl="schakel beide leds uit"
    export function turnLedsOff() {
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