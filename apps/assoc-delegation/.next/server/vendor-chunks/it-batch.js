"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/it-batch";
exports.ids = ["vendor-chunks/it-batch"];
exports.modules = {

/***/ "(rsc)/../../node_modules/it-batch/index.js":
/*!********************************************!*\
  !*** ../../node_modules/it-batch/index.js ***!
  \********************************************/
/***/ ((module) => {

eval("\n\n/**\n * Takes an (async) iterable that emits things and returns an async iterable that\n * emits those things in fixed-sized batches.\n *\n * @template T\n * @param {AsyncIterable<T>|Iterable<T>} source\n * @param {number} [size=1]\n * @returns {AsyncIterable<T[]>}\n */\nasync function * batch (source, size = 1) {\n  /** @type {T[]} */\n  let things = []\n\n  if (size < 1) {\n    size = 1\n  }\n\n  for await (const thing of source) {\n    things.push(thing)\n\n    while (things.length >= size) {\n      yield things.slice(0, size)\n\n      things = things.slice(size)\n    }\n  }\n\n  while (things.length) {\n    yield things.slice(0, size)\n\n    things = things.slice(size)\n  }\n}\n\nmodule.exports = batch\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzL2l0LWJhdGNoL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFZOztBQUVaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLDhCQUE4QjtBQUN6QyxXQUFXLFFBQVE7QUFDbkIsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhLEtBQUs7QUFDbEI7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEiLCJzb3VyY2VzIjpbIi9ob21lL2JhcmIvYWEvQXNzb2NpYXRlZEFjY291bnRzL25vZGVfbW9kdWxlcy9pdC1iYXRjaC9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuLyoqXG4gKiBUYWtlcyBhbiAoYXN5bmMpIGl0ZXJhYmxlIHRoYXQgZW1pdHMgdGhpbmdzIGFuZCByZXR1cm5zIGFuIGFzeW5jIGl0ZXJhYmxlIHRoYXRcbiAqIGVtaXRzIHRob3NlIHRoaW5ncyBpbiBmaXhlZC1zaXplZCBiYXRjaGVzLlxuICpcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge0FzeW5jSXRlcmFibGU8VD58SXRlcmFibGU8VD59IHNvdXJjZVxuICogQHBhcmFtIHtudW1iZXJ9IFtzaXplPTFdXG4gKiBAcmV0dXJucyB7QXN5bmNJdGVyYWJsZTxUW10+fVxuICovXG5hc3luYyBmdW5jdGlvbiAqIGJhdGNoIChzb3VyY2UsIHNpemUgPSAxKSB7XG4gIC8qKiBAdHlwZSB7VFtdfSAqL1xuICBsZXQgdGhpbmdzID0gW11cblxuICBpZiAoc2l6ZSA8IDEpIHtcbiAgICBzaXplID0gMVxuICB9XG5cbiAgZm9yIGF3YWl0IChjb25zdCB0aGluZyBvZiBzb3VyY2UpIHtcbiAgICB0aGluZ3MucHVzaCh0aGluZylcblxuICAgIHdoaWxlICh0aGluZ3MubGVuZ3RoID49IHNpemUpIHtcbiAgICAgIHlpZWxkIHRoaW5ncy5zbGljZSgwLCBzaXplKVxuXG4gICAgICB0aGluZ3MgPSB0aGluZ3Muc2xpY2Uoc2l6ZSlcbiAgICB9XG4gIH1cblxuICB3aGlsZSAodGhpbmdzLmxlbmd0aCkge1xuICAgIHlpZWxkIHRoaW5ncy5zbGljZSgwLCBzaXplKVxuXG4gICAgdGhpbmdzID0gdGhpbmdzLnNsaWNlKHNpemUpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXRjaFxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/it-batch/index.js\n");

/***/ })

};
;