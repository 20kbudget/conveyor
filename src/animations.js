// @flow
import type { Vec3 } from './basicTypes';
import type { PlayerState } from './player';
import type { TrackTile } from './trackTile';

export type AnimationStep = ({
    state: PlayerState,
    progress: number
}) => PlayerState;

type TileAnimation = ({
    playerState: PlayerState,
    tile: TrackTile
}) => AnimationStep;

type CurveMove = string => TileAnimation;

const add = require('gl-vec3/add');
const rotateZ = require('gl-vec3/rotateZ');
const extend = require('xtend');

const DIRECTION_CW = -1;
const DIRECTION_CCW = 1;
const tileSize = 8 * 8 / 10;

const rad = degree => degree * Math.PI / 180;

const lineMove: TileAnimation = ({ playerState, tile }) => ({
    state,
    progress
}) => {
    const startPosition = playerState.position;
    const distance = tileSize;
    const angle = playerState.angleZ;
    const totalLength = progress * distance;
    const x = Math.cos(rad(angle)) * totalLength;
    const y = Math.sin(rad(angle)) * totalLength;
    const offset = [x, y, 0];
    const position = add([], startPosition, offset);
    const nextState = extend(state, { position, angleZ: angle });
    return nextState;
};

const curveMove: CurveMove = curveName => ({ playerState, tile }) => ({
    state,
    progress
}) => {
    const radius = tileSize / 2;
    const curveAngle = 90;
    const isClockwise = curveName === 'right';
    const direction = isClockwise ? DIRECTION_CW : DIRECTION_CCW;
    const entryAngle = isClockwise ? 270 : 90;
    const curveLocalCenter = isClockwise
        ? [tileSize / 2, -tileSize / 2, 0]
        : [tileSize / 2, tileSize / 2, 0];
    const rotatedCurveLocalCenter = rotateZ(
        [],
        curveLocalCenter,
        [0, 0, 0],
        rad(tile.angle)
    );
    const center = add([], tile.offset, rotatedCurveLocalCenter);
    const rotation = tile.angle;
    const playerStartAngle = playerState.angleZ;
    // console.log({rotation})
    const curveProgress = progress * curveAngle * direction;
    const angle =
        entryAngle + direction * curveAngle + rotation + curveProgress;
    // console.log({angle})
    const playerAngle = playerStartAngle + curveProgress;
    const x = center[0] + radius * Math.cos(rad(angle));
    const y = center[1] + radius * Math.sin(rad(angle));
    const newPosition = [x, y, 0];
    let newPlayerState = extend(state, {
        position: newPosition,
        angleZ: playerAngle
    });
    return newPlayerState;
};

const moves = {
    forward: { entry: 180, animation: lineMove },
    left: { entry: 90, animation: curveMove('left') },
    right: { entry: 270, animation: curveMove('right') }
};

const tileAnimations = {
    forward: [moves.forward],
    left: [moves.left],
    right: [moves.right],
    leftRight: [moves.left, moves.right],
    forwardLeft: [moves.forward, moves.left],
    forwardRight: [moves.forward, moves.right],
    forwardLeftRight: [moves.forward, moves.left, moves.right]
};

module.exports = {
    tileAnimations,
    lineMove,
    curveMove,
    DIRECTION_CW,
    DIRECTION_CCW
};
