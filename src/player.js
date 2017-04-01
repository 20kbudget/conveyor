// @flow
import type {Vec4, Mat4, ProjectionFn} from './basicTypes';

// Expected Properties
type EntityDrawProps = {
    color: Vec4,
    model: Mat4,
    view: Mat4,
    projection: ProjectionFn
};
type EntityDraw = (EntityDrawProps) => void;

const regl = require('regl')();
const draw: EntityDraw = regl({
    uniforms: {
        model: regl.prop('model'),
        view: regl.prop('view'),
        projection: (context, { projection }) => projection(context),
        color: regl.prop('color')
    },
    attributes: {
        position: [[0, 1, 0], [-1, -1, 0], [1, -1, 0]]
    },
    elements: [[0, 1], [0, 2], [2, 1]],
    vert: `
    uniform mat4 model, view, projection;
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

module.exports = draw;
