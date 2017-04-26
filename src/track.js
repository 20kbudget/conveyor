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
const { tileAnimations } = require('./animations');
const angle = require('gl-vec3/angle');

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

type FindTileAnimation = ({
    entry: Vec3,
    center: Vec3,
    track: TrackTile[]
}) => Function;

const findTileAnimation: FindTileAnimation = ({ entry, center, track }) => {
    const entryAngle = angle(entry, center);
    console.log({ entryAngle });
    const matchingTile = track.find(
        tile =>
            tile.offset.toString() !== track.toString() &&
            tileAnimations[tile.name].find(
                move => move.entry === entryAngle + tile.angle
            ) !== undefined
    );
    console.log({ matchingTile });
    return matchingTile ? tileAnimations[matchingTile.name].animation : () => null;
};

module.exports = {
    drawTrack
};
