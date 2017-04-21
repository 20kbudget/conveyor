// @flow
const regl = require('regl')();
const identity = require('gl-mat4/identity');
const scale = require('gl-mat4/scale');
const perspective = require('gl-mat4/perspective');
const lookAt = require('gl-mat4/lookAt');
const rotateZ = require('gl-mat4/rotateZ');
const translate = require('gl-mat4/translate');
const extend = require('xtend');
const { zipWith } = require('ramda');
const drawPlayer = require('./src/player');
const { drawTrack, parseTrack } = require('./src/track');

const cameraDistance = 50;

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
    'begin,n,n,end'
];
const track = tracks[tracks.length - 1];
const tiles = parseTrack({ track, direction: 0 });
regl.clear({ color: [0, 0, 0, 1] });
drawTrack({ tiles, view, projection });

let state = {
    player: {
        position: [4, 0, 0],
        angle: [0, 0, 0]
    }
};

const rad = degree => degree * Math.PI / 180;
const DIRECTION_CW = -1;
const DIRECTION_CCW = 1;
const curveMove = ({
    state,
    center,
    radius = 4,
    curveAngle = 90,
    direction = DIRECTION_CCW,
    startAngle,
    playerStartAngle,
    progress
}) => {
    const curveProgress = progress * curveAngle * direction;
    const angle = rad(startAngle + curveProgress);
    const playerAngle = rad(playerStartAngle + curveProgress);
    const x = center[0] + radius * Math.cos(angle);
    const y = center[1] + radius * Math.sin(angle);
    const newPosition = [x, y, 0];
    return extend(state, { position: newPosition, angle: playerAngle });
};

let steps = 10;
let states = [];
// let states = [state];
const vecSum = zipWith((a, b) => a + b);
let center = vecSum(state.player.position, [0, 4, 0]);
// const center = vecSum(state.player.position, [4, 0, 0]);
for (let count = 0; count <= steps; count++) {
    // for (let count = 0; count < steps/2; count++) {
    state = extend(state, {
        player: curveMove({
            state: state.player,
            center,
            startAngle: -90,
            playerStartAngle: 0,
            progress: count / steps,
            radius: 4,
            curveAngle: 90,
            direction: DIRECTION_CCW
        })
    });
    states.push(extend(state));
}
center = vecSum(state.player.position, [-4, 0, 0]);
for (let count = 0; count <= steps; count++) {
    // for (let count = 0; count < steps/2; count++) {
    state = extend(state, {
        player: curveMove({
            state: state.player,
            center,
            startAngle: 0,
            playerStartAngle: 90,
            progress: count / steps,
            radius: 4,
            curveAngle: 90,
            direction: DIRECTION_CCW
        })
    });
    states.push(extend(state));
}
let players = states.map(state => {
    const translation = translate([], identity([]), state.player.position);
    const rotation = rotateZ([], identity([]), state.player.angle);
    return {
        color: [0.8, 0.3, 0, 1],
        translation,
        rotation,
        view,
        projection
    };
});
console.log({ states });
drawPlayer(players);
// players.forEach(player => drawPlayer(player));
