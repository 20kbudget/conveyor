// @flow
import type { Vec3, Mat4, ProjectionFn } from './basicTypes';

type TrackTile = {
    name: string,
    offset: Vec3,
    angle: number
};

type ParseTrackFn = ({
    track: string,
    direction: number,
    offset: Vec3
}) => TrackTile[];

type DrawTrackFn = ({
    tiles: TrackTile[],
    view: Mat4,
    projection: ProjectionFn
}) => void;

const identity = require('gl-mat4/identity');
const multiply = require('gl-mat4/multiply');
const scale = require('gl-mat4/scale');
const rotateZ = require('gl-mat4/rotateZ');
const translate = require('gl-mat4/translate');
const drawTile = require('./trackTile');

const tileSize = 2 * 8 / 10;
const trackScale = [4, 4, 1];
const trackColor = [0.5, 0.5, 0.5, 1.0];

const drawTrack: DrawTrackFn = ({ tiles, view, projection }) =>
    drawTile(
        tiles.map(tile => ({
            name: tile.name,
            color: trackColor,
            rotation: rotateZ([], identity([]), tile.angle),
            translation: translate([], identity([]), tile.offset),
            scaling: scale([], identity([]), trackScale),
            view,
            projection
        }))
    );

const tileNames = {
    f: 'forward',
    lf: 'forwardLeft',
    rf: 'forwardRight',
    lrf: 'forwardLeftRight',

    l: 'left',
    fl: 'forwardLeft',
    rl: 'leftRight',
    frl: 'forwardLeftRight',

    r: 'right',
    lr: 'leftRight',
    fr: 'forwardRight',
    flr: 'forwardLeftRight'
};

const parseTrack: ParseTrackFn = ({ track, direction, offset = [0, 0, 0] }) => {
    const shortNames = track.split(',');
    let angle = direction * Math.PI / 180;
    return shortNames.reduce((acc, name) => {
        angle += outputRotation(getInput(name));
        const nextTile = {
            name: tileNames[name.toLowerCase()] || name,
            offset,
            angle
        };
        const x = tileSize * trackScale[0] * Math.round(Math.cos(angle));
        const y = tileSize * trackScale[1] * Math.round(Math.sin(angle));
        const z = 0;
        offset = [offset[0] + x, offset[1] + y, offset[2] + z];
        return acc.concat(nextTile);
    }, []);
};

const outputRotation = inputName => {
    switch (inputName.toLowerCase()) {
        case 'r':
            return -Math.PI / 2;
        case 'l':
            return Math.PI / 2;
        default:
            return 0;
    }
};

const getInput = name => {
    if (name.length == 1) {
        return name;
    }
    const upperCaseLetters = name.split('').filter(c => c.toUpperCase() === c);
    if (upperCaseLetters.length === 0) {
        return name;
    }
    return upperCaseLetters[0];
};

module.exports = {
    parseTrack,
    drawTrack
};
