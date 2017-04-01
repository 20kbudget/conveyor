// @flow
import type { Mat4, ProjectionFn } from './basicTypes';

type drawTrackFn = (
    {
        direction: number,
        track: string,
        view: Mat4,
        projection: ProjectionFn
    }
) => void;

const identity = require('gl-mat4/identity');
const multiply = require('gl-mat4/multiply');
const scale = require('gl-mat4/scale');
const rotateZ = require('gl-mat4/rotateZ');
const translate = require('gl-mat4/translate');
const drawTile = require('./trackTile');

const tileSize = 2;
const trackScale = [4, 4, 1];
const trackColor = [0.5, 0.5, 0.5, 1];
const baseModel = identity([]);

const outputRotation = inputName => {
    switch (inputName.toLowerCase()) {
        case 's':
            return -Math.PI / 2;
        case 'n':
            return Math.PI / 2;
        default:
            return 0;
    }
};

const getInput = name => {
    if (name.length == 1) {
        return name;
    }
    const upperCaseLetters = name.split('').filter(c => c.toUpperCase());
    if (upperCaseLetters.length === 0) {
        return name;
    }
    return upperCaseLetters[0];
};

const draw: drawTrackFn = ({ direction, track, view, projection }) => {
    const tileNames = track.split(',');
    let offset = [0, 0, 0];
    let angle = direction * Math.PI / 180;
    drawTile(
        tileNames.reduce(
            (acc, name) => {
                const inputName = getInput(name);
                angle += outputRotation(inputName);
                const translation = translate([], identity([]), offset);
                const rotation = rotateZ([], identity([]), angle);
                const scaling = scale([], identity([]), trackScale);
                const nextTile = {
                    name: name.toLowerCase(),
                    color: trackColor,
                    rotation,
                    translation,
                    scaling,
                    view,
                    projection
                };
                const x = tileSize *
                    trackScale[0] *
                    Math.round(Math.cos(angle));
                const y = tileSize *
                    trackScale[1] *
                    Math.round(Math.sin(angle));
                const z = 0;
                offset = [offset[0] + x, offset[1] + y, offset[2] + z];
                return acc.concat(nextTile);
            },
            []
        )
    );
};

module.exports = draw;
