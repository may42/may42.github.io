;!function(global){
    "use strict";

    // switch to true if you want to display unknown errors in the html
    var logUnknownErrors = false;

    var settings = {
        lowerLimit: 2,
        upperLimit: 10,
        success: function() {
            $('.sidebar').toggleClass('error', false).toggleClass('active', true);
        },
        error: function(e) {
            $('.sidebar').toggleClass('error', true);
            var div = $('.sidebar .error-message');
            if (e.message === 'Bad matrix sizes') {
                div.text('Такие матрицы нельзя перемножить, так как количество столбцов матрицы А не равно количеству строк матрицы В.');
            } else if (logUnknownErrors) {
                div.text('Извините, произошла ошибка!\n' + e.name + ': ' + e.message);
            } else {
                div.text('Извините, произошла ошибка!');
            }
        }
    };

    try {

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

        $("td input").mask("00");

    } catch(e) {
        $('.sidebar').toggleClass('error', true);
        $('.sidebar .error-message').text('Извините, при запуске калькулятора произошла ошибка!');
        console.error(e);
    }
}();

