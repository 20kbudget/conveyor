// @flow
import type { Vec3, Mat4, ProjectionFn } from './basicTypes';

export type TrackTile = {
    name: string,
    offset: Vec3,
    angle: number
};

const identity = require('gl-mat4/identity');
const multiply = require('gl-mat4/multiply');
const scale = require('gl-mat4/scale');
const rotateZ = require('gl-mat4/rotateZ');
const translate = require('gl-mat4/translate');
const { drawTile, shortTileNames } = require('./trackTile');
const { lineMove, curveMove } = require('./animations');

const trackScale = [4, 4, 1];
const trackColor = [0.5, 0.5, 0.5, 1.0];

type DrawTrack = ({
    tiles: TrackTile[],
    view: Mat4,
    projection: ProjectionFn
}) => void;

const drawTrack: DrawTrack = ({ tiles, view, projection }) =>
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

type GetTileAnimation = ({
    position: Vec3,
    tiles: TrackTile[]
}) => Function;

const getTileAnimation:GetTileAnimation = ({position, tiles}) => {
    return lineMove;
}


module.exports = {
    drawTrack
};
