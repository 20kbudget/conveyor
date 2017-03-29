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
type Player = (Position & Rotation & Scale);

const regl = require('regl')();
const extend = require('xtend');

const basicShaders = {
    frag: `
        precision mediump float;
        uniform vec4 color;
        void main() {
            gl_FragColor = color;
        }`,
    vert: `
        precision mediump float;
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0, 1);
        }`
};
const drawPlayer = regl(extend(basicShaders, {
    uniforms: {
        color: [0.8, 0.3, 0, 1]
    },
    attributes: {
        position: [
            [0, 0.5],
            [-0.5, 0],
            [0.5, 0],
        ]
    },
    // elements: [
        // [0, 1],
        // [1, 2],
        // [2, 0]
    // ],
    lineWidth: 3,
    count: 3
}));

drawPlayer();
