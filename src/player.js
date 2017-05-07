// @flow
import type { Vec3, Vec4, Mat4, ProjectionFn } from './basicTypes';
import type { TrackTile } from './trackTile';

import type { AnimationStep } from './animations';
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

const regl = require('regl')();
const extend = require('xtend');
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
    initialState: PlayerState,
    trackOffset: Vec3,
    track: TrackTile[]
}) => { update: AnimationStep, duration: number };
const updateMovement: UpdateMovement = ({
    state,
    initialState,
    track,
    trackOffset
}) => {
    const result = getTilePath({
        state,
        initialState,
        track,
        trackOffset
    });
    return result;
};

module.exports = {
    drawPlayer: draw,
    drawPlayerParams,
    createPlayerState,
    updateMovement
};
