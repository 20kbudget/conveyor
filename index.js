// @flow
const regl = require('regl')();

const identity = require('gl-mat4/identity');
const perspective = require('gl-mat4/perspective');
const lookAt = require('gl-mat4/lookAt');
const rotateZ = require('gl-mat4/rotateZ');
const translate = require('gl-mat4/translate');
const add = require('gl-vec3/add');
const subtract = require('gl-vec3/subtract');
const { drawTrack, getTilePath } = require('./src/track');
const parseTrack = require('./src/trackParser');
const { DIRECTION_CW, DIRECTION_CCW } = require('./src/animations');
const { drawPlayer } = require('./src/player');

// const cameraDistance = 50;
const cameraDistance = 130;

const tileSize = 8 * 8 / 10;
const view = lookAt([], [0, 0, cameraDistance], [0, 0, 0], [0, 1.0, 0]);
const projection = ({ viewportWidth, viewportHeight }) =>
    perspective([], Math.PI / 3, viewportWidth / viewportHeight, 0.01, 1000);

const tracks = [
    'l,r,r,r,l', // convoluted turn
    'l,l,l,l', // INVALID only curves, minimal circle
    'l,r,r,r,l,r,r,r', // INVALID only curves, small 8
    'l,r,r,r,l,l,r,r,r,l,l,r,r,r,l,l,r,r,r,l', // INVALID X
    'l,r,f,r,r,f,l,l,f,r,r,f,r,l,l,r,r,r,l,l,r,r,r,l', // scissor
    'r(f,f)f,r,f,f,r,f,r(f,f)f,r,f,f,r,f', // simple map 1
    'r(f,f)f,r,f,f,r,f,b(l,f,f,begin)r,f,f,r', // simple map easy
    // 'l,r,r,b(f)r,l,f,r,r(f)f,f,r,f,r,r(f)l(l,f)f,f', // nice map 1
    // 'l,r,r,b(f,l,r,l,f,f,r,l,l,l,r,r,r,l,l,l,r,f,l,r,l,r,l,f,f,f,r,l,f)r,l,f,r,r(f)f,f,r,f,r,r(f)l(l,f)f,f',
    // 'f,f,f,l,f,l,r(r,f,f,f)l(l,f,f,r,f,r,f,f,f)f,f,f,f,bl,f,r(f,f,f)f,r,f,f,f,r,l(r,r,l,r,f,f,f)f,r(f,f,f)f,b(l,f,f,f)r,f,f,f',
    // 'f,f(r)l', // @BUG @TBD
    // 'l(f,r,f,r,l,r,r,l,f,f,l)f,r,l,r(l,f,l,f)l(l,f,r,r,f,f,br,r)f,r,f,r,f,f,f,l,r,r,r,l,f,f,l,r,r,r,l',// meh, not great..

];
const track = tracks[tracks.length - 1];
const halfTile = tileSize / 2;
const trackOffset = [0, 0, 0];
// const trackOffset = [+tileSize * 0.8, 0, 0];
// const playerOffset = trackOffset
const playerOffset = subtract([], trackOffset, [halfTile, 0, 0]);
const tiles = parseTrack({
    track,
    angle: 0,
    // angle: 90,
    offset: trackOffset,
    reverse: false
});

let state = {
    player: {
        position: playerOffset,
        angleZ: 0,
        animations: {
            move: {
                progress: 0,
                update: () => null
            }
        }
    }
};

const rad = degree => degree * Math.PI / 180;
const drawPlayerParams = ({ position, angleZ }, index) => {
    const translation = translate([], identity([]), position);
    const rotation = rotateZ([], identity([]), rad(angleZ));
    const colorA = [0.8, 0.3, 0, 1];
    const colorB = [1, 1, 0, 1];
    // const color = angleZ % (Math.PI / 2) === 0 ? colorB : colorA;
    const color = colorA;
    return {
        color,
        translation,
        rotation,
        view,
        projection
    };
};

const curveVsLineRatio = 0.6;
let steps = 60;
let curveSteps = Math.round(steps * curveVsLineRatio);

regl.clear({ color: [0, 0, 0, 1] });
drawTrack({ tiles, view, projection });

console.log({ playerOffset });
let tick = regl.frame((context) => {
    // console.log({context})
    // console.log(context.tick);
    console.log(context.time);
    // const nextPlayer =
    const nextState = {
        // player: nextPlayer
    }
    getTilePath({
        position: playerOffset,
        tileDimensions: [tileSize, tileSize, 0],
        trackOffset,
        track: tiles
    });
})

// stop after x seconds (dev-mode)
window.setTimeout(() => {
    tick.cancel();
}, 2000)





