// @flow

/*
 * Each track tile can be represented in a 3x3 grid
 * as n inputs and 1 output.
 *
 * List of the 8 possible tiles:
 * ----------------------------
 *
 * ### Basic
 *
 *   . . .  
 *   + o -  West input with East output (straight segment)
 *   . . .  
 *
 *   . - . 
 *   + o .  West input with North output (counter clockwise turn)
 *   . . . 
 *
 *   . . .
 *   + o .  West input with South output (clockwise turn)
 *   . - .
 *
 * ### Merges
 *
 *   . + .
 *   + o .  West and North inputs with South output
 *   . - .
 *
 *   . . .
 *   + o -  W, S -> E
 *   . + .
 *
 *   . - .
 *   + o +  W, E -> N
 *   . . .
 *
 *   . . .
 *   + o +  W, E -> S
 *   . - .
 *
 *   . + .
 *   + o -  W, N, S -> E
 *   . + .
 *
 * Data representation
 * -------------------
 *
 * Each of this tiles can be described in code with a inputs-output pair
 * where the inputs field is an array of coordinates (x, y, z), and the output
 * is a single coordinates.
 *
 * The possible values for coordinates are:
 *
 *    [-1,  1, 0]  [0,  1, 0]  [1,  1, 0]
 *    [-1,  0, 0]  [0,  0, 0]  [1,  0, 0]
 *    [-1, -1, 0]  [0, -1, 0]  [1, -1, 0]
 *
 * So the 8 possible tiles can be represented as:
 *
 *  w_e   = { output: [1,  0, 0], inputs: [ [-1, 0, 0] ] } 
 *  w_n   = { output: [0,  1, 0], inputs: [ [-1, 0, 0] ] } 
 *  w_s   = { output: [0, -1, 0], inputs: [ [-1, 0, 0] ] } 
 *  wn_e  = { output: [1,  0, 0], inputs: [ [-1, 0, 0], [0,  1, 0] ] } 
 *  ws_e  = { output: [1,  0, 0], inputs: [ [-1, 0, 0], [0, -1, 0] ] } 
 *  we_n  = { output: [0,  1, 0], inputs: [ [-1, 0, 0], [1,  0, 0] ] } 
 *  we_s  = { output: [0, -1, 0], inputs: [ [-1, 0, 0], [1,  0, 0] ] } 
 *  wns_e = { output: [1,  0, 0], inputs: [ [-1, 0, 0], [0,  1, 0], [0, -1, 0] ] } 
 */
const regl = require('regl')();

const draw = regl({
    attributes: {
    },
    uniforms: {
    },
    vert: `
    void main() {
    }
    `,
    frag: `
    void main() {
    }    
    `,
    count: 0
});

module.exports = draw;
