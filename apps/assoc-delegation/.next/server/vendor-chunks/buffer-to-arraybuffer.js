/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/buffer-to-arraybuffer";
exports.ids = ["vendor-chunks/buffer-to-arraybuffer"];
exports.modules = {

/***/ "(rsc)/../../node_modules/buffer-to-arraybuffer/buffer-to-arraybuffer.js":
/*!*************************************************************************!*\
  !*** ../../node_modules/buffer-to-arraybuffer/buffer-to-arraybuffer.js ***!
  \*************************************************************************/
/***/ (function(module, exports) {

eval("(function(root) {\n  var isArrayBufferSupported = (new Buffer(0)).buffer instanceof ArrayBuffer;\n\n  var bufferToArrayBuffer = isArrayBufferSupported ? bufferToArrayBufferSlice : bufferToArrayBufferCycle;\n\n  function bufferToArrayBufferSlice(buffer) {\n    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);\n  }\n\n  function bufferToArrayBufferCycle(buffer) {\n    var ab = new ArrayBuffer(buffer.length);\n    var view = new Uint8Array(ab);\n    for (var i = 0; i < buffer.length; ++i) {\n      view[i] = buffer[i];\n    }\n    return ab;\n  }\n\n  if (true) {\n    if ( true && module.exports) {\n      exports = module.exports = bufferToArrayBuffer;\n    }\n    exports.bufferToArrayBuffer = bufferToArrayBuffer;\n  } else {}\n})(this);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzL2J1ZmZlci10by1hcnJheWJ1ZmZlci9idWZmZXItdG8tYXJyYXlidWZmZXIuanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLG1CQUFtQjtBQUN2QztBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNLElBQThCO0FBQ3BDLFFBQVEsS0FBNkI7QUFDckM7QUFDQTtBQUNBLElBQUksMkJBQTJCO0FBQy9CLElBQUksS0FBSyxFQU1OO0FBQ0gsQ0FBQyIsInNvdXJjZXMiOlsiL2hvbWUvYmFyYi9hYS9Bc3NvY2lhdGVkQWNjb3VudHMvbm9kZV9tb2R1bGVzL2J1ZmZlci10by1hcnJheWJ1ZmZlci9idWZmZXItdG8tYXJyYXlidWZmZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKHJvb3QpIHtcbiAgdmFyIGlzQXJyYXlCdWZmZXJTdXBwb3J0ZWQgPSAobmV3IEJ1ZmZlcigwKSkuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXI7XG5cbiAgdmFyIGJ1ZmZlclRvQXJyYXlCdWZmZXIgPSBpc0FycmF5QnVmZmVyU3VwcG9ydGVkID8gYnVmZmVyVG9BcnJheUJ1ZmZlclNsaWNlIDogYnVmZmVyVG9BcnJheUJ1ZmZlckN5Y2xlO1xuXG4gIGZ1bmN0aW9uIGJ1ZmZlclRvQXJyYXlCdWZmZXJTbGljZShidWZmZXIpIHtcbiAgICByZXR1cm4gYnVmZmVyLmJ1ZmZlci5zbGljZShidWZmZXIuYnl0ZU9mZnNldCwgYnVmZmVyLmJ5dGVPZmZzZXQgKyBidWZmZXIuYnl0ZUxlbmd0aCk7XG4gIH1cblxuICBmdW5jdGlvbiBidWZmZXJUb0FycmF5QnVmZmVyQ3ljbGUoYnVmZmVyKSB7XG4gICAgdmFyIGFiID0gbmV3IEFycmF5QnVmZmVyKGJ1ZmZlci5sZW5ndGgpO1xuICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYWIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnVmZmVyLmxlbmd0aDsgKytpKSB7XG4gICAgICB2aWV3W2ldID0gYnVmZmVyW2ldO1xuICAgIH1cbiAgICByZXR1cm4gYWI7XG4gIH1cblxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBidWZmZXJUb0FycmF5QnVmZmVyO1xuICAgIH1cbiAgICBleHBvcnRzLmJ1ZmZlclRvQXJyYXlCdWZmZXIgPSBidWZmZXJUb0FycmF5QnVmZmVyO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShbXSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYnVmZmVyVG9BcnJheUJ1ZmZlcjtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByb290LmJ1ZmZlclRvQXJyYXlCdWZmZXIgPSBidWZmZXJUb0FycmF5QnVmZmVyO1xuICB9XG59KSh0aGlzKTtcbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/buffer-to-arraybuffer/buffer-to-arraybuffer.js\n");

/***/ })

};
;