/*
 * First 3 arguments - must be jQuery objects, pointed on 3 <tbody> html elements
 * radioInputs - must be a set of 2 jQuery radio inputs with same name, which values are 'a' ond 'b' ['c' is not supported]
 * settings - is a optional object, that can contain following parameters:
 *     lowerLimit: minimum size (width or height) of all matrices
 *     upperLimit: maximum size (width or height) of all matrices
 *     changeState: function that will listen, whether a and b can be multiplied, or not
 */
window.Calculator = function(aMatrixTable, bMatrixTable, cMatrixTable, radioInputs, settings) {
    "use strict";

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
    var changeState = settings.changeState || function(){};
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
        fitMatrixWidthInBorders(matrix, lowerLimit, upperLimit);
        fitMatrixHeightInBorders(matrix, lowerLimit, upperLimit);
    }
    // fix c-matrix size, if it doesn't correspond with matrix-a or matrix-b sizes
    fitMatrixWidthInBorders(matrices.c, matrices.b.cols, matrices.b.cols);
    fitMatrixHeightInBorders(matrices.c, matrices.a.rows, matrices.a.rows);
    canMultiply();

    /*
     * Returns matrix, that is currently selected with which-matrix radio input
     */
    function whichMatrixSelected() {
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

    function fitMatrixWidthInBorders(matrix, lower, upper) {
        if (matrix.cols < lower) addCols(matrix, lower - matrix.cols);
        if (matrix.cols > upper) removeCols(matrix, matrix.cols - upper);
    }

    function fitMatrixHeightInBorders(matrix, lower, upper) {
        if (matrix.rows < lower) addRows(matrix, lower - matrix.rows);
        if (matrix.rows > upper) removeRows(matrix, matrix.rows - upper);
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

    /*
     * Will return true if matrices can be multiplied, false otherwise
     */
    function canMultiply() {
        clearResultingMatrix();
        var bool = matrices.a.cols === matrices.b.rows;
        changeState(bool);
        return bool;
    }

    function tryMultiply() {
        if (canMultiply()) {
            fillContentArrayWithValues(matrices.a); // reading a
            fillContentArrayWithValues(matrices.b); // reading b
            matrices.c.content = window.multiplyMatrices(matrices.a.content, matrices.b.content);
            fillValuesFromContentArray(matrices.c); // writing c
        }
        // preventing form sending
        event.preventDefault();
    }

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

        fitMatrixWidthInBorders(matrices.c, b.cols, b.cols);
        fitMatrixHeightInBorders(matrices.c, a.rows, a.rows);
        canMultiply();
    }

    function fillContentArrayWithValues(matrix) {
        var content = [];
        var allRows = matrix.table.children();
        for (var i = 0; i < matrix.rows; i++) {
            content.push([]);
            var cells = allRows.eq(i).find('input');
            if (cells.length < matrix.cols)
                throw new ReferenceError('row ' + (i + 1) + ' of matrix ' + matrix.name + ' is missing or incomplete');
            for (var j = 0; j < matrix.cols; j++) {
                var n = cells.eq(j).prop('value');
                if (isNaN(n) || !isFinite(n) || n % 1)
                    throw new TypeError(matrix.name + (i + 1) + ',' + (j + 1) + ' must contain a finite integer, instead got: ' + n);
                content[i].push(+n);
            }
        }
        matrix.content = content;
    }

    function fillValuesFromContentArray(matrix) {
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
