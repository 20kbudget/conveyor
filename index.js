// @flow
const regl = require('regl')();

const identity = require('gl-mat4/identity');
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

const cameraDistance = 50;

const tileSize = 8 * 8 / 10;
const view = lookAt([], [0, 0, cameraDistance], [0, 0, 0], [0, 1.0, 0]);
const projection = ({ viewportWidth, viewportHeight }) =>
    perspective([], Math.PI / 3, viewportWidth / viewportHeight, 0.01, 1000);

const tracks = [
    'l,r,r,r,l', // convoluted turn
    'l,l,l,l', // INVALID only curves, minimal circle
    'l,r,r,r,l,r,r,r', // INVALID only curves, small 8
    'l,r,r,r,l,l,r,r,r,l,l,r,r,r,l,l,r,r,r,l', // X
    'begin,f,l,r,lr,lf,rf,flr,end', //all tiles one of each
    'l,r,r,b(f,f,bl)r,l,f,r,r(f)f,f,r,f,r,r(f)l(l,f)f,f'
    // 'r,r,l(f)r(f)f,b(f)l,f',
    // 'begin,r,r,f,l(l,begin)r(r)f,b(r,begin)r,r',
    // 'f,r,r,f,l(l)r(r)f,f,b(l)r,l,l',
    // 'f,b(f)l,r',
    // 'f,b(f)r,r',
    // 'f,r(f)b,r',
    // 'l(r,l)f,f',
    // 'l(r,l)r,f',
    // 'f,r,r,l,l,rf,f',
    // 'f,r',
    // 'r,l(f,l)f,l,f,l',
    // 'l(f,l)f,f',
    // 'f,f,f,r',
    // 'l(f)r(f)f',
];
const track = tracks[tracks.length - 1];
const halfTile = tileSize / 2;
const trackOffset = [-tileSize / 6, 0, 0];
let angle = 0;
const tiles = parseTrack({ track, angle, offset: trackOffset, reverse: false });

let state = {
    player: {
        position: vecSum(trackOffset, [halfTile, 0, 0]),
        angleZ: 0
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

const radius = tileSize / 2;
const curveVsLineRatio = 0.6;
let steps = 60;
// let steps = 5;
let curveSteps = Math.round(steps * curveVsLineRatio);
let states = [state];
let lineDebugParams = [states, steps, radius];
let debugParams = [states, curveSteps, radius];

let center = vecSum(state.player.position, [0, radius, 0]);
state = trailDebug(
    ...debugParams,
    center,
    -90,
    state.player.angleZ,
    DIRECTION_CCW
);

center = vecSum(state.player.position, [radius, 0, 0]);
state = trailDebug(
    ...debugParams,
    center,
    -180,
    state.player.angleZ,
    DIRECTION_CW
);

center = vecSum(state.player.position, [0, -radius, 0]);
state = trailDebug(
    ...debugParams,
    center,
    90,
    state.player.angleZ,
    DIRECTION_CW
);

center = vecSum(state.player.position, [-radius, 0, 0]);
state = trailDebug(
    ...debugParams,
    center,
    0,
    state.player.angleZ,
    DIRECTION_CW
);

center = vecSum(state.player.position, [0, -radius, 0]);
state = trailDebug(
    ...debugParams,
    center,
    90,
    state.player.angleZ,
    DIRECTION_CCW
);

state = printLinePath(tileSize, -90, ...lineDebugParams);

center = vecSum(state.player.position, [-radius, 0, 0]);
state = trailDebug(
    ...debugParams,
    center,
    0,
    state.player.angleZ,
    DIRECTION_CW
);

state = printLinePath(tileSize, -180, ...lineDebugParams);
state = printLinePath(tileSize, -180, ...lineDebugParams);

center = vecSum(state.player.position, [0, radius, 0, 0]);
state = trailDebug(
    ...debugParams,
    center,
    -90,
    state.player.angleZ,
    DIRECTION_CW
);

state = printLinePath(tileSize, 90, ...lineDebugParams);

center = vecSum(state.player.position, [radius, 0, 0]);
state = trailDebug(
    ...debugParams,
    center,
    -180,
    state.player.angleZ,
    DIRECTION_CW
);

state = printLinePath(tileSize, 0.1, ...lineDebugParams);
state = printLinePath(tileSize, 0, ...lineDebugParams);

let players = states.map((state, index) =>
    drawPlayerParams(state.player, index)
);
regl.clear({ color: [0, 0, 0, 1] });
drawTrack({ tiles, view, projection });
// drawPlayer(players);

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
