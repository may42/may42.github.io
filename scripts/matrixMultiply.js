window.multiplyMatrices = function(matrixA, matrixB) {
    "use strict";

    for (var i = 0; i < 2; i++)
        if (!arguments[i] || !Array.isArray(arguments[i]) || !arguments[i].length || !arguments[i][0].length)
            throw new SyntaxError('both arguments must be non-empty two-dimensional numeric arrays!');

    if (matrixB.length !== matrixA[0].length)
        throw new SyntaxError('width of the first matrix must be equal to height of the second matrix');

    var l = matrixB.length;
    var w = matrixB[0].length;
    var h = matrixA.length;
    var result = [];

    for (var y = 0; y < h; y++) {
        result.push([]);
        for (var x = 0; x < w; x++) {
            result[y].push(0);
            for (i = 0; i < l; i++)
                result[y][x] += matrixA[y][i] * matrixB[i][x];
        }
    }

    return result;
};