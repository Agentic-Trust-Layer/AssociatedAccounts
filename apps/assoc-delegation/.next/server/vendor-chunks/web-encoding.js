"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/web-encoding";
exports.ids = ["vendor-chunks/web-encoding"];
exports.modules = {

/***/ "(rsc)/../../node_modules/web-encoding/src/lib.js":
/*!**************************************************!*\
  !*** ../../node_modules/web-encoding/src/lib.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\n\nexports.TextEncoder =\n  typeof TextEncoder !== \"undefined\" ? TextEncoder : (__webpack_require__(/*! util */ \"util\").TextEncoder)\n\nexports.TextDecoder =\n  typeof TextDecoder !== \"undefined\" ? TextDecoder : (__webpack_require__(/*! util */ \"util\").TextDecoder)\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzL3dlYi1lbmNvZGluZy9zcmMvbGliLmpzIiwibWFwcGluZ3MiOiJBQUFZOztBQUVaLG1CQUFtQjtBQUNuQixxREFBcUQscURBQTJCOztBQUVoRixtQkFBbUI7QUFDbkIscURBQXFELHFEQUEyQiIsInNvdXJjZXMiOlsiL2hvbWUvYmFyYi9hYS9Bc3NvY2lhdGVkQWNjb3VudHMvbm9kZV9tb2R1bGVzL3dlYi1lbmNvZGluZy9zcmMvbGliLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiXG5cbmV4cG9ydHMuVGV4dEVuY29kZXIgPVxuICB0eXBlb2YgVGV4dEVuY29kZXIgIT09IFwidW5kZWZpbmVkXCIgPyBUZXh0RW5jb2RlciA6IHJlcXVpcmUoXCJ1dGlsXCIpLlRleHRFbmNvZGVyXG5cbmV4cG9ydHMuVGV4dERlY29kZXIgPVxuICB0eXBlb2YgVGV4dERlY29kZXIgIT09IFwidW5kZWZpbmVkXCIgPyBUZXh0RGVjb2RlciA6IHJlcXVpcmUoXCJ1dGlsXCIpLlRleHREZWNvZGVyXG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/web-encoding/src/lib.js\n");

/***/ }),

/***/ "(rsc)/../../node_modules/web-encoding/src/lib.mjs":
/*!***************************************************!*\
  !*** ../../node_modules/web-encoding/src/lib.mjs ***!
  \***************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   TextDecoder: () => (/* binding */ Decoder),\n/* harmony export */   TextEncoder: () => (/* binding */ Encoder)\n/* harmony export */ });\n// In node `export { TextEncoder }` throws:\n// \"Export 'TextEncoder' is not defined in module\"\n// To workaround we first define constants and then export with as.\nconst Encoder = TextEncoder\nconst Decoder = TextDecoder\n\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzL3dlYi1lbmNvZGluZy9zcmMvbGliLm1qcyIsIm1hcHBpbmdzIjoiOzs7OztBQUFBLHFCQUFxQixhQUFhO0FBQ2xDO0FBQ0E7QUFDQTtBQUNBOztBQUV5RCIsInNvdXJjZXMiOlsiL2hvbWUvYmFyYi9hYS9Bc3NvY2lhdGVkQWNjb3VudHMvbm9kZV9tb2R1bGVzL3dlYi1lbmNvZGluZy9zcmMvbGliLm1qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBJbiBub2RlIGBleHBvcnQgeyBUZXh0RW5jb2RlciB9YCB0aHJvd3M6XG4vLyBcIkV4cG9ydCAnVGV4dEVuY29kZXInIGlzIG5vdCBkZWZpbmVkIGluIG1vZHVsZVwiXG4vLyBUbyB3b3JrYXJvdW5kIHdlIGZpcnN0IGRlZmluZSBjb25zdGFudHMgYW5kIHRoZW4gZXhwb3J0IHdpdGggYXMuXG5jb25zdCBFbmNvZGVyID0gVGV4dEVuY29kZXJcbmNvbnN0IERlY29kZXIgPSBUZXh0RGVjb2RlclxuXG5leHBvcnQgeyBFbmNvZGVyIGFzIFRleHRFbmNvZGVyLCBEZWNvZGVyIGFzIFRleHREZWNvZGVyIH1cbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/web-encoding/src/lib.mjs\n");

/***/ })

};
;