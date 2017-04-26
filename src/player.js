// @flow
import type { Vec3, Vec4, Mat4, ProjectionFn } from './basicTypes';

// Expected Properties
type PlayerDrawArgs = {
    color: Vec4,
    translation: Mat4,
    rotation: Mat4,
    view: Mat4,
    projection: ProjectionFn
};
type PlayerDraw = (PlayerDrawArgs | PlayerDrawArgs[]) => void;

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
const {
    lineMove,
    curveMove,
    DIRECTION_CCW,
    DIRECTION_CW
} = require('./animations');

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

const roundDecimals = (n, p) => Math.round(n * p) / p;
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
    lineMove,
    printLinePath,
    trailDebug,
    DIRECTION_CW,
    DIRECTION_CCW
};
