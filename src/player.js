// @flow
import type { Vec3, Vec4, Mat4, ProjectionFn } from './basicTypes';
import type { TrackTile } from './trackTile';
import type { AnimationStep } from './animations';

const regl = require('regl')();
const identity = require('gl-mat4/identity');
const rotateZ = require('gl-mat4/rotateZ');
const translate = require('gl-mat4/translate');
const extend = require('xtend');
const { getTilePath } = require('./track');

const rad = degree => degree * Math.PI / 180;

type DrawPlayerParams = (
    playerState: { position: Vec3, angleZ: number, canJump: boolean },
    renderProperties: { view: Mat4, projection: Mat4 }
) => PlayerDrawArgs;
const drawPlayerParams: DrawPlayerParams = (
    { position, angleZ, canJump },
    { view, projection }
) => {
    const translation = translate([], identity([]), position);
    const rotation = rotateZ([], identity([]), rad(angleZ));
    const colorA = [0.8, 0.3, 0, 1];
    const colorB = [1, 1, 0, 1];
    // const color = angleZ % (Math.PI / 2) === 0 ? colorB : colorA;
    const color = canJump ? colorB : colorA;
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
    currentTile: any,
    canJump: boolean,
    animations: {
        move: Animation,
        jump: Animation
    }
};
type CreatePlayerState = ({ position: Vec3 }) => PlayerState;
const defaultAnimation = () => ({
    enabled: false,
    duration: 1,
    startTime: 0,
    update: ({ state, progress }) => state
});
const createPlayerState: CreatePlayerState = ({ position }) => ({
    position,
    angleZ: 0,
    currentTile: { angle: 0 },
    canJump: false,
    animations: {
        move: defaultAnimation(),
        jump: defaultAnimation()
    }
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
    let nextState = extend({},state);
    const moveAnim = nextState.animations.move;
    const jumpAnim = nextState.animations.jump;
    const moveProgress = (time - moveAnim.startTime) / moveAnim.duration;
    const jumpProgress = (time - jumpAnim.startTime) / jumpAnim.duration;
    const cappedMoveProgress = Math.min(moveProgress, 1);
    let nextTileInfo = {};
    if (moveAnim.enabled) {
        nextState = moveAnim.update({
            state: nextState,
            progress: cappedMoveProgress
        });
        if (moveProgress >= 1 && !jumpAnim.enabled) {
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
        }
    }
    if (nextState.angleZ % 90 !== 0) {
        nextState.canJump = false;
    } else {
        nextState.canJump = true;
        // const landingStateMoveProgress =
            // (time + jumpAnim.duration - nextState.animations.move.startTime) /
            // nextState.animations.move.duration;
        // // console.log({landingStateMoveProgress})
        // const landingState = jumpAnim.update({
            // state: moveAnim.update({
                // state: nextState,
                // progress: landingStateMoveProgress
            // }),
            // progress: 1
        // });
        // const landingTileInfo = getTilePath({
            // tick,
                // playerAngle: nextState.angleZ,
            // state: landingState,
            // track: tiles,
            // trackOffset
        // })
        // const landingTileDeltaAngle = landingTileInfo.tile ? Math.abs(
            // landingTileInfo.tile.angle - nextState.currentTile.angle
        // ) : 0;
        // nextState.canJump = (landingTileDeltaAngle % 180 === 0);
    }
    if (jumpAnim.enabled) {
        nextState = jumpAnim.update({
            state: nextState,
            progress: Math.min(jumpProgress, 1)
        });
        if (jumpProgress >= 1) {
            nextTileInfo = getTilePath({
                tick,
                playerAngle: nextState.angleZ,
                state: nextState,
                track: tiles,
                trackOffset
            });
            if (nextTileInfo.tile === null) {
                console.log('no tile to land');
                return state;
            }
            const tileDeltaAngle = Math.abs(
                nextTileInfo.tile.angle - nextState.currentTile.angle
            );
            if (tileDeltaAngle % 180 !== 0) {
                console.log('wrong landing angle', nextTileInfo.tile.angle, nextState.currentTile.angle);
                // tick.cancel();
                return state;
            }

            const discountFactor = tileDeltaAngle === 180
                ? 1 - cappedMoveProgress
                : cappedMoveProgress;
            const timeDiscount = nextTileInfo.duration * discountFactor;
            const nextTileStartTime = time - timeDiscount;
            const nextTileMoveProgress = timeDiscount / nextTileInfo.duration;
            // console.log(
                // 'valind landing?',
                // nextTileInfo,
                // moveProgress,
                // cappedMoveProgress,
                // nextTileMoveProgress
            // );
            nextState.animations.move.update = nextTileInfo.update;
            nextState.animations.move.duration = nextTileInfo.duration;
            nextState.animations.move.startTime = nextTileStartTime;
            nextState.currentTile = nextTileInfo.tile;
            nextState.animations.jump.enabled = false;
            nextState = moveAnim.update({
                state: nextState,
                progress: Math.min(nextTileMoveProgress, 1)
            });
            console.log('state after move tick', nextState);
        }
    }
    return nextState;
};

module.exports = {
    drawPlayer: draw,
    drawPlayerParams,
    createPlayerState,
    updateMovement
};
