// @flow
const regl = require('regl')();

const perspective = require('gl-mat4/perspective');
const lookAt = require('gl-mat4/lookAt');
const add = require('gl-vec3/add');
const subtract = require('gl-vec3/subtract');
const { drawTrack, getTilePath } = require('./src/track');
const extend = require('xtend');
const parseTrack = require('./src/trackParser');
const { DIRECTION_CW, DIRECTION_CCW } = require('./src/animations');
const {
    drawPlayer,
    createPlayerState,
    updateMovement,
    drawPlayerParams
} = require('./src/player');

// const cameraDistance = 50;
const cameraDistance = 50;

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
    'lf,r,r(f,f)f,r,f,f,r,f,b(l,f,f,begin)r,f', // simple map easy
    'lf,r,f',
    'lf,r,r,l',
    'lf,l,r,f,r,l,f',
    'f,r,l,l,l,r,l,f'
    // 'lf,l',
    // 'l,r,r,b(f)r,l,f,r,r(f)f,f,r,f,r,r(f)l(l,f)f,f', // nice map 1
    // 'l,r,r,b(f,l,r,l,f,f,r,l,l,l,r,r,r,l,l,l,r,f,l,r,l,r,l,f,f,f,r,l,f)r,l,f,r,r(f)f,f,r,f,r,r(f)l(l,f)f,f',
    // 'f,f,f,l,f,l,r(r,f,f,f)l(l,f,f,r,f,r,f,f,f)f,f,f,f,bl,f,r(f,f,f)f,r,f,f,f,r,l(r,r,l,r,f,f,f)f,r(f,f,f)f,b(l,f,f,f)r,f,f,f',
    // 'f,f(r)l', // @BUG @TBD
    // 'l(f,r,f,r,l,r,r,l,f,f,l)f,r,l,r(l,f,l,f)l(l,f,r,r,f,f,br,r)f,r,f,r,f,f,f,l,r,r,r,l,f,f,l,r,r,r,l',// meh, not great..
];
const track = tracks[tracks.length - 1];
const halfTile = tileSize / 2;
const trackOffset = [0, 0, 0];
// const trackOffset = [+tileSize * 0.5, 0, 0];
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
    player: createPlayerState({ position: playerOffset })
};

const curveVsLineRatio = 0.6;
let steps = 60;
let curveSteps = Math.round(steps * curveVsLineRatio);

regl.clear({ color: [0, 0, 0, 1] });
drawTrack({ tiles, view, projection });

let tick = regl.frame(context => {
    const { time } = context;
    let nextPlayer = state.player;
    let moveAnim = nextPlayer.animations.move;
    const firstFrame = moveAnim.startTime === 0;
    const startTime = firstFrame ? time : moveAnim.startTime;
    const moveDeltaTime = time - moveAnim.startTime;
    let moveProgress = firstFrame ? 1 : moveDeltaTime / moveAnim.duration;
    nextPlayer = nextPlayer.animations.move.update({
        state: nextPlayer,
        progress: Math.min(moveProgress, 1)
    });
    // console.log(nextPlayer.angleZ, moveProgress, Math.min(moveProgress, 1))
    drawPlayer(drawPlayerParams(nextPlayer, { view, projection }));
    const isMoveFinished = moveAnim.progress >= 1 || moveProgress >= 1;
    if (isMoveFinished) {
        const afterTileState = moveAnim.update({
            state: nextPlayer,
            progress: 1.1
        });
        const nextUpdate = updateMovement({
            state: afterTileState,
            initialState: nextPlayer,
            track: tiles,
            trackOffset
        });
        nextPlayer.animations.move.update = nextUpdate;
        nextPlayer.animations.move.startTime = time;
        nextPlayer.animations.move.progress = moveProgress - 1;
        // console.log({nextPlayer})
    }
    state = extend(state, { player: nextPlayer });
});

// stop after x seconds (dev-mode)
window.setTimeout(() => {
    console.log('end');
    tick.cancel();
}, 8500);
