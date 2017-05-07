// @flow
const regl = require('regl')();

const perspective = require('gl-mat4/perspective');
const lookAt = require('gl-mat4/lookAt');
const subtract = require('gl-vec3/subtract');
const { drawTrack } = require('./src/track');
const extend = require('xtend');
const parseTrack = require('./src/trackParser');
const {
    drawPlayer,
    createPlayerState,
    updateMovement,
    drawPlayerParams
} = require('./src/player');

const cameraDistance = 50;

const tileSize = 8 * 8 / 10;
const view = lookAt([], [0, 0, cameraDistance], [0, 0, 0], [0, 1.0, 0]);
const projection = ({ viewportWidth, viewportHeight }) =>
    perspective([], Math.PI / 3, viewportWidth / viewportHeight, 0.01, 1000);

const tracks = [
    'f,f,l,l,f,f,f,l,l,f' // simple loop
    // 'f,l,l,f',
    // 'f,r,r(f,f)f,r,f,f,r,f,b(l,f,f,begin)r,f', // both side options
    // 'r(f,f)f,r,f,f,r,f,r(f,f)f,r,f,f,r,f', // player must start turned inside
    // 'l,r,f,r,r,f,l,l,f,r,r,f,r,l,l,r,r,r,l,l,r,r,r,l', // scissor
    // 'l,r,r,b(f)r,l,f,r,r(f)f,f,r,f,r,r(f)l(l,f)f,f' // 2 platforms outside, 2 inside
    // 'f,f,f,l,f,l,r(r,f,f,f)l(l,f,f,r,f,r,f,f,f)f,f,f,f,bl,f,r(f,f,f)f,r,f,f,f,r,l(r,r,l,r,f,f,f)f,r(f,f,f)f,b(l,f,f,f)r,f,f,f',// scorpion
    // 'f,f(r)l', // @BUG @TBD
    //
    // 'l,r,r,r,l', // convoluted turn
    // 'l,l,l,l', // INVALID only curves, minimal circle
    // 'l,r,r,r,l,r,r,r', // INVALID only curves, small 8
    // 'l,r,r,r,l,l,r,r,r,l,l,r,r,r,l,l,r,r,r,l', // INVALID X
    // 'l,r,r,b(f,l,r,l,f,f,r,l,l,l,r,r,r,l,l,l,r,f,l,r,l,r,l,f,f,f,r,l,f)r,l,f,r,r(f)f,f,r,f,r,r(f)l(l,f)f,f',
];
const track = tracks[tracks.length - 1];
const halfTile = tileSize / 2;
const trackOffset = [0, 0, 0];
const playerOffset = subtract([], trackOffset, [halfTile, 0, 0]);
const tiles = parseTrack({
    track,
    angle: 0,
    offset: trackOffset,
    reverse: false
});

let state = {
    player: createPlayerState({ position: playerOffset })
};
state.player.angleZ = 180;

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
        // console.log({moveProgress})
        const afterTileState = moveAnim.update({
            state: nextPlayer,
            progress: 1.1
        });
        const updateAndDuration = updateMovement({
            tick,
            state: afterTileState,
            initialState: nextPlayer,
            track: tiles,
            trackOffset
        });
        nextPlayer.animations.move.update = updateAndDuration.update;
        nextPlayer.animations.move.duration = updateAndDuration.duration;
        nextPlayer.animations.move.startTime = time;
        nextPlayer.animations.move.progress = 0;
        // console.log({nextPlayer})
    }
    state = extend(state, { player: nextPlayer });
});

// stop after x seconds (dev-mode)
// window.setTimeout(() => {
// console.log('end');
// tick.cancel();
// }, 10500);
