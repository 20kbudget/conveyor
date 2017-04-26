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

type CurveMove = ({
    state: PlayerState,
    center: Vec3,
    radius: number,
    curveAngle: number,
    direction: number,
    startAngle: number,
    playerStartAngle: number,
    progress: number
}) => PlayerState;
const curveMove: CurveMove = ({
    state,
    center,
    radius,
    curveAngle = 90,
    direction = DIRECTION_CCW,
    startAngle,
    playerStartAngle,
    progress
}) => {
    const curveProgress = progress * curveAngle * direction;
    const angle = startAngle + curveProgress;
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

module.exports = {
    lineMove,
    curveMove,
    DIRECTION_CW,
    DIRECTION_CCW
};
