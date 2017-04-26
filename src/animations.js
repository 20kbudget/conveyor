// @flow
import type { Vec3 } from './basicTypes';

type PlayerState = {
    position: Vec3,
    angleZ: number
};

const add = require('gl-vec3/add');
const extend = require('xtend');

const DIRECTION_CW = -1;
const DIRECTION_CCW = 1;
const tileSize = 8 * 8 / 10;

const rad = degree => degree * Math.PI / 180;

type LineMove = ({
    state: PlayerState,
    startPosition: Vec3,
    progress: number,
    distance: number,
    angle: number
}) => PlayerState;

const lineMove: LineMove = ({
    state,
    progress,
    startPosition,
    distance = tileSize,
    angle = 0
}) => {
    const totalLength = progress * distance;
    const x = Math.cos(rad(angle)) * totalLength;
    const y = Math.sin(rad(angle)) * totalLength;
    const offset = [x, y, 0];
    const position = add([], startPosition, offset);
    const nextState = extend(state, { position });
    return nextState;
};

type CurveParams = {
    state: PlayerState,
    center: Vec3,
    radius: number,
    rotation: number,
    playerStartAngle: number,
    progress: number
}
type CurveMove = (CurveParams & {
    curveAngle?: number,
    direction?: number
}) => PlayerState;
type CurveRight = (CurveParams) => PlayerState;
type CurveLeft = (CurveParams) => PlayerState;
const curveMove: CurveMove = ({
    state,
    center,
    radius,
    rotation,
    playerStartAngle,
    progress,
    curveAngle = 90,
    direction = DIRECTION_CCW
}) => {
    const curveProgress = progress * curveAngle * direction;
    const angle = rotation + curveProgress;
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

const curveRight:CurveRight = ({
    state,
    center,
    radius,
    rotation,
    playerStartAngle,
    progress
}) =>
    curveMove({
        state,
        center,
        radius,
        rotation,
        playerStartAngle,
        progress,
        direction: DIRECTION_CW
    });

const curveLeft:CurveLeft = ({
    state,
    center,
    radius,
    curveAngle,
    rotation,
    playerStartAngle,
    progress
}) =>
    curveMove({
        state,
        center,
        radius,
        curveAngle: 90,
        direction: DIRECTION_CCW,
        rotation,
        playerStartAngle,
        progress
    });

const moves = {
    forward: { entry: 180, animation: lineMove },
    left: { entry: 90, animation: curveLeft },
    right: { entry: 270, animation: curveRight }
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
