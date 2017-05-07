// @flow
import type { Vec3, Vec4, Mat4, ProjectionFn } from './basicTypes';
import type { TrackTile } from './trackTile';
import type { AnimationStep } from './animations';

const regl = require('regl')();
const identity = require('gl-mat4/identity');
const rotateZ = require('gl-mat4/rotateZ');
const translate = require('gl-mat4/translate');
const { getTilePath } = require('./track');

const rad = degree => degree * Math.PI / 180;

type DrawPlayerParams = (
    playerState: { position: Vec3, angleZ: number },
    renderProperties: { view: Mat4, projection: Mat4 }
) => PlayerDrawArgs;
const drawPlayerParams: DrawPlayerParams = (
    { position, angleZ },
    { view, projection }
) => {
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

type PlayerDrawArgs = {
    color: Vec4,
    translation: Mat4,
    rotation: Mat4,
    view: Mat4,
    projection: ProjectionFn
};
type PlayerDraw = (PlayerDrawArgs | PlayerDrawArgs[]) => void;
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

// player state
export type PlayerState = {
    position: Vec3,
    angleZ: number,
    animations: {
        move: {
            update: AnimationStep,
            startTime: number,
            duration: number,
            progress: number
        }
    }
};
type CreatePlayerState = ({ position: Vec3 }) => PlayerState;
const createPlayerState: CreatePlayerState = ({ position }) => ({
    position,
    angleZ: 0,
    animations: {
        move: {
            progress: 1,
            duration: 1,
            startTime: 0,
            update: ({ state, progress }) => state
        }
    }
});

// reducers
type UpdateMovement = ({
    state: PlayerState,
    time: number,
    tiles: TrackTile[],
    trackOffset: Vec3,
    tick: { cancel: Function }
}) => PlayerState;
const updateMovement: UpdateMovement = ({
    state,
    time,
    tiles,
    trackOffset,
    tick
}) => {
    let nextState = state;
    let moveAnim = nextState.animations.move;
    const firstFrame = moveAnim.startTime === 0;
    const startTime = firstFrame ? time : moveAnim.startTime;
    const moveDeltaTime = time - moveAnim.startTime;
    let moveProgress = firstFrame ? 1 : moveDeltaTime / moveAnim.duration;
    nextState = nextState.animations.move.update({
        state: nextState,
        progress: Math.min(moveProgress, 1)
    });
    const isMoveFinished = moveAnim.progress >= 1 || moveProgress >= 1;
    if (isMoveFinished) {
        const afterTileState = moveAnim.update({
            state: nextState,
            progress: 1.1
        });
        const updateAndDuration = getTilePath({
            tick,
            state: afterTileState,
            initialState: nextState,
            track: tiles,
            trackOffset
        });
        nextState.animations.move.update = updateAndDuration.update;
        nextState.animations.move.duration = updateAndDuration.duration;
        nextState.animations.move.startTime = time;
        nextState.animations.move.progress = 0;
    }
    return nextState;
};

module.exports = {
    drawPlayer: draw,
    drawPlayerParams,
    createPlayerState,
    updateMovement
};
