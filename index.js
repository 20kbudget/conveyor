// @flow
const regl = require('regl')();
const identity = require('gl-mat4/identity');
const scale = require('gl-mat4/scale');
const perspective = require('gl-mat4/perspective');
const lookAt = require('gl-mat4/lookAt');
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
    'begin,w,wnS',
    'begin',
    'wNs'
];
const track = tracks[tracks.length - 1];
const tiles = parseTrack({ track, direction: 0 });
regl.clear({ color: [0, 0, 0, 1] });
drawTrack({ tiles, view, projection });

let state = {
    player: {
        position: [-4, 0, 0],
        velocity: [0, 0, 0]
    }
};

const updatePosition = ({ state, deltaT = 1 }) => {
    const nexPosition = zipWith(
        (p, v) => p + deltaT * v,
        state.position,
        state.velocity
    );
    return extend(state, { position: nexPosition });
};

const STEP_ANGLE = Math.PI * 1 / 4; // 45 degrees
const CURVE_CW = true;
const CURVE_CCW = !CURVE_CW;
const updateVelocity = ({
    state,
    velocity = 1,
    direction = [0, 0, 0],
    sweep = CURVE_CW,
    progress = 1.0
}) => {
    const angle = direction[2] * progress * STEP_ANGLE;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const nextVelocity = [
        velocity * (sweep ? cos : sin),
        velocity * (sweep ? sin : cos),
        0
    ];
    return extend(state, { velocity: nextVelocity });
};

let steps = 5;
let states = [state];
for (let count = 0; count < steps; count ++) {
    state = extend(state, {
        player: updatePosition({
            deltaT: 1,
            state: updateVelocity({
                state: state.player,
                velocity: 10 / steps,
                curve: false,
                direction: [0, 0, 1],
                sweep: CURVE_CW,
                progress: count / steps
            })
        })
    });
    states.push(extend(state))
}
let players = states.map(state => {
    const translation = translate([], identity([]), state.player.position);
    return {
        color: [0.8, 0.3, 0, 1],
        model: translation,
        view,
        projection
    };
})
players.forEach(player => drawPlayer(player));
