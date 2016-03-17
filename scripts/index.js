"use strict";

var settings = {
    lowerLimit: 2,
    upperLimit: 10,
    cantMultiplyMessage: function() {
        console.log('cantMultiplyMessage called successfully! [function is not done]');
        console.log('It will make sidebar red and show warning "cant multiply" message');
    }
};
window.calculator = new Calculator($('.matrix-a tbody'), $('.matrix-b tbody'),
    $('.result-matrix tbody'), $('input[name="which-matrix"]'), settings);

// biding submit
$("#calculator-form").submit(calculator.tryMultiply);
// binding swap
$("#swap").click(calculator.swapMatrices);
// binding size changing
$("#addRow").click(calculator.addRow);
$("#addCol").click(calculator.addCol);
$("#removeRow").click(calculator.removeRow);
$("#removeCol").click(calculator.removeCol);