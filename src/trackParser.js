// @flow
import type { Vec3 } from './basicTypes';
import type { TrackTile } from './track';

const balanced = require('balanced-match');
const { shortTileNames } = require('./trackTile');

const tileSize = 2 * 8 / 10;
const trackScale = [4, 4, 1];

const outputRotation = inputName => {
    const name = inputName.toLowerCase();
    const lastLetter = name.slice(-1);
    switch (lastLetter) {
        case 'r':
            return -Math.PI / 2;
        case 'l':
            return Math.PI / 2;
        case 'b':
            return Math.PI;
        default:
            return 0;
    }
};

type ParseTrack = ({
    track: string,
    angle: number,
    offset?: Vec3,
    reverse?: boolean,
    branchTileName?: string
}) => TrackTile[];

const parseTrack: ParseTrack = ({
    track,
    angle,
    offset = [0, 0, 0],
    reverse = false,
    branchTileName = ''
}) => {
    // split the string in before / after first branch
    const { pre, body, post } = balanced('(', ')', track) || {
        pre: track,
        body: null,
        post: null
    };
    //tiles before the branch
    let nextAngle = angle;
    let nextOffset = offset;
    let preBranchTiles = [];
    let postBranchTiles = [];
    let branchTiles = [];
    if (pre.length) {
        let shortNames = pre.split(',');
        preBranchTiles = shortNames.reduce((acc, shortName, index) => {
            const name = shortTileNames[shortName.toLowerCase()] || shortName;
            const isBranchTurn =
                body != null && index === shortNames.length - 1;
            let x = tileSize * trackScale[0] * Math.round(Math.cos(angle));
            let y = tileSize * trackScale[1] * Math.round(Math.sin(angle));
            let z = 0;
            let angleOffset = outputRotation(shortName);
            if (reverse) {
                x *= -1;
                y *= -1;
            }
            if (reverse || isBranchTurn) {
                angleOffset *= -1;
            }
            nextAngle = angle + angleOffset;
            nextOffset = [offset[0] + x, offset[1] + y, offset[2] + z];

            if (isBranchTurn) {
                branchTileName += shortName;
                return acc;
            }
            offset = nextOffset;
            const nextTile = {
                name,
                offset,
                angle: reverse ? angle : nextAngle
            };
            angle = nextAngle;
            return acc.concat(nextTile);
        }, []);
    }
    if (body) {
        branchTiles = parseTrack({
            track: body,
            angle: nextAngle,
            offset: nextOffset,
            reverse: !reverse,
            branchTileName: ''
        });
    }
    let remainingTrack = '';
    if (post) {
        if (post.length === 1 || post[1] === ',') {
            branchTileName += post[0];
            remainingTrack = post.slice(1);
            postBranchTiles = parseTrack({
                track: `${branchTileName}${remainingTrack}`,
                angle,
                offset,
                branchTileName: ''
            });
        } else if (post.length > 1 && post[1] === '(') {
            postBranchTiles = parseTrack({
                track: post,
                angle,
                offset,
                branchTileName
            });
        }
    }
    const result = preBranchTiles.concat(branchTiles).concat(postBranchTiles);
    return result;
};
module.exports = parseTrack;
