// @flow
import type { Vec3, Vec4, Mat4, ProjectionFn } from './basicTypes';

// Expected Properties
type EntityDrawProps = {
    color: Vec4,
    translation: Mat4,
    rotation: Mat4,
    view: Mat4,
    projection: ProjectionFn
};
type EntityDraw = (EntityDrawProps | EntityDrawProps[]) => void;

type TrailDebug = (
    state: Object,
    states: Object[],
    steps: number,
    radius: number,
    center: Vec3,
    startAngle: number,
    playerStartAngle: number,
    direction: number
) => Object;

const regl = require('regl')();
const extend = require('xtend');

const DIRECTION_CW = -1;
const DIRECTION_CCW = 1;

const draw: EntityDraw = regl({
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

const rad = degree => degree * Math.PI / 180;
const curveMove = ({
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
    const angle = rad(startAngle + curveProgress);
    const playerAngle = rad(playerStartAngle + curveProgress);
    const x = center[0] + radius * Math.cos(angle);
    const y = center[1] + radius * Math.sin(angle);
    const newPosition = [x, y, 0];
    return extend(state, { position: newPosition, angleZ: playerAngle });
};

const trailDebug: TrailDebug = (
    state,
    states,
    steps,
    radius,
    center,
    startAngle,
    playerStartAngle,
    direction
) => {
    for (let count = 0; count <= steps; count++) {
        // for (let count = 0; count < steps/2; count++) {
        state = extend(state, {
            player: curveMove({
                state: state.player,
                center,
                startAngle,
                playerStartAngle,
                progress: count / steps,
                radius,
                curveAngle: 90,
                direction
            })
        });
        states.push(extend(state));
    }
    return state;
};
module.exports = {
    drawPlayer: draw,
    trailDebug,
    DIRECTION_CW,
    DIRECTION_CCW
};
