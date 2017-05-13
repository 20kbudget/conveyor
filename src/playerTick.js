// @flow
import type { Vec3 } from './basicTypes';
import type { TrackTile } from './trackTile';
import type { PlayerState } from './player';

const extend = require('xtend');
const distance = require('gl-vec3/distance');
const { jumpMove } = require('./animations');
const { getTilePath } = require('./track');
const tileSize = 8 * 8 / 10;

const changeTile = ({ state, afterTileState, time, tiles, trackOffset }) => {
    let result = extend({}, state);
    const nextTileInfo = getTilePath({
        playerAngle: result.angleZ,
        state: extend({}, afterTileState),
        track: tiles,
        trackOffset
    });
    const newMoveAnim = extend(result.animations.move, {
        update: nextTileInfo.update,
        duration: nextTileInfo.duration,
        startTime: time
    });
    const newAnimations = extend(result.animations, { move: newMoveAnim });
    result.currentTile = nextTileInfo.tile || null;
    result.animations = newAnimations;
    return result;
};

let counter = 0;
type Update = ({
    state: PlayerState,
    time: number,
    tiles: TrackTile[],
    trackOffset: Vec3,
    tick: { cancel: Function }
}) => PlayerState;
const update: Update = ({ state, time, tiles, trackOffset, tick }) => {
    let nextState = extend({}, state);
    const moveAnim = nextState.animations.move;
    const jumpAnim = nextState.animations.jump;
    const moveProgress = (time - moveAnim.startTime) / moveAnim.duration;
    const jumpProgress = (time - jumpAnim.startTime) / jumpAnim.duration;

    const jumpSimulation = jumpMove({ initialState: nextState });
    const landingState = jumpSimulation({ state: nextState, progress: 1 });
    const stateAfterJump = changeTile({
        state: nextState,
        afterTileState: landingState,
        time,
        tiles,
        trackOffset
    });
    const angleDiff = stateAfterJump.currentTile
        ? Math.abs(
              stateAfterJump.currentTile.angle - nextState.currentTile.angle
          )
        : 0;
    nextState.canJump =
        !jumpAnim.enabled &&
        nextState.angleZ % 90 === 0 &&
        angleDiff % 180 === 0;

    if (!jumpAnim.enabled && moveAnim.enabled) {
        nextState = moveAnim.update({
            state: nextState,
            progress: Math.min(1, moveProgress)
        });
        if (moveProgress > 1) {
            nextState = changeTile({
                state: nextState,
                afterTileState: moveAnim.update({
                    state: nextState,
                    progress: 1.1
                }),
                time,
                tiles,
                trackOffset
            });
        }
    }

    if (jumpAnim.enabled) {
        nextState = jumpAnim.update({
            state: nextState,
            progress: Math.min(jumpProgress, 1)
        });
        if (jumpProgress >= 1) {
            const landedState = changeTile({
                state: nextState,
                afterTileState: nextState,
                time,
                tiles,
                trackOffset
            });
            const landedAngleDiff = landedState.currentTile
                ? Math.abs(
                      landedState.currentTile.angle -
                          nextState.currentTile.angle
                  )
                : 0;

            // check for invalid cases

            // no tile available to land
            if (landedState.currentTile === null) {
                if (jumpProgress > 2) {
                    nextState.isDead = true;
                }
                nextState = jumpAnim.update({
                    state: nextState,
                    progress: jumpProgress
                });
                return nextState;
            }

            // wrong landing angle (shouldnt be poissible)
            if (landedAngleDiff % 180 !== 0) {
                console.log(
                    'wrong landing angle',
                    landedState.currentTile.angle,
                    nextState.currentTile.angle
                );
                tick.cancel();
                return state;
            }

            // it is safe to land, end jump
            console.log('landed');

            // change move start time to
            const sameDirection = landedAngleDiff !== 180;
            let nextTileStartTime = time;
            const tilesDistance = distance(
                nextState.currentTile.offset,
                landedState.currentTile.offset
            );
            const landBeforeEnd = tilesDistance < tileSize * 1.1;
            if (landBeforeEnd) {
                if (sameDirection) {
                    nextTileStartTime = nextState.animations.move.startTime;
                } else {
                    const remainingTime =
                        landedState.animations.move.duration *
                        (1 - Math.min(1, moveProgress));
                    nextTileStartTime = time - remainingTime;
                }
            } else {
                const extraTime =
                    landedState.animations.move.duration *
                    (Math.min(2, moveProgress) - 1);
                if (sameDirection) {
                    nextTileStartTime = time - extraTime;
                } else {
                    nextTileStartTime =
                        time - landedState.animations.move.duration + extraTime;
                }
            }
            nextState = landedState;
            nextState.animations.move.startTime = nextTileStartTime;
            nextState.animations.jump.enabled = false;
        }
        // console.log({nextState})

        // // debug
        // if (counter > 80){
        // tick.cancel();
        // }else{
        // counter++;
        // }
    }
    return nextState;
};

module.exports = update;
