// @flow

// Basic Types
// -----------
type Vec2 = [number, number];

// Available properties
// -----------------
type Position = { position: Vec2 };
type Rotation = { rotation: number };
type Scale = { scale: number };

// Player
// ------
type Player = Position & Rotation & Scale;

const regl = require('regl')();
const extend = require('xtend');
const identity = require('gl-mat4/identity');
const perspective = require('gl-mat4/perspective');
const lookAt = require('gl-mat4/lookAt');

const basicShaders = {
    frag: `
        precision mediump float;
        uniform vec4 color;
        void main() {
            gl_FragColor = color;
        }`,
    vert: `
        precision mediump float;
        uniform mat4 model, view, projection;
        attribute vec2 position;
        uniform vec3 offset;
        uniform float scale;
        void main() {
            gl_Position = projection * view * model * vec4(vec3(position, 0) * scale + offset, 1);
        }`
};

const view = lookAt([], [0, 0, 10.0], [0, 0, 0], [0, 1.0, 0]);

const drawPlayer = regl(
    extend(basicShaders, {
        attributes: {
            position: [[0, 1.0], [-1.0, -1.0], [1.0, -1.0]]
        },
        uniforms: {
            view,
            model: identity([]),
            projection: ({ viewportWidth, viewportHeight }) =>
                perspective(
                    [],
                    Math.PI / 2,
                    viewportWidth / viewportHeight,
                    0.01,
                    1000
                ),
            color: regl.prop('color'),
            offset: regl.prop('offset'),
            scale: regl.prop('scale'),
            rotation: regl.prop('rotation')
        },
        elements: [[0, 1], [0, 2], [2, 1]],
        lineWidth: 1
    })
);

regl.frame(({ tick }) => {
    regl.clear({
        color: [0, 0, 0, 1]
    });
    drawPlayer([
        { offset: [0, 0, 3], scale: 1, rotation: 0, color: [0.8, 0.3, 0, 1] },
        { offset: [0, 0.5, 3], scale: 0.3, rotation: 45, color: [0, 0.5, 0, 1] }
    ]);
});
