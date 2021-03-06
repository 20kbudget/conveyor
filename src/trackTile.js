// @flow
import type { Vec3 } from './basicTypes';
export type TrackTile = {
    name: string,
    offset: Vec3,
    angle: number,
    speed: number
};

const regl = require('regl')();
const extend = require('xtend');

/* Each of the 9 possible tiles is a mesh that can be
   built using a combination of 21 possible vertices:

      . . . . . . . . . . .     . . . . . . . . . . .    .  .  .  .  .  .  .  .  .  .  .
      . . . . . . . . . . .     . . . + . . . + . . .    .  .  .  0  .  .  .  1  .  .  .
      . . . . . . . . . . .     . . . . . + . + . . .    .  .  .  .  .  2  .  3  .  .  .
      . . . . . . . . . . .     . + . + . . . + + + .    .  4  .  5  .  .  .  6  7  8  .
      . . . . . . . . . . .     . . . . . . . . . . .    .  .  .  .  .  .  .  .  .  .  .
      . . . . . . . . . . .     . . + . . + . . . . +    .  .  9  .  . 10  .  .  .  . 11
      . . . . . . . . . . .     . . . . . . . . . . .    .  .  .  .  .  .  .  .  .  .  .
      . . . . . . . . . . .     . + . + . . . + + + .    . 12  . 13  .  .  . 14 15 16  .
      . . . . . . . . . . .     . . . . . + . + . . .    .  .  .  .  . 17  . 18  .  .  .
      . . . . . . . . . . .     . . . + . . . + . . .    .  .  . 19  .  .  . 20  .  .  .
      . . . . . . . . . . .     . . . . . . . . . . .    .  .  .  .  .  .  .  .  .  .  .
*/
const gridToVertex = (x, y) => [-1 + 2 / 10 * x, 1 - 2 / 10 * y, 0];
// prettier-ignore
const gridPoints = [
    [3, 1], [7, 1],
    [5, 2], [7, 2],
    [1, 3], [3, 3], [7, 3], [8, 3], [9, 3],
    [2, 5], [5, 5], [10, 5],
    [1, 7], [3, 7], [7, 7], [8, 7], [9, 7],
    [5, 8], [7, 8],
    [3, 9], [7, 9]
];
const vertices = gridPoints.map(point => gridToVertex(...point));

/* Each tile has a name based on the direction of
the inputs with the output facing east.

The diagram below shows each of them
using + for inputs and - for outputs:

forward, left, right,

   . . .   . + .   . . .
   + o -   . o -   . o -
   . . .   . . .   . + .

leftRight, forwardLeft, forwardRight,

   . + .   . + .   . . .
   . o -   + o -   + o -
   . + .   . . .   . + .

forwardLeftRight, begin, end

   . + .   . . .   . . .
   + o -   . + -   + o .
   . + .   . . .   . . .

*/
// prettier-ignore
const tiles = {
    forward: [[8, 11], [11, 16], [16, 12], [12, 9], [9, 4], [4, 8]],
    left: [ [8, 11], [11, 16], [16, 14], [14, 5], [5, 0], [0, 2], [2, 1], [1, 3], [3, 7], [7, 8] ],
    right: [ [8, 11], [11, 16], [16, 15], [15, 18], [18, 20], [20, 17], [17, 19], [19, 13], [13, 6], [6, 8] ],
    leftRight: [ [8, 11], [11, 16], [16, 15], [15, 18], [18, 20], [20, 17], [17, 19], [19, 13], [13, 10], [10, 5], [5, 0], [0, 2], [2, 1], [1, 3], [3, 7], [7, 8] ],
    forwardLeft: [ [8, 11], [11, 16], [16, 12], [12, 9], [9, 4], [4, 5], [5, 0], [0, 2], [2, 1], [1, 3], [3, 7], [7, 8] ],
    forwardRight: [ [8, 11], [11, 16], [16, 15], [15, 18], [18, 20], [20, 17], [17, 19], [19, 13], [13, 12], [12, 9], [9, 4], [4, 8] ],
    forwardLeftRight: [ [8, 11], [11, 16], [16, 15], [15, 18], [18, 20], [20, 17], [17, 19], [19, 13], [13, 12], [12, 9], [9, 4], [4, 5], [5, 0], [0, 2], [2, 1], [1, 3], [3, 7], [7, 8] ],
    begin: [[8, 11], [11, 16], [16, 13], [13, 5], [5, 8]],
    end: [[6, 14], [14, 12], [12, 9], [9, 4], [4, 6]]
};

const shortTileNames = {
    f: 'forward',
    lf: 'forwardLeft',
    rf: 'forwardRight',
    lrf: 'forwardLeftRight',
    rlf: 'forwardLeftRight',

    l: 'left',
    fl: 'forwardLeft',
    frl: 'forwardLeftRight',
    rfl: 'forwardLeftRight',

    r: 'right',
    fr: 'forwardRight',
    flr: 'forwardLeftRight',
    lfr: 'forwardLeftRight',

    bl: 'leftRight',
    br: 'leftRight'
};

const draw = regl({
    attributes: {
        position: vertices
    },
    elements: (context, { name }) => tiles[name],
    uniforms: {
        rotation: regl.prop('rotation'),
        translation: regl.prop('translation'),
        scaling: regl.prop('scaling'),
        view: regl.prop('view'),
        projection: (context, { projection }) => projection(context),
        color: regl.prop('color')
    },
    lineWidth: Math.min(2, regl.limits.lineWidthDims[1]),
    vert: `
    // current vertex
    attribute vec3 position;

    // transformations
    uniform mat4 rotation, translation, scaling, view, projection;

    mat4 model = translation  * scaling * rotation;

    // the tile output is always on east
    const vec3 exitCenter = vec3(1.0, 0, 0);

    // the maximum distance possibe
    const float maxDistance = sqrt(5.0);

    // output variables from vertex shader used by the fragments shader
    varying float distanceToExitLine;

    void main() {
        vec3 centeredYPosition = position + vec3(0, exitCenter.y - position.y, 0);
        distanceToExitLine = distance(centeredYPosition, exitCenter);
        gl_Position = projection * view * model * vec4(position, 1);
    }
    `,
    frag: `
    precision mediump float;
    uniform vec4 color;
    varying float distanceToExitLine;
    void main() {
        vec4 brightness = vec4(1,1,1,1);

        // usesful for debugging, paint the exit yellow
        // if (distanceToExitLine < 0.4) {
            // brightness = vec4(1.5, 1.5, 1, 1);
        // }

        gl_FragColor = color * brightness;
    }
    `
});

module.exports = {
    drawTile: draw,
    shortTileNames
};
