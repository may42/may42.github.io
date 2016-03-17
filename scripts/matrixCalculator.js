/*
 * First 3 arguments - must be jQuery objects, pointed on 3 <tbody> html elements
 * radioInputs - must be a set of 2 jQuery radio inputs with same name, which values are 'a' ond 'b' ['c' is not supported]
 * settings - is a optional object, that can contain following parameters:
 *     lowerLimit: minimum size (width or height) of all matrices
 *     upperLimit: maximum size (width or height) of all matrices
 *     cantMultiplyMessage: function that will be called if matrices a and b cant be multiplied
 */
window.Calculator = function(aMatrixTable, bMatrixTable, cMatrixTable, radioInputs, settings) {
    "use strict";

    /*var matrices = {
        lowerLimit: 2,
        upperLimit: 10,
        a: { table: $('.matrix-a tbody').first() },
        b: { table: $('.matrix-b tbody').first() },
        c: { table: $('.result-matrix tbody').first() }
    };*/ // OLD

    // check if first 3 arguments are correct
    for (var i = 0; i < 3; i++)
        if (!arguments[i] || !(arguments[i] instanceof $) || arguments[i].length !== 1 || arguments[i].prop("tagName") !== 'TBODY')
            throw new SyntaxError('Argument number ' + (i + 1) + ' must be a jQuery object, pointed on a single tbody html element');

    // check if 4th argument is correct
    radioInputs = function(obj){
        // меня довольно сильно смущает эта проверка, но другого способа нормального я не придумал.
        if (!obj || !(obj instanceof $)) return;
        obj = obj.filter('input[type="radio"]');
        if (obj.length !== 2) return;
        var value = obj.first().prop('value');
        if (value !== 'a' && value !== 'b') return;
        value = obj.last().prop('value');
        if (value !== 'a' && value !== 'b') return;
        return obj;
    }(radioInputs);
    if (!radioInputs)
        throw new SyntaxError('Argument number 4 must be a jQuery set, containing two radio input elements, with values "a" and "b"');

    settings = settings || {};
    var lowerLimit = settings.lowerLimit || 1;
    var upperLimit = settings.upperLimit || 8;
    var cantMultiplyMessage = settings.cantMultiplyMessage || function(){};
    var matrices = {
        a: { table: aMatrixTable },
        b: { table: bMatrixTable },
        c: { table: cMatrixTable }
    };

    // initialization phase - fixes number of cols/rows of a matrix, if needed
    var names = ['a','b','c'];
    for (i = 0; i < names.length; i++) {
        var matrix = matrices[names[i]];
        matrix.content = [];
        matrix.name = names[i];
        var allRows = matrix.table.children();
        matrix.rows = allRows.length;
        matrix.cols = allRows.first().children().length;
        for (var j = 0; j < matrix.rows; j++)
            matrix.content.push([]);
        if (!matrix.table || !matrix.rows || !matrix.cols)
            throw new ReferenceError('html of matrix %s seems incorrect', matrix.name);
        // fix matrix size, if its out of range [lowerLimit, upperLimit]
        if (matrix.rows < lowerLimit) addRows(matrix, lowerLimit - matrix.rows);
        if (matrix.cols < lowerLimit) addCols(matrix, lowerLimit - matrix.cols);
        if (matrix.rows > upperLimit) removeRows(matrix, matrix.rows - upperLimit);
        if (matrix.cols > upperLimit) removeCols(matrix, matrix.cols - upperLimit);
    }
    // fix c-matrix size, if it doesn't correspond with matrix-a or matrix-b sizes
    if (matrices.c.rows < matrices.a.rows) addRows(matrices.c, matrices.a.rows - matrices.c.rows);
    if (matrices.c.cols < matrices.b.cols) addCols(matrices.c, matrices.b.cols - matrices.c.cols);
    if (matrices.c.rows > matrices.a.rows) removeRows(matrices.c, matrices.c.rows - matrices.a.rows);
    if (matrices.c.cols > matrices.b.cols) removeCols(matrices.c, matrices.c.cols - matrices.b.cols);

    /*
     * Returns matrix, that is currently selected with which-matrix radio input
     */
    function whichMatrixSelected() {
        /*var checkedRadio = $('input[name="which-matrix"]:checked');
         if (!checkedRadio.length) throw new ReferenceError('no matrix is currently selected with which-matrix radio input');
         if (checkedRadio.length > 1) throw new ReferenceError('to many matrices is currently selected with which-matrix radio input');
         var matrixName = checkedRadio.prop('value');
         if (!matrixName) throw new ReferenceError('which-matrix radio input value is undefined, please set correct value');
         var matrix = matrices[matrixName];
         if (!matrix) throw new ReferenceError('which-matrix radio input refers to unknown matrix "' + matrixName + '"');
         return matrix;
         */ //OLD
        var checked = radioInputs.filter(':checked');
        if (!checked.length) throw new ReferenceError('no matrix is currently selected with which-matrix radio input');
        return matrices[checked.prop('value')];
    }

    /*
     * Returns true if new size is out of range [lowerLimit, upperLimit], false otherwise
     */
    function isSizeOutOfRange(was, adding) {
        var become = was + adding;
        if (become < lowerLimit || become > upperLimit) {
            console.log('cant make ' + become + ' rows/cols, this size is out of range!');
            return true;
        }
        return false;
    }

    function addRows(matrix, n) {
        if (!n || isNaN(n) || !isFinite(n) || n % 1 || n < 1) throw new TypeError(n + ' - is not a finite positive integer');
        if (isSizeOutOfRange(matrix.rows, +n)) return;
        // lets insert multiple tr at once with single jQuery set of elements
        var fragment = $();
        var isDisabled = matrix.name === 'c' ? ' disabled' : '';
        for (var i = matrix.rows + 1; i <= matrix.rows + n; i++) {
            var row = $('<tr>');
            for (var j = 1; j <= matrix.cols; j++) {
                $('<td><input type="text" placeholder="' + matrix.name + i + ',' + j + '"' + isDisabled + '></td>')
                    .appendTo(row);
            }
            fragment = fragment.add(row);
        }
        matrix.table.append(fragment);
        matrix.rows += n;
        // matrices.c.rows check is needed to prevent filling in initialization phase
        if (matrix.name === 'a' && matrices.c.rows) addRows(matrices.c, n);
    }

    function removeRows(matrix, n) {
        if (!n || isNaN(n) || !isFinite(n) || n % 1 || n < 1) throw new TypeError(n + ' - is not a finite positive integer');
        if (isSizeOutOfRange(matrix.rows, -n)) return;
        var rows = matrix.table.children();
        for (var i = rows.length - 1; i >= matrix.rows - n; i--) {
            rows[i].remove();
        }
        matrix.rows -= n;
        // matrices.c.rows check is needed to prevent filling in initialization phase
        if (matrix.name === 'a' && matrices.c.rows) removeRows(matrices.c, n);
    }

    function addCols(matrix, n) {
        if (!n || isNaN(n) || !isFinite(n) || n % 1 || n < 1) throw new TypeError(n + ' - is not a finite positive integer');
        if (isSizeOutOfRange(matrix.cols, +n)) return;
        var isDisabled = matrix.name === 'c' ? ' disabled' : '';
        var rows = matrix.table.children();
        for (var i = 0; i < rows.length; i++) {
            for (var j = rows.eq(i).children().length + 1; j <= matrix.cols + n; j++) {
                $('<td><input type="text" placeholder="' + matrix.name + (i + 1) + ',' + j + '"' + isDisabled + '></td>')
                    .appendTo(rows[i]);
            }
        }
        matrix.cols += n;
        // matrices.c.cols check is needed to prevent filling in initialization phase
        if (matrix.name === 'b' && matrices.c.cols) addCols(matrices.c, n);
    }

    function removeCols(matrix, n) {
        if (!n || isNaN(n) || !isFinite(n) || n % 1 || n < 1) throw new TypeError(n + ' - is not a finite positive integer');
        if (isSizeOutOfRange(matrix.cols, -n)) return;
        var rows = matrix.table.children();
        for (var i = 0; i < matrix.rows; i++) {
            var cells = rows.eq(i).children();
            for (var j = cells.length - 1; j >= matrix.cols - n; j--) {
                cells[j].remove();
            }
        }
        matrix.cols -= n;
        // matrices.c.cols check is needed to prevent filling in initialization phase
        if (matrix.name === 'b' && matrices.c.cols) removeCols(matrices.c, n);
    }

    // todo:
    /*
     * Will make sidebar red and show warning 'cant multiply' message
     * Will return true if matrices can be multiplied, false otherwise
     */
    function canMultiply() {
        console.log('canMultiply() called successfully! [function is not done]');
    }

    // todo:
    function tryMultiply() {
        console.log('tryMultiply() called successfully! [function is not done]');

        //console.log( window.multiplyMatrices(matrices.a.content, matrices.b.content) );
        console.log( window.multiplyMatrices([[0,0], [0,0], [0,0]], [[0,0,0], [0,0,0]]) );

        // preventing form sending
        event.preventDefault();
    }

    // todo:
    function swapMatrices() {
        console.log('swapMatrices() called successfully! [function is not done]');
    }

    /*return {
        matrices: matrices,
        whichMatrixSelected: whichMatrixSelected,
        addRows: addRows,
        addCols: addCols,
        removeRows: removeRows,
        removeCols: removeCols,
        canMultiply: canMultiply,
        tryMultiply: tryMultiply,
        swapMatrices: swapMatrices
    };*/ // OLD
    return {
        matrices: matrices,
        addRow: function() { addRows(whichMatrixSelected(), 1) },
        addCol: function() { addCols(whichMatrixSelected(), 1) },
        removeRow: function() { removeRows(whichMatrixSelected(), 1) },
        removeCol: function() { removeCols(whichMatrixSelected(), 1) },
        tryMultiply: tryMultiply,
        swapMatrices: swapMatrices
    };
};
