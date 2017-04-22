const { zipWith } = require('ramda');

const vecSum = zipWith((a, b) => a + b);

module.exports = { vecSum };
