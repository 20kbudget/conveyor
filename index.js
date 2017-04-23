// @flow
const regl = require('regl')();
const identity = require('gl-mat4/identity');
const scale = require('gl-mat4/scale');
const perspective = require('gl-mat4/perspective');
const lookAt = require('gl-mat4/lookAt');
const rotateZ = require('gl-mat4/rotateZ');
const translate = require('gl-mat4/translate');
const { vecSum } = require('./src/vectors');
const { drawTrack, parseTrack } = require('./src/track');
const {
    drawPlayer,
    lineMove,
    printLinePath,
    trailDebug,
    DIRECTION_CW,
    DIRECTION_CCW
} = require('./src/player');

const cameraDistance = 80;

const tileSize = 8 * 8 / 10;
const view = lookAt([], [0, 0, cameraDistance], [0, 0, 0], [0, 1.0, 0]);
const projection = ({ viewportWidth, viewportHeight }) =>
    perspective([], Math.PI / 3, viewportWidth / viewportHeight, 0.01, 1000);

const tracks = [
    'l,r,r,r,l', // convoluted turn
    'l,l,l,l', // INVALID only curves, minimal circle
    'l,r,r,r,l,r,r,r', // INVALID only curves, small 8
    'l,r,r,r,l,l,r,r,r,l,l,r,r,r,l,l,r,r,r,l', // X
    'begin,f,l,r,lR,fl,fr,flR,end', //all tiles one of each
    // 'l,r,r,l(f,f)r,l,f,r,f,r,f,r,r(f)f', //WIP
    'l,r,r,lR,l,f,r,Fr,r,f,r,fr',
    'f,r,r,f,r,r',
    'l,r,r,lR,l,f,r,Fr,r,f,r,fr'
];
const track = tracks[tracks.length - 1];
const trackOffset = [tileSize / 2, 0, 0];
const tiles = parseTrack({ track, direction: 0, offset: trackOffset });

let state = {
    player: {
        position: vecSum(trackOffset, [-tileSize / 2, 0, 0]),
        angleZ: 0
    }
};

const drawPlayerParams = ({ position, angleZ }, index) => {
    const translation = translate([], identity([]), position);
    const rotation = rotateZ([], identity([]), angleZ);
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

const radius = tileSize / 2;
// const curveVsLineRatio = 0.75 * Math.PI / 4;
const curveVsLineRatio = 0.6;
console.log(curveVsLineRatio);
let steps = 60;
let curveSteps = Math.round(steps * curveVsLineRatio);
// let states = [];
let states = [state];
let lineDebugParams = [states, steps, radius];
let debugParams = [states, curveSteps, radius];

let center = vecSum(state.player.position, [0, radius, 0]);
state = trailDebug(...debugParams, center, -90, 0, DIRECTION_CCW);

center = vecSum(state.player.position, [radius, 0, 0]);
state = trailDebug(...debugParams, center, -180, 90, DIRECTION_CW);

center = vecSum(state.player.position, [0, -radius, 0]);
state = trailDebug(...debugParams, center, 90, 0, DIRECTION_CW);

center = vecSum(state.player.position, [-radius, 0, 0]);
state = trailDebug(...debugParams, center, 0, -90, DIRECTION_CW);

center = vecSum(state.player.position, [0, -radius, 0]);
state = trailDebug(...debugParams, center, 90, -180, DIRECTION_CCW);

// // alternate first curve
// let center = vecSum(state.player.position, [0, -radius, 0]);
// state = trailDebug(...debugParams, center, 90, 0, DIRECTION_CW);

// alternate path removes this
state = printLinePath(tileSize, -90, ...lineDebugParams);

center = vecSum(state.player.position, [-radius, 0, 0]);
state = trailDebug(...debugParams, center, 0, -90, DIRECTION_CW);

state = printLinePath(tileSize, -180, ...lineDebugParams);

center = vecSum(state.player.position, [0, radius, 0, 0]);
state = trailDebug(...debugParams, center, -90, -180, DIRECTION_CW);

// alternate path removes this
state = printLinePath(tileSize, 90, ...lineDebugParams);

center = vecSum(state.player.position, [radius, 0, 0]);
state = trailDebug(...debugParams, center, -180, 90, DIRECTION_CW);

state = printLinePath(tileSize, 0, ...lineDebugParams);

let players = states.map((state, index) =>
    drawPlayerParams(state.player, index)
);
regl.clear({ color: [0, 0, 0, 1] });
drawTrack({ tiles, view, projection });
drawPlayer(players);

let frameCount = 0;
const secondFrame = regl.frame(() => {
    // console.log('foo')
    // drawPlayer([players[frameCount], players[(frameCount + 32) % players.length]]);
    // drawPlayer([players[frameCount], players[(frameCount + 24) % players.length]]);
    drawPlayer(players[frameCount]);
    // drawPlayer(players.filter((p,i) => (frameCount == i)));
    frameCount = (frameCount + 1) % players.length;
    // secondFrame.cancel();
});
