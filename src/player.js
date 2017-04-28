// @flow
import type { Vec3, Vec4, Mat4, ProjectionFn } from './basicTypes';
import type { TrackTile } from './track';

export type PlayerState = {
    position: Vec3,
    angleZ: number,
    animations: {
        move?: Function
    }
};

type PlayerDrawArgs = {
    color: Vec4,
    translation: Mat4,
    rotation: Mat4,
    view: Mat4,
    projection: ProjectionFn
};

type PlayerDraw = (PlayerDrawArgs | PlayerDrawArgs[]) => void;

type UpdateMovement = ({
    state: PlayerState,
    nextTile: TrackTile,
    track: TrackTile[]
}) => PlayerState;

type PrintLinePath = (
    distance: number,
    angle: number,
    states: Object[],
    steps: number
) => Object;

type TrailDebug = (
    states: Object[],
    steps: number,
    radius: number,
    center: Vec3,
    startAngle: number,
    playerStartAngle: number,
    direction: number
) => Object;

const regl = require('regl')();
const extend = require('xtend');
const { lineMove, curveMove } = require('./animations');
const { getTilePath } = require('./track');

const draw: PlayerDraw = regl({
    uniforms: {
        translation: regl.prop('translation'),
        rotation: regl.prop('rotation'),
        view: regl.prop('view'),
        projection: (context, { projection }) => projection(context),
        color: regl.prop('color')
    },
    attributes: {
        position: [[0, 1, 0], [-1, -1, 0], [1, -1, 0]]
    },
    elements: [[0, 1], [0, 2], [2, 1]],
    vert: `
    uniform mat4 translation, rotation, view, projection;
    mat4 model = translation * rotation;
    attribute vec3 position;
    void main() {
        gl_Position = projection * view * model * vec4(position, 1);
    }`,
    frag: `
    precision mediump float;
    uniform vec4 color;
    void main() {
        gl_FragColor = color;
    }`
});

// reducers
// const updateMovement: UpdateMovement = ({ state, track, nextTile }) => {
// const move = getTilePath({
// position: state.position,
// track
// });
// const animations = extend(state.animations, { move });
// return extend(state, { animations });
// };

// debug
// ----------
const printLinePath: PrintLinePath = (distance, angle, states, steps) => {
    let newState = states[states.length - 1];
    const playerState = newState.player;
    const startPosition = playerState.position;
    // for (let count = 0; count < steps/2; count++) {
    for (let count = 0; count <= steps; count++) {
        let newPlayerState = lineMove({
            state: playerState,
            progress: count / steps,
            distance,
            angle,
            startPosition
        });
        newState = extend(newState, { player: newPlayerState });
        states.push(newState);
    }
    return newState;
};

const trailDebug: TrailDebug = (
    states,
    steps,
    radius,
    center,
    rotation,
    playerStartAngle,
    direction
) => {
    let newState = states[states.length - 1];
    const playerState = newState.player;
    // for (let count = 0; count < steps/2; count++) {
    for (let count = 0; count <= steps; count++) {
        let newPlayerState = curveMove({
            state: playerState,
            center,
            rotation,
            playerStartAngle,
            progress: count / steps,
            radius,
            curveAngle: 90,
            direction
        });
        newState = extend(newState, { player: newPlayerState });
        // states.push(extend(state));
        states.push(newState);
    }
    return newState;
};
module.exports = {
    drawPlayer: draw,
    // updateMovement,

    // debug, safe to delete
    printLinePath,
    trailDebug
};
