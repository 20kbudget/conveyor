// @flow
import type { Vec3, Vec4, Mat4, ProjectionFn } from './basicTypes';
import type { AnimationStep } from './animations';

const regl = require('regl')();
const identity = require('gl-mat4/identity');
const rotateZ = require('gl-mat4/rotateZ');
const translate = require('gl-mat4/translate');
const { DIRECTION_CW, JUMP_DURATION } = require('./animations');

const rad = degree => degree * Math.PI / 180;

// player state
type Animation = {
    enabled: boolean,
    update: AnimationStep,
    startTime: number,
    duration: number
};
export type PlayerState = {
    position: Vec3,
    angleZ: number,
    direction: number,
    currentTile: any,
    canJump: boolean,
    isDead: boolean,
    animations: {
        move: Animation,
        jump: Animation
    }
};
type CreatePlayerState = ({ position: Vec3 }) => PlayerState;
const defaultAnimation = duration => ({
    enabled: false,
    duration,
    startTime: 0,
    update: ({ state, progress }) => state
});
const createPlayerState: CreatePlayerState = ({ position }) => ({
    position,
    angleZ: 0,
    direction: DIRECTION_CW,
    currentTile: { angle: 0 },
    canJump: false,
    isDead: false,
    animations: {
        move: defaultAnimation(1),
        jump: defaultAnimation(JUMP_DURATION)
    }
});

type DrawPlayerParams = (
    playerState: PlayerState,
    renderProperties: { view: Mat4, projection: Mat4 }
) => PlayerDrawArgs;
const drawPlayerParams: DrawPlayerParams = (
    { position, angleZ, canJump, isDead },
    { view, projection }
) => {
    const translation = translate([], identity([]), position);
    const rotation = rotateZ([], identity([]), rad(angleZ));
    const blockedColor = [0.8, 0.3, 0, 1];
    const deadColor = [0.3, 0.3, 0.3, 1];
    const canJumpColor = [0.5, 0.8, 0.5, 1];
    let color = canJump === true ? canJumpColor : blockedColor;
    color = isDead ? deadColor : color;
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

module.exports = {
    drawPlayer: draw,
    drawPlayerParams,
    createPlayerState
};
