// @flow

const regl = require('regl')();
const identity = require('gl-mat4/identity');
const perspective = require('gl-mat4/perspective');
const lookAt = require('gl-mat4/lookAt');
const drawPlayer = require('./src/player');
const drawTrackTile = require('./src/track');

const cameraDistance = 20;

const model = identity([]);
const view = lookAt([], [0, 0, cameraDistance], [0, 0, 0], [0, 1.0, 0]);
const projection = ({ viewportWidth, viewportHeight }) =>
    perspective([], Math.PI / 2, viewportWidth / viewportHeight, 0.01, 1000);

const render = () => {
    regl.clear({ color: [0, 0, 0, 1] });
    drawTrackTile();
    drawPlayer({ color: [0.8, 0.3, 0, 1], model, view, projection });
}

// regl.frame(render);
render();

