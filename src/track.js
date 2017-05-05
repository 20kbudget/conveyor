// @flow
import type { Vec3, Mat4, ProjectionFn } from './basicTypes';
import type { PlayerState } from './player';
import type { TrackTile } from './trackTile';
import type { AnimationStep } from './animations';

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
    const x = Math.ceil(px / tw) * tw;
    const y = Math.round(py / th) * th;
    return add([], [x, y, 0], trackOffset);
};

const closestEntry = ({ position, tiles, tileDimensions }) => {
    const [tw, th, ...tl] = tileDimensions;
    // console.log({tileDimensions})
    console.log({tiles})
    console.log({position})
    const closestDistance = tiles.reduce(
        (acc, tile) => {
            const tileInputs = tileAnimations[tile.name];
            let result = acc;
            console.log({tileInputs})
            tileInputs.forEach(t => {
                const angle = rad(t.entry);
                const x = tile.offset[0] + Math.cos(angle) * tw;
                const y = tile.offset[1] + Math.sin(angle) * th;
                const entryVertex = [x, y, 0];
                const d = distance(entryVertex, position);
                if (d < result.distance) {
                    result = { angle: t.entry, distance: d };
                }
            });
            console.log({result})
            return result;
        },
        { distance: Number.MAX_VALUE, angle: 0 }
    );
    console.log({closestDistance})
    return closestDistance.angle;
};

type GetTilePath = ({
    state: PlayerState,
    track: TrackTile[],
    trackOffset?: Vec3,
    tileDimensions?: Vec3
}) => AnimationStep;
const getTilePath: GetTilePath = ({
    state,
    track,
    trackOffset = [0, 0, 0],
    tileDimensions = [tileSize, tileSize, 0]
}) => {
    const position = state.position;
    const center = closestTileCenter({ position, tileDimensions, trackOffset });
    console.log({position})
    console.log({center})
    console.log({track})

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
    // const entryAngleRad = getAngle(subtract([], entry, center), [1, 0, 0]);
    // const entryAngle = Math.round(degrees(entryAngleRad) * (entry[1] < center[1] ? -1 : 1));
    const entryAngle = entry;
    console.log({entryAngle})
    let animation = ({ playerState, tile }) => ({ state, progress }) => {
        console.log('noop animation')
        return state;
    }
    const matchingTile = sameCenterTiles.find(tile => {
        console.log({tile})
        console.log(tileAnimations[tile.name])
        const sameEntryPath = tileAnimations[tile.name].find(
            // a => a.entry === entryAngle - tile.angle
            a => a.entry === entryAngle
        );
        console.log({sameEntryPath})
        if (sameEntryPath === undefined) {
            return false;
        }
        animation = sameEntryPath.animation;
        return true;
    });
    console.log({matchingTile})
    return animation({
        playerState: state,
        tile: matchingTile
    });
};

module.exports = {
    drawTrack,
    getTilePath
};
