// @flow
import type {Mat4, ProjectionFn} from './basicTypes';

type drawTrackFn = ({
    track: string,
    view: Mat4,
    projection: ProjectionFn
}) => void;

const identity = require('gl-mat4/identity');
const scale = require('gl-mat4/scale');
const drawTile = require('./trackTile');

const trackScale = [4, 4, 1];

const draw: drawTrackFn = ({track, view, projection}) => {
    drawTile([
        {
            name: 'ws',
            color: [0.5, 0.5, 0.5, 1],
            model: scale([], identity([]), trackScale),
            view,
            projection
        }
    ]);
};

module.exports = draw;
