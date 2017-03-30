const regl = require('regl')();

const draw = regl({
    uniforms: {
        gridSize: regl.prop('gridSize'),
        color: regl.prop('color'),
        screenSize: ({ viewportWidth, viewportHeight }) => [
            viewportWidth,
            viewportHeight
        ],
        fractionThreshold: ({ viewportWidth, viewportHeight }, {gridSize}) => [
            1 / (viewportWidth / gridSize[0]),
            1 / (viewportHeight / gridSize[1])

        ]
    },
    attributes: {
        vertices: [[-1, 1, 0], [1, 1, 0], [1, -1, 0], [-1, -1, 0]]
    },
    vert: `
    precision lowp float;
    attribute vec3 vertices;
    void main() {
        gl_Position = vec4(vertices, 0);
    }`,
    frag: `
    precision lowp float;
    uniform vec2 gridSize;
    uniform vec4 color;
    uniform vec2 screenSize;
    uniform vec2 fractionThreshold;
    void main() {
        vec2 tileDimensions = vec2(screenSize.x / gridSize.x, screenSize.y / gridSize.y);
        bool notVGrid = fract(gl_FragCoord.x / tileDimensions.x) > fractionThreshold.x;
        bool notHGrid = fract(gl_FragCoord.y / tileDimensions.y) > fractionThreshold.y;
        if (notVGrid && notHGrid) {
            discard;
        }
        gl_FragColor = color;
    }`,
    count: 3
});

module.exports = draw;
