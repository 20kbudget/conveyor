// @flow

const regl = require('regl')();

/* Each of the 9 possible tiles is a mesh that can be
   built using a combination of 12 possible vertices:

      . . . .    . x x .    .  0  1  .
      . . . .    x x x x    2  3  4  5
      . . . .    x x x x    6  7  8  9
      . . . .    . x x .    . 10 11  .
*/
const vertices = [
    [-0.25, +1.00, 0],
    [+0.25, +1.00, 0],
    [-1.00, +0.25, 0],
    [-0.25, +0.25, 0],
    [+0.25, +0.25, 0],
    [+1.00, +0.25, 0],
    [-1.00, -0.25, 0],
    [-0.25, -0.25, 0],
    [+0.25, -0.25, 0],
    [+1.00, -0.25, 0],
    [-0.25, -1.00, 0],
    [+0.25, -1.00, 0]
];

/* Each tile has a name that describes
   the inputs assuming an output to the East:

           . N .
           W . E
           . S .

   . . .   . + .   . . .
   + o -   . o -   . o -
   . . .   . . .   . + .

   . + .   . + .   . . .   . + .
   . o -   + o -   + o -   + o -
   . + .   . . .   . + .   . + .

   There are two special tiles, one that
   has no inputs (begin) and one that
   has no output (end):

   . . .   . . .
   . + -   + o .
   . . .   . . .

   The record below contains the mesh of
   each tile using the indexes from the vertices
   buffer.
*/
const tiles = {
    w: [[2, 5], [6, 9]],
    n: [[0, 7], [7, 9], [1, 4], [4, 5]],
    s: [[10, 3], [3, 5], [11, 8], [8, 9]],
    ns: [[0, 10], [1, 4], [4, 5], [11, 8], [8, 9]],
    wn: [[2, 3], [3, 0], [1, 4], [4, 5], [6, 9]],
    ws: [[6, 7], [7, 10], [11, 8], [8, 9], [2, 5]],
    wns: [[6, 7], [7, 10], [11, 8], [8, 9], [2, 3], [3, 0], [1, 4], [4, 5]],
    begin: [[5, 3], [3, 7], [7, 9]],
    end: [[2, 4], [4, 8], [8, 6]]
};

console.log({vertices})
const draw = regl({
    attributes: {
        position: vertices
    },
    elements: (context, {name}) => tiles[name],
    uniforms: {},
    vert: `
    attribute vec3 position;
    void main() {
        gl_Position = vec4(position, 1);
    }
    `,
    frag: `
    void main() {
        gl_FragColor = vec4(1, 0, 0, 1);
    }
    `
});

module.exports = draw;
