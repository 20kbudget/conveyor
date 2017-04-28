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

module.exports = {
    drawPlayer: draw,
    // updateMovement,
};
