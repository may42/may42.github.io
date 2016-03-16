function $(id) {
    return document.getElementById(id);
}

function tryMultiply() {
    console.log('tryMultiply() called successfully! [function is not done]');
    event.preventDefault();
    /* я где-то видел другой способ предотвращения отправки формы на сервер:
     с помощью атрибута тега <form>... но я не смог найти какого атрибута. */
}

function swapMatrices() {
    console.log('swapMatrices() called successfully! [function is not done]');
}

function changeRows(x) {
    console.log('changeRows(' + x + ') called successfully! [function is not done]');
}

function changeCols(x) {
    console.log('changeCols(' + x + ') called successfully! [function is not done]');
}

/* может воспользоваться модулем, чтобы не загружать глобальное пространство?
    !function(){
        var calculator = {};
        calculator.foo = function(){};
        calculator.bar = function(){};
        window.calculator = calculator;
    }();
 */
