// @flow
import type { Vec3, Mat4, ProjectionFn } from './basicTypes';

export type TrackTile = {
    name: string,
    offset: Vec3,
    angle: number
};

type DrawTrack = ({
    tiles: TrackTile[],
    view: Mat4,
    projection: ProjectionFn
}) => void;

type GetTilePath = ({
    entry: Vec3,
    center: Vec3,
    track: TrackTile[]
}) => Function;

const identity = require('gl-mat4/identity');
const scale = require('gl-mat4/scale');
const rotateZ = require('gl-mat4/rotateZ');
const translate = require('gl-mat4/translate');
const { drawTile } = require('./trackTile');
const { tileAnimations } = require('./animations');
const getAngle = require('gl-vec3/angle');
const subtract = require('gl-vec3/subtract');

const trackScale = [4, 4, 1];
const trackColor = [0.5, 0.5, 0.5, 1.0];

const degrees = rad => rad * 180 / Math.PI;
const rad = degrees => degrees * Math.PI / 180;

const drawTrack: DrawTrack = ({ tiles, view, projection }) =>
    drawTile(
        tiles.map(tile => ({
            name: tile.name,
            color: trackColor,
            rotation: rotateZ([], identity([]), rad(tile.angle)),
            translation: translate([], identity([]), tile.offset),
            scaling: scale([], identity([]), trackScale),
            view,
            projection
        }))
    );

const getTilePath: GetTilePath = ({ entry, center, track }) => {
    const entryAngleRad = getAngle(subtract([], entry, center), [1, 0, 0]);
    const entryAngle = degrees(entryAngleRad) * (entry[1] < center[1] ? -1 : 1);
    // console.log(entryAngleRad)
    // console.log(entryAngle);
    // console.log(center);
    // console.log(entry);
    // console.log({tileAnimations})
    // const matchingTile = track.find(tile => {
    const sameCenterTiles = track.filter(tile => {
        const hasSameCenter = tile.offset.toString() === center.toString();
        return hasSameCenter;
    });
    console.log({ sameCenterTiles });
    const matchingTile = sameCenterTiles.find(tile => {
        const sameEntryAnimation = tileAnimations[tile.name].find(
            a => a.entry === entryAngle - tile.angle
        );
        console.log(
            tile.name,
            tile.angle,
            entryAngle,
            entryAngle - tile.angle,
            sameEntryAnimation
        );
        return sameEntryAnimation !== undefined;
    });
    console.log({ matchingTile });
    return matchingTile !== undefined ? matchingTile.animation : () => null;
};

module.exports = {
    drawTrack,
    getTilePath
};
