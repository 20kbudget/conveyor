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
const extend = require('xtend');

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
        (acc, tile, index) => {
            const tileInputs = tileAnimations[tile.name];
            let result = acc;
            tileInputs.forEach(t => {
                const angle = rad(t.entry + tile.angle);
                const x = tile.offset[0] + Math.cos(angle) * tw / 2;
                const y = tile.offset[1] + Math.sin(angle) * th / 2;
                const entryVertex = [
                    Number(x.toFixed(2)),
                    Number(y.toFixed(2)),
                    0
                ];
                const d = distance(entryVertex, position);
                if (d < result.distance) {
                    result = { angle: t.entry, distance: d, tile, entryVertex };
                }
            });
            return result;
        },
        {
            distance: Number.MAX_VALUE,
            angle: 0,
            tile: null,
            entryVertex: [0, 0, 0]
        }
    );
    return closestDistance.tile ? closestDistance : null;
};

type GetTilePath = ({
    tick: { cancel: Function },
    playerAngle: number,
    state: PlayerState,
    track: TrackTile[],
    trackOffset?: Vec3,
    tileDimensions?: Vec3
}) => { update: AnimationStep, duration: number, tile: any };
const getTilePath: GetTilePath = ({
    tick,
    playerAngle,
    state,
    track,
    trackOffset = [0, 0, 0],
    tileDimensions = [tileSize, tileSize, 0]
}) => {
    let animation = ({ playerState, tile }) => ({ state, progress }) => {
        console.log('noop animation');
        tick.cancel();
        return state;
    };
    let matchingTile = null;
    let playerState = extend({}, state);
    let duration = 1;
    const position = state.position;
    const center = closestTileCenter({ position, tileDimensions, trackOffset });
    const sameCenterTiles = track.filter(tile => {
        // fucking javascript 12.8 + 6.4 = 19.200000000000003
        // const hasSameCenter = distance(tile.offset, center) < 0.01;
        // console.log(tile.offset, center)
        const hasSameCenter = tile.offset.toString() === center.toString();
        return hasSameCenter;
    });
    // console.log({sameCenterTiles})
    const entry = closestEntry({
        position,
        tiles: sameCenterTiles,
        tileDimensions
    });
    if (entry) {
        matchingTile = entry.tile;
        playerState.position = entry.entryVertex;
        playerState.angleZ = playerAngle;
        const sameEntryPath = tileAnimations[matchingTile.name].find(
            a => a.entry === entry.angle
        );
        duration = sameEntryPath.duration;
        animation = sameEntryPath.animation;
        // console.log('entryVertex', playerState.position, playerState.angleZ)
    }
    return {
        update: animation({
            playerState,
            tile: matchingTile
        }),
        duration,
        tile: matchingTile
    };
};

module.exports = {
    drawTrack,
    getTilePath
};
