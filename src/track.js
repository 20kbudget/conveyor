// @flow
import type { Vec3, Mat4, ProjectionFn } from './basicTypes';

export type TrackTile = {
    name: string,
    offset: Vec3,
    angle: number,
    speed: number
};

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

type GetTilePath = ({
    position: Vec3,
    track: TrackTile[],
    tileDimensions?: Vec3,
    trackOffset?: Vec3
}) => Function;
const getTilePath: GetTilePath = ({
    position,
    tileDimensions = [tileSize, tileSize, 0],
    track,
    trackOffset = [0, 0, 0]
}) => {
    console.log('getTilePath', trackOffset, position)
    const center = closestTileCenter({ position, tileDimensions, trackOffset });
    console.log({center})
    const sameCenterTiles = track.filter(tile => {
        const hasSameCenter = tile.offset.toString() === center.toString();
        return hasSameCenter;
    });
    console.log({sameCenterTiles})
    const entry = closestEntry({
        position,
        tiles: sameCenterTiles,
        tileDimensions
    });
    console.log({entry})
    const entryAngleRad = getAngle(subtract([], entry, center), [1, 0, 0]);
    const entryAngle = degrees(entryAngleRad) * (entry[1] < center[1] ? -1 : 1);
    let animation = state => state;
    const matchingTile = sameCenterTiles.find(tile => {
        const sameEntryAnimation = tileAnimations[tile.name].find(
            a => a.entry === entryAngle - tile.angle
        );
        if (sameEntryAnimation === undefined) {
            return false;
        }
        animation = sameEntryAnimation.animation;
        return true;
    });
    console.log({matchingTile})
    // if (matchingTile === undefined){
        // return state => state;
    // }
    return animation;
};

module.exports = {
    drawTrack,
    getTilePath
};
