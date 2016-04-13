;!function(global){
    "use strict";

    $(".matrix input").mask("-09", {
        'translation': {
            '0': {pattern: /\d/},
            '9': {pattern: /\d/, optional: true},
            "-": {pattern: /-/, optional: true}
        }});

    // switch to true if you want to display unknown errors in the html
    var logUnknownErrors = false;
    var sidebar = $('.sidebar');
    var errorDiv = $('.sidebar .error-message');
    var badSizesText = 'Такие матрицы нельзя перемножить, так как количество ' +
        'столбцов матрицы А не равно количеству строк матрицы В.';

    $(".matrix").focusin(function(event) {
        if ($(event.target).is("input[type=text]")) sidebar.toggleClass('active', true);
    }).focusout(function(event) {
        if ($(event.target).is("input[type=text]")) sidebar.toggleClass('active', false);
    });

    var settings = {
        lowerLimit: 2,
        upperLimit: 10,
        success: function() {
            sidebar.toggleClass('error', false);
        },
        error: function(e) {
            sidebar.toggleClass('error', true);
            if (e.message === 'Bad matrix sizes') {
                errorDiv.text(badSizesText);
                return;
            }
            var text = 'Извините, произошла ошибка!';
            if (logUnknownErrors) text += '\n' + e.name + ': ' + e.message;
            errorDiv.text(text);
        }
    };

    try {

        global.calculator = new Calculator($('.matrix-a tbody'), $('.matrix-b tbody'),
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

    } catch(e) {
        sidebar.toggleClass('error', true);
        errorDiv.text('Извините, при запуске калькулятора произошла ошибка!');
        console.error(e);
    }
}(window);

