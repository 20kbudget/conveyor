// @flow
import type { Vec3, Vec4, Mat4, ProjectionFn } from './basicTypes';
import type { TrackTile } from './trackTile';
import type { AnimationStep } from './animations';

const regl = require('regl')();
const identity = require('gl-mat4/identity');
const rotateZ = require('gl-mat4/rotateZ');
const translate = require('gl-mat4/translate');
const distance = require('gl-vec3/distance');
const extend = require('xtend');
const { getTilePath } = require('./track');
const {
    DIRECTION_CW,
    DIRECTION_CCW,
    JUMP_DURATION,
    jumpMove
} = require('./animations');

const tileSize = 8 * 8 / 10;
const rad = degree => degree * Math.PI / 180;

// player state
type Animation = {
    enabled: boolean,
    update: AnimationStep,
    startTime: number,
    duration: number
};
export type PlayerState = {
    position: Vec3,
    angleZ: number,
    direction: number,
    currentTile: any,
    canJump: boolean,
    isDead: boolean,
    animations: {
        move: Animation,
        jump: Animation
    }
};
type CreatePlayerState = ({ position: Vec3 }) => PlayerState;
const defaultAnimation = duration => ({
    enabled: false,
    duration,
    startTime: 0,
    update: ({ state, progress }) => state
});
const createPlayerState: CreatePlayerState = ({ position }) => ({
    position,
    angleZ: 0,
    direction: DIRECTION_CW,
    currentTile: { angle: 0 },
    canJump: false,
    isDead: false,
    animations: {
        move: defaultAnimation(1),
        jump: defaultAnimation(JUMP_DURATION)
    }
});

type DrawPlayerParams = (
    playerState: PlayerState,
    renderProperties: { view: Mat4, projection: Mat4 }
) => PlayerDrawArgs;
const drawPlayerParams: DrawPlayerParams = (
    { position, angleZ, canJump, isDead },
    { view, projection }
) => {
    const translation = translate([], identity([]), position);
    const rotation = rotateZ([], identity([]), rad(angleZ));
    const blockedColor = [0.8, 0.3, 0, 1];
    const deadColor = [0.3, 0.3, 0.3, 1];
    const canJumpColor = [0.5, 0.8, 0.5, 1];
    let color = canJump === true ? canJumpColor : blockedColor;
    color = isDead ? deadColor : color;
    return {
        color,
        translation,
        rotation,
        view,
        projection
    };
};

type PlayerDrawArgs = {
    color: Vec4,
    translation: Mat4,
    rotation: Mat4,
    view: Mat4,
    projection: ProjectionFn
};
type PlayerDraw = (PlayerDrawArgs | PlayerDrawArgs[]) => void;
const draw: PlayerDraw = regl({
    uniforms: {
        translation: regl.prop('translation'),
        rotation: regl.prop('rotation'),
        view: regl.prop('view'),
        projection: (context, { projection }) => projection(context),
        color: regl.prop('color')
    },
    attributes: {
        position: [[0, 1, 0], [-1, -1, 0], [1, -1, 0]]
    },
    elements: [[0, 1], [0, 2], [2, 1]],
    vert: `
    uniform mat4 translation, rotation, view, projection;
    mat4 model = translation * rotation;
    attribute vec3 position;
    void main() {
        gl_Position = projection * view * model * vec4(position, 1);
    }`,
    frag: `
    precision mediump float;
    uniform vec4 color;
    void main() {
        gl_FragColor = color;
    }`
});

