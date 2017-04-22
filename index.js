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

const cameraDistance = 40;

const tileSize = 8 * 8 / 10;
const view = lookAt([], [0, 0, cameraDistance], [0, 0, 0], [0, 1.0, 0]);
const projection = ({ viewportWidth, viewportHeight }) =>
    perspective([], Math.PI / 3, viewportWidth / viewportHeight, 0.01, 1000);

const tracks = [
    'n,n,n,n',
    'w,n,n,w,n,n',
    'w,n,w,n,w,n,w,n',
    'w,w,n,n,w,w,w,n,n,w',
    'begin,w,n,Ns,w,w,w,s,s,w,w,w,s',
    'w,nS,w,s,s,n,s,Ws,s,w,w,s,s',
    'begin,w,n,s,nS,wn,ws,wnS,end', //all tiles one of each
    'n,s,s,s,n,n,s,s,s,n,n,s,s,s,n,n,s,s,s,n', // X
    'n,s,s,s,n', // convoluted turn
    'n,s,s,s,n,s,s,s', // small 8, only curves, we shouldnt allow this
    'n,s,s,s,n,w,s,w,s,w,s,w'
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
    const colorA = [0.8, 0.3, 0, 1]
    const colorB = [1, 1, 0, 1]
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

let steps = 10;
// let states = [];
let states = [state];
const radius = tileSize / 2;
let debugParams = [states, steps, radius];

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

state = printLinePath(tileSize, -90, ...debugParams);

center = vecSum(state.player.position, [-radius, 0, 0]);
state = trailDebug(...debugParams, center, 0, -90, DIRECTION_CW);

state = printLinePath(tileSize, -180, ...debugParams);

center = vecSum(state.player.position, [0, radius, 0, 0]);
state = trailDebug(...debugParams, center, -90, -180, DIRECTION_CW);

state = printLinePath(tileSize, 90, ...debugParams);

center = vecSum(state.player.position, [radius, 0, 0]);
state = trailDebug(...debugParams, center, -180, 90, DIRECTION_CW);

state = printLinePath(tileSize, 0, ...debugParams);

let players = states.map((state, index) => drawPlayerParams(state.player, index));
regl.clear({ color: [0, 0, 0, 1] });
drawTrack({ tiles, view, projection });
drawPlayer(players);
// drawPlayer(drawPlayerParams(state.player));
// players.forEach(player => drawPlayer(player));
