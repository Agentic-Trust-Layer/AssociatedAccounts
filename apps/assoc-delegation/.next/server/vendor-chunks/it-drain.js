"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/it-drain";
exports.ids = ["vendor-chunks/it-drain"];
exports.modules = {

/***/ "(rsc)/../../node_modules/it-drain/index.js":
/*!********************************************!*\
  !*** ../../node_modules/it-drain/index.js ***!
  \********************************************/
/***/ ((module) => {

eval("\n\n/**\n * Drains an (async) iterable discarding its' content and does not return\n * anything.\n *\n * @template T\n * @param {AsyncIterable<T>|Iterable<T>} source\n * @returns {Promise<void>}\n */\nconst drain = async (source) => {\n  for await (const _ of source) { } // eslint-disable-line no-unused-vars,no-empty\n}\n\nmodule.exports = drain\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzL2l0LWRyYWluL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFZOztBQUVaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLDhCQUE4QjtBQUN6QyxhQUFhO0FBQ2I7QUFDQTtBQUNBLG9DQUFvQztBQUNwQzs7QUFFQSIsInNvdXJjZXMiOlsiL2hvbWUvYmFyYi9hYS9Bc3NvY2lhdGVkQWNjb3VudHMvbm9kZV9tb2R1bGVzL2l0LWRyYWluL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4vKipcbiAqIERyYWlucyBhbiAoYXN5bmMpIGl0ZXJhYmxlIGRpc2NhcmRpbmcgaXRzJyBjb250ZW50IGFuZCBkb2VzIG5vdCByZXR1cm5cbiAqIGFueXRoaW5nLlxuICpcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge0FzeW5jSXRlcmFibGU8VD58SXRlcmFibGU8VD59IHNvdXJjZVxuICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gKi9cbmNvbnN0IGRyYWluID0gYXN5bmMgKHNvdXJjZSkgPT4ge1xuICBmb3IgYXdhaXQgKGNvbnN0IF8gb2Ygc291cmNlKSB7IH0gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFycyxuby1lbXB0eVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRyYWluXG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/it-drain/index.js\n");

/***/ })

};
;