// reducers
type UpdateMovement = ({
    state: PlayerState,
    time: number,
    tiles: TrackTile[],
    trackOffset: Vec3,
    tick: { cancel: Function }
}) => PlayerState;
const updateMovement: UpdateMovement = ({
    state,
    time,
    tiles,
    trackOffset,
    tick
}) => {
    let nextState = extend({}, state);
    const moveAnim = nextState.animations.move;
    const jumpAnim = nextState.animations.jump;
    const moveProgress = (time - moveAnim.startTime) / moveAnim.duration;
    const jumpProgress = (time - jumpAnim.startTime) / jumpAnim.duration;
    let cappedMoveProgress = Math.min(moveProgress, 1);
    let nextTileInfo = {};
    if (moveAnim.enabled && !jumpAnim.enabled) {
        nextState = moveAnim.update({
            state: nextState,
            progress: cappedMoveProgress
        });
    }
    if (jumpAnim.enabled) {
        nextState.canJump = false;
        nextState = jumpAnim.update({
            state: nextState,
            progress: Math.min(jumpProgress, 1)
            // progress: jumpProgress
        });
    }
    if (!jumpAnim.enabled && moveProgress >= 1) {
        const afterTileState = moveAnim.update({
            state: nextState,
            progress: 1.1
        });
        nextTileInfo = getTilePath({
            tick,
            playerAngle: nextState.angleZ,
            state: afterTileState,
            track: tiles,
            trackOffset
        });
        nextState.currentTile = nextTileInfo.tile;
        nextState.animations.move.update = nextTileInfo.update;
        nextState.animations.move.duration = nextTileInfo.duration;
        nextState.animations.move.startTime = time;
        // cappedMoveProgress = 0;
    }
    if (jumpAnim.enabled && jumpProgress >= 1) {
        nextTileInfo = getTilePath({
            tick,
            playerAngle: nextState.angleZ,
            state: nextState,
            track: tiles,
            trackOffset
        });
        const tileDeltaAngle = nextTileInfo.tile
            ? Math.abs(nextTileInfo.tile.angle - nextState.currentTile.angle)
            : 0;
        if (nextTileInfo.tile === null) {
            if (jumpProgress > 2) {
                nextState.isDead = true;
                // tick.cancel();
            }
            nextState = jumpAnim.update({
                state: nextState,
                // progress: Math.min(jumpProgress, 1)
                progress: jumpProgress
            });
            // console.log({nextState})
            return nextState;
        } else if (tileDeltaAngle % 180 !== 0) {
            console.log(
                'wrong landing angle',
                nextTileInfo.tile.angle,
                nextState.currentTile.angle
            );
            tick.cancel();
            return state;
        } else {
            nextState.animations.jump.enabled = false;
            const tilesDistance = distance(
                nextState.currentTile.offset,
                nextTileInfo.tile.offset
            );
            nextState.currentTile = nextTileInfo.tile;
            nextState.animations.move.update = nextTileInfo.update;
            nextState.animations.move.duration = nextTileInfo.duration;
            const sameDirection = tileDeltaAngle !== 180;
            const landBeforeEnd = tilesDistance < tileSize * 1.1;
            const remainingTime =
                nextTileInfo.duration * (1 - cappedMoveProgress);
            const extraTime =
                nextTileInfo.duration * (Math.min(2, moveProgress) - 1);
            let nextTileStartTime = time;
            if (landBeforeEnd) {
                if (sameDirection) {
                    nextTileStartTime = nextState.animations.move.startTime;
                } else {
                    nextTileStartTime = time - remainingTime;
                }
            } else {
                if (sameDirection) {
                    nextTileStartTime = time - extraTime;
                } else {
                    nextTileStartTime =
                        time - nextTileInfo.duration + extraTime;
                }
            }
            nextState.animations.move.startTime = nextTileStartTime;
        }
    }
    const jumpSimulation = jumpMove({ initialState: nextState });
    const landingState = jumpSimulation({ state: nextState, progress: 1 });
    const landingTileInfo = getTilePath({
        tick,
        playerAngle: nextState.angleZ,
        state: landingState,
        track: tiles,
        trackOffset
    });
    const angleDiff = landingTileInfo.tile
        ? Math.abs(landingTileInfo.tile.angle - nextState.currentTile.angle)
        : 0;
    nextState.canJump = nextState.angleZ % 90 === 0 && angleDiff % 180 === 0;
    return nextState;
};

module.exports = {
    drawPlayer: draw,
    drawPlayerParams,
    createPlayerState,
    updateMovement
};
