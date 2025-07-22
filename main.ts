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

enum Led {
    //% block="left led"
    //% block.loc.nl="linker led"
    Left,
    //% block="right led"
    //% block.loc.nl="rechter led"
    Right,
    //% block="both leds"
    //% block.loc.nl="beide leds"
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

//        if (!PLAYING) return

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

//        if (!PLAYING) return

        distance = ((distance > 6000 ? 6000 : distance) < 0 ? 0 : distance);
        distance *= 10 // cm to mm
        let distance_h = distance >> 8;
        let distance_l = distance & 0xFF;

        let direction2: number
        if (speed <= 0) {
            speed = -speed
            direction2 = 3
        } else
            direction2 = 0
  
        speed *= 5 // % to mm/s
        speed = ((speed > 500 ? 500 : speed) < 200 ? 200 : speed);
        let speed_h = speed >> 8;
        let speed_l = speed & 0xFF;

        i2cCommandSend(0x84, [distance_h, distance_l, speed_h, speed_l, direction2]);
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

    export function ultrasonic(): number {
        // send pulse
        pins.setPull(DigitalPin.P8, PinPullMode.PullNone);
        pins.digitalWritePin(DigitalPin.P8, 0);
        control.waitMicros(2);
        pins.digitalWritePin(DigitalPin.P8, 1);
        control.waitMicros(10);
        pins.digitalWritePin(DigitalPin.P8, 0);
        // read pulse
        const d = pins.pulseIn(DigitalPin.P12, PulseValue.High, 2500) / 0.96;
        if (!d) return 999
        return Math.floor(d * 34 / 2 / 1000);
    }
}

// Next code is original to the current 'pxt-soccer-player' library.
// (MIT-license)

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

function handle(cmd: number) {
    switch (cmd) {
        case CMatch.COMMAND.Start:
            PLAYING = true
            break;
        case CMatch.COMMAND.Stop:
            CutebotProV2.motorControl(0, 0)
            PLAYING = false
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
    if (PLAYER == Player.A)
        CutebotProV2.ledColor(Led.Both, Color.Blue)
    else
        CutebotProV2.ledColor(Led.Both, Color.Yellow)
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
    PLAYING = false
})

basic.forever(function () {
    let state = CutebotProV2.trackingState()
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
        CutebotProV2.motorControl(0, 0)
    }

    //% block="move %dir and %bend"
    //% block.loc.nl="rijd %dir en %bend"
    export function run(dir: Move, bend: Bend) {
        let speed: number
        if (dir == Move.Forward) speed = 20
        else speed = -20

        switch (bend) {
            case Bend.None: CutebotProV2.motorControl(speed, speed); break;
            case Bend.Left: CutebotProV2.motorControl(speed/2, speed); break;
            case Bend.Right: CutebotProV2.motorControl(speed, speed/2); break;
        }
    }

    //% block="turn to the opponent"
    //% block.loc.nl="draai richting tegenstander"
    export function findOpponent() {
        let cm: number
        CutebotProV2.motorControl(-14, 14)
        do {
            cm = CutebotProV2.ultrasonic()
        } while (cm < 5|| cm > 30)
        CutebotProV2.motorControl(0, 0)
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
        CutebotProV2.ledColor(led, color)
    }

    //% subcategory="Show"
    //% color="#00CC00"
    //% block="turn both leds off"
    //% block.loc.nl="schakel beide leds uit"
    export function turnLedsOff() {
        CutebotProV2.ledColor( Led.Both, Color.None)
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
