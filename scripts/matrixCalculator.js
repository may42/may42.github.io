/**
 * Creates a calculator object
 * @param {jQuery} aMatrixTable - jQuery object pointed on <tbody> element of matrix a
 * @param {jQuery} bMatrixTable - jQuery object pointed on <tbody> element of matrix b
 * @param {jQuery} cMatrixTable - jQuery object pointed on <tbody> element of matrix c
 * @param {jQuery} radioInputs - set of 2 jQuery radio inputs with same name, which values are 'a' and 'b' ('c' is not supported)
 * @param {Object} settings - optional parameter with settings
 * @param {number} settings.lowerLimit - integer, minimum size (width or height) of all matrices
 * @param {number} settings.upperLimit - integer, maximum size (width or height) of all matrices
 * @param {function} settings.success - function that will be fired when matrix action completed successfully
 * @param {function} settings.error - function that will handle errors (except the initialization errors)
 * @returns {object} calculator object
 */
window.Calculator = function(aMatrixTable, bMatrixTable, cMatrixTable, radioInputs, settings) {
    "use strict";

    settings = settings || {};
    var lowerLimit = settings.lowerLimit || 1;
    var upperLimit = settings.upperLimit || 8;

    var success = settings.success;
    if (typeof success !== "function") success = function(){};
    var fireError = settings.error;
    if (typeof fireError !== "function") fireError = function(e){ throw e };

    // check if first 3 arguments are correct
    for (var i = 0, args = arguments; i < 3; i++)
        if (!args[i] || !(args[i] instanceof $) || args[i].length !== 1 || args[i].prop("tagName") !== 'TBODY')
            throw new SyntaxError('Argument number ' + (i + 1) + ' must be a jQuery object, pointed on a single tbody html element');

    // check if 4th argument is correct
    if (!radioInputs || !(radioInputs instanceof $))
        throw new SyntaxError('Argument number 4 must be a jQuery set');
    radioInputs = radioInputs.filter('input[type="radio"]');
    if (radioInputs.length !== 2)
        throw new SyntaxError('Argument number 4 must contain two radio input elements');
    if (radioInputs.filter('*:checked').length !== 1)
        throw new SyntaxError('One of the radio inputs must be checked');
    for (i = 0; i < 2; i++) {
        var radioValue = radioInputs.eq(i).prop('value');
        if (radioValue !== 'a' && radioValue !== 'b')
            throw new SyntaxError('Expected radio input value "a" or "b", instead got "' + radioValue + '"');
    }

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
        fitMatrixWidth(matrix, lowerLimit, upperLimit);
        fitMatrixHeight(matrix, lowerLimit, upperLimit);
    }
    // fix c-matrix size, if it doesn't correspond with matrix-a or matrix-b sizes
    fitMatrixWidth(matrices.c, matrices.b.cols, matrices.b.cols);
    fitMatrixHeight(matrices.c, matrices.a.rows, matrices.a.rows);

    if (matrices.a.cols !== matrices.b.rows) fireError(new Error("Bad matrix sizes"));

    /**
     * Returns matrix, that is currently selected with which-matrix radio input
     * @returns {object} matrix that is currently selected
     */
    function whichMatrixSelected() {
        var checked = radioInputs.filter('*:checked');
        if (!checked.length)
            throw new ReferenceError('no matrix is currently selected with which-matrix radio input');
        return matrices[checked.prop('value')];
    }

    /**
     * Checks if given matrix size is out of lowerLimit--upperLimit range
     * @param {number} size
     * @returns {boolean}
     */
    function isSizeOutOfRange(size) {
        var outOfRange = size < lowerLimit || size > upperLimit;
        if (outOfRange) console.log('cant make ' + size + ' rows/cols, this size is out of range!');
        return outOfRange;
    }

    /**
     * Crops matrix width within given range
     * @param {object} matrix - matrix to be cropped
     * @param {number} lower - lower boundary of a range
     * @param {number} upper - upper boundary of a range
     */
    function fitMatrixWidth(matrix, lower, upper) {
        if (matrix.cols < lower) addCols(matrix, lower - matrix.cols);
        if (matrix.cols > upper) removeCols(matrix, matrix.cols - upper);
    }

    /**
     * Crops matrix height within given range
     * @param {object} matrix - matrix to be cropped
     * @param {number} lower - lower boundary of a range
     * @param {number} upper - upper boundary of a range
     */
    function fitMatrixHeight(matrix, lower, upper) {
        if (matrix.rows < lower) addRows(matrix, lower - matrix.rows);
        if (matrix.rows > upper) removeRows(matrix, matrix.rows - upper);
    }

    /**
     * Adds rows to a matrix
     * @param {object} matrix
     * @param {number} n - number of rows to be added
     */
    function addRows(matrix, n) {
        if (!isPositiveInteger(n)) return;
        if (isSizeOutOfRange(matrix.rows + n)) return;
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

    /**
     * Removes rows from a matrix
     * @param {object} matrix
     * @param {number} n - number of rows to be removed
     */
    function removeRows(matrix, n) {
        if (!isPositiveInteger(n)) return;
        if (isSizeOutOfRange(matrix.rows - n)) return;
        var rows = matrix.table.children();
        for (var i = rows.length - 1; i >= matrix.rows - n; i--) {
            rows.eq(i).remove();
        }
        matrix.rows -= n;
        // matrices.c.rows check is needed to prevent filling in initialization phase
        if (matrix.name === 'a' && matrices.c.rows) removeRows(matrices.c, n);
    }

    /**
     * Adds columns to a matrix
     * @param {object} matrix
     * @param {number} n - number of columns to be added
     */
    function addCols(matrix, n) {
        if (!isPositiveInteger(n)) return;
        if (isSizeOutOfRange(matrix.cols + n)) return;
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

    /**
     * Removes columns from a matrix
     * @param {object} matrix
     * @param {number} n - number of columns to be removed
     */
    function removeCols(matrix, n) {
        if (!isPositiveInteger(n)) return;
        if (isSizeOutOfRange(matrix.cols - n)) return;
        var rows = matrix.table.children();
        for (var i = 0; i < matrix.rows; i++) {
            var cells = rows.eq(i).children();
            for (var j = cells.length - 1; j >= matrix.cols - n; j--) {
                cells.eq(j).remove();
            }
        }
        matrix.cols -= n;
        // matrices.c.cols check is needed to prevent filling in initialization phase
        if (matrix.name === 'b' && matrices.c.cols) removeCols(matrices.c, n);
    }

    /**
     * Checks if matrices can be multiplied, calls success function if they can, calls error handler otherwise
     * @returns {boolean} can matrices be multiplied or not
     */
    function canMultiply() {
        try { clearResultingMatrix() } catch(e) {
            fireError(e);
            return false;
        }
        var allowed = matrices.a.cols === matrices.b.rows;
        if (allowed) success();
        else fireError(new Error("Bad matrix sizes"));
        return allowed;
    }

    /**
     * Tries to multiply current matrices a and b, and display result in matrix c
     */
    function tryMultiply(event) {
        event = event || window.event;
        if (canMultiply()) {
            try {
                readMatrix(matrices.a);
                readMatrix(matrices.b);
                matrices.c.content = window.multiplyMatrices(matrices.a.content, matrices.b.content);
                writeMatrix(matrices.c);
            } catch(e) {
                fireError(e);
            }
        }
        // preventing form sending:
        event.preventDefault ? event.preventDefault() : (event.returnValue = false); // for IE8
    }

    /**
     * Swaps matrices a and b
     */
    function swapMatrices() {
        var a = matrices.a, b = matrices.b;
        var buffer = {
            rows: a.rows,
            cols: a.cols,
            content: a.content.slice()
        };
        a.rows = b.rows;
        a.cols = b.cols;
        a.content = b.content;
        b.rows = buffer.rows;
        b.cols = buffer.cols;
        b.content = buffer.content;

        var fragment = a.table.children().remove();
        a.table.append(b.table.children().remove());
        b.table.append(fragment);

        $('input', a.table).each(function(i, e) { $(e).attr('placeholder', 'a' + $(e).attr('placeholder').slice(1)) });
        $('input', b.table).each(function(i, e) { $(e).attr('placeholder', 'b' + $(e).attr('placeholder').slice(1)) });

        fitMatrixWidth(matrices.c, b.cols, b.cols);
        fitMatrixHeight(matrices.c, a.rows, a.rows);
        canMultiply();
    }

    /**
     * Reads matrix content from matrix.table html element and places it in matrix.content array
     * @param {object} matrix
     */
    function readMatrix(matrix) {
        var content = [];
        var allRows = matrix.table.children();
        for (var i = 0; i < matrix.rows; i++) {
            content.push([]);
            var cells = allRows.eq(i).find('input');
            if (cells.length < matrix.cols)
                throw new ReferenceError('row ' + (i + 1) + ' of matrix ' + matrix.name + ' is missing or incomplete');
            for (var j = 0; j < matrix.cols; j++) {
                var n = cells.eq(j).prop('value');
                if (isNaN(n) || !isFinite(n))
                     throw new TypeError(matrix.name + (i + 1) + ',' + (j + 1) + ' must contain a finite number, instead got: "' + n + '"');
                content[i].push(+n);
            }
        }
        matrix.content = content;
    }

    /**
     * Writes matrix content from matrix.content array to matrix.table html element
     * @param {object} matrix
     */
    function writeMatrix(matrix) {
        var content = matrix.content;
        if (!Array.isArray(content) || content.length < matrix.rows)
            throw new TypeError(matrix.name + '.content is not an array, or has a wrong length');
        var allRows = matrix.table.children();
        for (var i = 0; i < matrix.rows; i++) {
            if (!Array.isArray(content[i]) || content[i].length < matrix.cols)
                throw new TypeError(matrix.name + '.content[' + i + '] is not an array, or has a wrong length');
            var cells = allRows.eq(i).find('input');
            if (cells.length < matrix.cols)
                throw new ReferenceError('row ' + (i + 1) + ' of matrix ' + matrix.name + ' is missing or incomplete');
            for (var j = 0; j < matrix.cols; j++) {
                cells.eq(j).prop('value', +content[i][j]);
            }
        }
    }

    /**
     * Clears matrix c html element
     */
    function clearResultingMatrix() {
        var c = matrices.c;
        var allRows = c.table.children();
        for (var i = 0; i < c.rows; i++) {
            var cells = allRows.eq(i).find('input');
            if (cells.length < c.cols)
                throw new ReferenceError('row ' + (i + 1) + ' of matrix c is missing or incomplete');
            for (var j = 0; j < c.cols; j++) {
                cells.eq(j).prop('value', '');
            }
        }
    }

    /**
     * Calls error function if n is not a finite positive integer
     * @param {number} n - number to be checked
     */
    function isPositiveInteger(n) {
        if (!n || isNaN(n) || !isFinite(n) || n % 1 || n < 1) {
            fireError(new TypeError(n + ' - is not a finite positive integer'));
            return false;
        }
        return true;
    }

    return {
        matrices: matrices,
        addRow: function() { addRows(whichMatrixSelected(), 1); canMultiply(); },
        addCol: function() { addCols(whichMatrixSelected(), 1); canMultiply(); },
        removeRow: function() { removeRows(whichMatrixSelected(), 1); canMultiply(); },
        removeCol: function() { removeCols(whichMatrixSelected(), 1); canMultiply(); },
        tryMultiply: tryMultiply,
        swapMatrices: swapMatrices
    };
};