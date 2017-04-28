// @flow
import type { Vec3 } from './basicTypes';
type PrintLinePath = (
    distance: number,
    angle: number,
    states: Object[],
    steps: number
) => Object;

type TrailDebug = (
    states: Object[],
    steps: number,
    radius: number,
    center: Vec3,
    startAngle: number,
    playerStartAngle: number,
    direction: number
) => Object;

const extend = require('xtend');
const { lineMove, curveMove } = require('./animations')

// debug
// ----------
const printLinePath: PrintLinePath = (distance, angle, states, steps) => {
    let newState = states[states.length - 1];
    const playerState = newState.player;
    const startPosition = playerState.position;
    // for (let count = 0; count < steps/2; count++) {
    for (let count = 0; count <= steps; count++) {
        let newPlayerState = lineMove({
            state: playerState,
            progress: count / steps,
            distance,
            angle,
            startPosition
        });
        newState = extend(newState, { player: newPlayerState });
        states.push(newState);
    }
    return newState;
};

const trailDebug: TrailDebug = (
    states,
    steps,
    radius,
    center,
    rotation,
    playerStartAngle,
    direction
) => {
    let newState = states[states.length - 1];
    const playerState = newState.player;
    // for (let count = 0; count < steps/2; count++) {
    for (let count = 0; count <= steps; count++) {
        let newPlayerState = curveMove({
            state: playerState,
            center,
            rotation,
            playerStartAngle,
            progress: count / steps,
            radius,
            curveAngle: 90,
            direction
        });
        newState = extend(newState, { player: newPlayerState });
        // states.push(extend(state));
        states.push(newState);
    }
    return newState;
};

