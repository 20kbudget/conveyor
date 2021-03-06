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
const easeIn = require('eases/sine-in');
const easeOut = require('eases/sine-out');

const DIRECTION_CW = -1;
const DIRECTION_CCW = 1;
const LINE_DURATION = 1.0;
const CURVE_DURATION = LINE_DURATION * 0.6;
const JUMP_DURATION = LINE_DURATION * 0.3;
const tileSize = 8 * 8 / 10;

const rad = degree => degree * Math.PI / 180;

type JumpMove = ({ initialState: PlayerState }) => AnimationStep;
const jumpMove: JumpMove = ({ initialState }) => ({ state, progress }) => {
    const trackAngle = initialState.currentTile.angle;
    const playerAngle = initialState.angleZ;
    const jumpLength = tileSize;
    const moveLength = tileSize * (JUMP_DURATION / LINE_DURATION);
    const jumpHeight = tileSize / 2;
    const jumpDistance = jumpLength * progress;
    const moveDistance = moveLength * progress;
    let jX = -Math.sin(rad(playerAngle)) * jumpDistance;
    let jY = Math.cos(rad(playerAngle)) * jumpDistance;
    let mX = Math.cos(rad(trackAngle)) * moveDistance;
    let mY = Math.sin(rad(trackAngle)) * moveDistance;
    let z = progress < 0.5
        ? easeOut(progress * 2) * jumpHeight
        : jumpHeight - jumpHeight * easeIn((progress - 0.5) * 2);
    if (progress > 1) {
        z = -jumpHeight * ((progress - 1) * 6);
    }
    const position = add([], initialState.position, [jX + mX, jY + mY, z]);
    const nextState = extend(state, { position });
    return nextState;
};

const lineMove: TileAnimation = ({ playerState, tile }) => ({
    state,
    progress
}) => {
    const startPosition = playerState.position;
    const distance = tileSize;
    const trackAngle = tile.angle;
    const totalLength = progress * distance;
    const x = Math.cos(rad(trackAngle)) * totalLength;
    const y = Math.sin(rad(trackAngle)) * totalLength;
    const offset = [x, y, 0];
    const position = add([], startPosition, offset);
    const nextState = extend(state, { position });
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
    const curveProgress = progress * curveAngle * direction;
    const angle =
        entryAngle + direction * curveAngle + rotation + curveProgress;
    const playerAngle = (playerStartAngle + curveProgress) % 360;
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
    forward: { entry: 180, animation: lineMove, duration: LINE_DURATION },
    left: { entry: 90, animation: curveMove('left'), duration: CURVE_DURATION },
    right: {
        entry: 270,
        animation: curveMove('right'),
        duration: CURVE_DURATION
    }
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
    jumpMove,
    DIRECTION_CW,
    DIRECTION_CCW,
    JUMP_DURATION,
    DIRECTION_CW,
    DIRECTION_CCW
};
