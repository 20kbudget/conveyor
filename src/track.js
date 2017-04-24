// @flow
import type { Vec3, Mat4, ProjectionFn } from './basicTypes';

type TrackTile = {
    name: string,
    offset: Vec3,
    angle: number
};

type ParseTrackFn = ({
    track: string,
    angle: number,
    offset?: Vec3,
    reverse?: bool,
    branchTileName?: string
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
const balanced = require('balanced-match')
const {drawTile, shortTileNames} = require('./trackTile');

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

const outputRotation = (inputName) => {
    const name = inputName.toLowerCase();
    const lastLetter = name.slice(-1);
    console.log({lastLetter})
    // if (name === 'lr') {
        // return 0;
    // }
    switch (lastLetter) {
        case 'r':
            return -Math.PI / 2;
        case 'l':
            return Math.PI / 2;
        default:
            return 0;
    }
};

const parseTrack: ParseTrackFn = ({ track, angle, offset = [0, 0, 0], reverse = false, branchTileName = '' }) => {
    // split the string in before / after first branch
    const {pre, body, post} = balanced('(', ')', track) || {pre: track, body: null, post: null};
    console.log('---')
    console.log({track})
    console.log({body})
    console.log({pre})
    console.log({post})
    //tiles before the branch
    let branchTile = {};
    let nextAngle = angle;
    let nextOffset = offset;
    let preBranchTiles = [];
    let postBranchTiles = [];
    let branchTiles = [];
    if (pre.length) {
        let shortNames = pre.split(',');
        preBranchTiles = shortNames.reduce((acc, shortName, index) => {
            const name = shortTileNames[shortName.toLowerCase()] || shortName;
            const isBranchTurn = body != null && index === shortNames.length -1;
            let x = tileSize * trackScale[0] * Math.round(Math.cos(angle));
            let y = tileSize * trackScale[1] * Math.round(Math.sin(angle));
            let z = 0;
            let angleOffset = outputRotation(shortName);
            console.log({reverse})
            if(reverse){
                x *= -1;
                y *= -1;
            }
            console.log({isBranchTurn})
            if(reverse || isBranchTurn){
                angleOffset *= -1;
            }
            console.log({shortName})
            nextAngle = angle + angleOffset;
            nextOffset = [offset[0] + x, offset[1] + y, offset[2] + z];

            if(isBranchTurn){
                branchTileName += shortName;
                return acc;
            }
            offset = nextOffset;
            console.log('::',angle * 180 / Math.PI)
            console.log('::',nextAngle * 180 / Math.PI)
            const nextTile = {
                name,
                offset,
                // angle
                angle: reverse ? angle : nextAngle
                // angle: reverse ? nextAngle : angle
            };
            console.log(':::', reverse, nextTile.angle *180 / Math.PI)
            angle = nextAngle;
            return acc.concat(nextTile);
        }, []);
    }
    if (body) {
        console.log('call Body', body, nextAngle *180/Math.PI, nextOffset, !reverse)
        branchTiles = parseTrack({
            track: body,
            angle: nextAngle,
            offset: nextOffset,
            reverse: !reverse,
            branchTileName: ''
        })
        console.log('after body')
        console.log({branchTiles})
    }
    let remainingTrack = '';
    if (post) {
        console.log({post})
        if (post.length === 1 || post[1] === ',') {
            branchTileName += post[0];
            remainingTrack = post.slice(1);
            console.log({branchTileName})
            console.log('call A')
            postBranchTiles = parseTrack({
                track: `${branchTileName}${remainingTrack}`,
                angle,
                offset,
                branchTileName: ''
            })
        } else if (post.length > 1 && post[1] === '(') {
            console.log('call B', post)
            postBranchTiles = parseTrack({
                track: post,
                angle,
                offset,
                branchTileName
            })
        }
    }
    const result = preBranchTiles.concat(branchTiles).concat(postBranchTiles);
    // console.log('preBranchTiles', preBranchTiles.length, track);
    // console.log('postBranchTiles', postBranchTiles.length);
    console.log({result})
    return result;

};


module.exports = {
    parseTrack,
    drawTrack
};
