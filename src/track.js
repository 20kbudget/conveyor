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
    position: Vec3,
    track: TrackTile[],
    tileDimensions?: Vec3,
    trackOffset?: Vec3
}) => Function;

const identity = require('gl-mat4/identity');
const scale = require('gl-mat4/scale');
const rotateZ = require('gl-mat4/rotateZ');
const translate = require('gl-mat4/translate');
const { drawTile } = require('./trackTile');
const { tileAnimations } = require('./animations');
const getAngle = require('gl-vec3/angle');
const add = require('gl-vec3/add');
const subtract = require('gl-vec3/subtract');
const distance = require('gl-vec3/distance');

const tileSize = 8 * 8 / 10;
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

const closestTileCenter = ({ position, tileDimensions, trackOffset }) => {
    const [px, py, ...pz] = subtract([], position, trackOffset);
    const [tw, th, ...tl] = tileDimensions;
    const x = Math.round(px / tw) * tw;
    const y = Math.round(py / th) * th;
    return add([], [x, y, 0], trackOffset);
};

const closestEntry = ({ position, tiles, tileDimensions }) => {
    const [tw, th, ...tl] = tileDimensions;
    const closestDistance = tiles.reduce(
        (acc, tile) => {
            const tileInputs = tileAnimations[tile.name];
            let result = acc;
            tileInputs.forEach(t => {
                const angle = rad(t.entry);
                const x = tile.offset[0] + Math.cos(angle) * tw;
                const y = tile.offset[1] + Math.sin(angle) * th;
                const entryVertex = [x, y, 0];
                const d = distance(entryVertex, position);
                if (d < result.distance) {
                    result = { vertex: entryVertex, distance: d };
                }
            });
            return result;
        },
        { distance: Number.MAX_VALUE, vertex: [] }
    );
    return closestDistance.vertex;
};

const getTilePath: GetTilePath = ({
    position,
    tileDimensions = [tileSize, tileSize, 0],
    track,
    trackOffset = [0, 0, 0]
}) => {
    const center = closestTileCenter({ position, tileDimensions, trackOffset });
    const sameCenterTiles = track.filter(tile => {
        const hasSameCenter = tile.offset.toString() === center.toString();
        return hasSameCenter;
    });
    const entry = closestEntry({
        position,
        tiles: sameCenterTiles,
        tileDimensions
    });
    const entryAngleRad = getAngle(subtract([], entry, center), [1, 0, 0]);
    const entryAngle = degrees(entryAngleRad) * (entry[1] < center[1] ? -1 : 1);
    const matchingTile = sameCenterTiles.find(tile => {
        const sameEntryAnimation = tileAnimations[tile.name].find(
            a => a.entry === entryAngle - tile.angle
        );
        return sameEntryAnimation !== undefined;
    });
    return matchingTile !== undefined ? matchingTile.animation : () => null;
};

module.exports = {
    drawTrack,
    getTilePath
};
