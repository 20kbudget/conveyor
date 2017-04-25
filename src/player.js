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

type PlayerState = {
    position: Vec3,
    angleZ: number
};

type LineMove = ({
    state: PlayerState,
    startPosition: Vec3,
    progress: number,
    distance: number,
    angle: number
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
const { vecSum } = require('./vectors');

const DIRECTION_CW = -1;
const DIRECTION_CCW = 1;
const tileSize = 8 * 8 / 10;

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

const rad = degree => degree * Math.PI / 180;
const lineMove: LineMove = ({
    state,
    progress,
    startPosition,
    distance = tileSize,
    angle = 0
}) => {
    let nextState = state;
    const totalLength = progress * distance;
    const x = Math.cos(rad(angle)) * totalLength;
    const y = Math.sin(rad(angle)) * totalLength;
    const offset = [x, y, 0];
    const position = vecSum(startPosition, offset);
    nextState = extend(state, { position });
    return nextState;
};

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
const curveMove = ({
    state,
    center,
    radius,
    curveAngle = 90,
    direction = DIRECTION_CCW,
    startAngle,
    playerStartAngle,
    progress
}) => {
    const curveProgress = progress * curveAngle * direction;
    const angle = startAngle + curveProgress;
    const playerAngle = playerStartAngle + curveProgress;
    const x = center[0] + radius * Math.cos(rad(angle));
    const y = center[1] + radius * Math.sin(rad(angle));
    const newPosition = [x, y, 0];
    let newPlayerState = extend(state, {
        position: newPosition,
        angleZ: playerAngle
    });
    return newPlayerState;
};

const trailDebug: TrailDebug = (
    states,
    steps,
    radius,
    center,
    startAngle,
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
            startAngle,
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
