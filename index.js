// @flow
const regl = require('regl')();
const identity = require('gl-mat4/identity');
const scale = require('gl-mat4/scale');
const perspective = require('gl-mat4/perspective');
const lookAt = require('gl-mat4/lookAt');
const drawPlayer = require('./src/player');
const drawTrack = require('./src/track');

const cameraDistance = 50;

const view = lookAt([], [0, 0, cameraDistance], [0, 0, 0], [0, 1.0, 0]);
const projection = ({ viewportWidth, viewportHeight }) =>
    perspective([], Math.PI / 3, viewportWidth / viewportHeight, 0.01, 1000);

const tracks = [
    'n,n,n,n',
    'w,n,n,w,n,n',
    'w,n,w,n,w,n,w,n',
    'w,w,n,n,w,w,w,n,n,w',
    'begin,w,n,Ns,w,w,w,s,s,w,w,w,s'
];
const render = () => {
    regl.clear({ color: [0, 0, 0, 1] });
    drawTrack({
        direction: 0,
        track: tracks[tracks.length - 1],
        view,
        projection
    });

    drawPlayer({
        color: [0.8, 0.3, 0, 1],
        model: identity([]),
        view,
        projection
    });
};

// regl.frame(render);
render();
