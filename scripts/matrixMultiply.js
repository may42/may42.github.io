window.multiplyMatrices = function(matrixA, matrixB){
    "use strict";
    //todo:
    console.log('multiplyMatrices called successfully! [function is not done]');
    console.log('returning randomized result...');
    var result = [];
    for (var i = 0; i < matrixA.length; i++) {
        result.push([]);
        for (var j = 0; j < matrixB[0].length; j++) {
            result[i].push(Math.random() * 2 ^ 0);
        }
    }
    return result;
};