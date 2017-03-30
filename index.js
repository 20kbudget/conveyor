// @flow

const regl = require('regl')();
const identity = require('gl-mat4/identity');
const perspective = require('gl-mat4/perspective');
const lookAt = require('gl-mat4/lookAt');
const drawGrid = require('./src/grid');
const drawPlayer = require('./src/player');

const cameraDistance = 3;

const model = identity([]);
const view = lookAt([], [0, 0, cameraDistance], [0, 0, 0], [0, 1.0, 0]);
const projection = ({ viewportWidth, viewportHeight }) =>
    perspective([], Math.PI / 2, viewportWidth / viewportHeight, 0.01, 1000);

const render = () => {
    regl.clear({ color: [0, 0, 0, 1] });
    drawGrid({ color: [0.5, 0.5, 0.5, 1], gridSize: [10, 10]});
    drawPlayer({ color: [0.8, 0.3, 0, 1], model, view, projection });
}

// regl.frame(render);
render();

