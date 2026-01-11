/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/varint";
exports.ids = ["vendor-chunks/varint"];
exports.modules = {

/***/ "(rsc)/../../node_modules/varint/decode.js":
/*!*******************************************!*\
  !*** ../../node_modules/varint/decode.js ***!
  \*******************************************/
/***/ ((module) => {

eval("module.exports = read\n\nvar MSB = 0x80\n  , REST = 0x7F\n\nfunction read(buf, offset) {\n  var res    = 0\n    , offset = offset || 0\n    , shift  = 0\n    , counter = offset\n    , b\n    , l = buf.length\n\n  do {\n    if (counter >= l || shift > 49) {\n      read.bytes = 0\n      throw new RangeError('Could not decode varint')\n    }\n    b = buf[counter++]\n    res += shift < 28\n      ? (b & REST) << shift\n      : (b & REST) * Math.pow(2, shift)\n    shift += 7\n  } while (b >= MSB)\n\n  read.bytes = counter - offset\n\n  return res\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzL3ZhcmludC9kZWNvZGUuanMiLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7O0FBRUo7O0FBRUE7QUFDQSIsInNvdXJjZXMiOlsiL2hvbWUvYmFyYi9hYS9Bc3NvY2lhdGVkQWNjb3VudHMvbm9kZV9tb2R1bGVzL3ZhcmludC9kZWNvZGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSByZWFkXG5cbnZhciBNU0IgPSAweDgwXG4gICwgUkVTVCA9IDB4N0ZcblxuZnVuY3Rpb24gcmVhZChidWYsIG9mZnNldCkge1xuICB2YXIgcmVzICAgID0gMFxuICAgICwgb2Zmc2V0ID0gb2Zmc2V0IHx8IDBcbiAgICAsIHNoaWZ0ICA9IDBcbiAgICAsIGNvdW50ZXIgPSBvZmZzZXRcbiAgICAsIGJcbiAgICAsIGwgPSBidWYubGVuZ3RoXG5cbiAgZG8ge1xuICAgIGlmIChjb3VudGVyID49IGwgfHwgc2hpZnQgPiA0OSkge1xuICAgICAgcmVhZC5ieXRlcyA9IDBcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdDb3VsZCBub3QgZGVjb2RlIHZhcmludCcpXG4gICAgfVxuICAgIGIgPSBidWZbY291bnRlcisrXVxuICAgIHJlcyArPSBzaGlmdCA8IDI4XG4gICAgICA/IChiICYgUkVTVCkgPDwgc2hpZnRcbiAgICAgIDogKGIgJiBSRVNUKSAqIE1hdGgucG93KDIsIHNoaWZ0KVxuICAgIHNoaWZ0ICs9IDdcbiAgfSB3aGlsZSAoYiA+PSBNU0IpXG5cbiAgcmVhZC5ieXRlcyA9IGNvdW50ZXIgLSBvZmZzZXRcblxuICByZXR1cm4gcmVzXG59XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/varint/decode.js\n");

/***/ }),

/***/ "(rsc)/../../node_modules/varint/encode.js":
/*!*******************************************!*\
  !*** ../../node_modules/varint/encode.js ***!
  \*******************************************/
/***/ ((module) => {

eval("module.exports = encode\n\nvar MSB = 0x80\n  , REST = 0x7F\n  , MSBALL = ~REST\n  , INT = Math.pow(2, 31)\n\nfunction encode(num, out, offset) {\n  if (Number.MAX_SAFE_INTEGER && num > Number.MAX_SAFE_INTEGER) {\n    encode.bytes = 0\n    throw new RangeError('Could not encode varint')\n  }\n  out = out || []\n  offset = offset || 0\n  var oldOffset = offset\n\n  while(num >= INT) {\n    out[offset++] = (num & 0xFF) | MSB\n    num /= 128\n  }\n  while(num & MSBALL) {\n    out[offset++] = (num & 0xFF) | MSB\n    num >>>= 7\n  }\n  out[offset] = num | 0\n  \n  encode.bytes = offset - oldOffset + 1\n  \n  return out\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzL3ZhcmludC9lbmNvZGUuanMiLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyIvaG9tZS9iYXJiL2FhL0Fzc29jaWF0ZWRBY2NvdW50cy9ub2RlX21vZHVsZXMvdmFyaW50L2VuY29kZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IGVuY29kZVxuXG52YXIgTVNCID0gMHg4MFxuICAsIFJFU1QgPSAweDdGXG4gICwgTVNCQUxMID0gflJFU1RcbiAgLCBJTlQgPSBNYXRoLnBvdygyLCAzMSlcblxuZnVuY3Rpb24gZW5jb2RlKG51bSwgb3V0LCBvZmZzZXQpIHtcbiAgaWYgKE51bWJlci5NQVhfU0FGRV9JTlRFR0VSICYmIG51bSA+IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSB7XG4gICAgZW5jb2RlLmJ5dGVzID0gMFxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdDb3VsZCBub3QgZW5jb2RlIHZhcmludCcpXG4gIH1cbiAgb3V0ID0gb3V0IHx8IFtdXG4gIG9mZnNldCA9IG9mZnNldCB8fCAwXG4gIHZhciBvbGRPZmZzZXQgPSBvZmZzZXRcblxuICB3aGlsZShudW0gPj0gSU5UKSB7XG4gICAgb3V0W29mZnNldCsrXSA9IChudW0gJiAweEZGKSB8IE1TQlxuICAgIG51bSAvPSAxMjhcbiAgfVxuICB3aGlsZShudW0gJiBNU0JBTEwpIHtcbiAgICBvdXRbb2Zmc2V0KytdID0gKG51bSAmIDB4RkYpIHwgTVNCXG4gICAgbnVtID4+Pj0gN1xuICB9XG4gIG91dFtvZmZzZXRdID0gbnVtIHwgMFxuICBcbiAgZW5jb2RlLmJ5dGVzID0gb2Zmc2V0IC0gb2xkT2Zmc2V0ICsgMVxuICBcbiAgcmV0dXJuIG91dFxufVxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/varint/encode.js\n");

/***/ }),

/***/ "(rsc)/../../node_modules/varint/index.js":
/*!******************************************!*\
  !*** ../../node_modules/varint/index.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("module.exports = {\n    encode: __webpack_require__(/*! ./encode.js */ \"(rsc)/../../node_modules/varint/encode.js\")\n  , decode: __webpack_require__(/*! ./decode.js */ \"(rsc)/../../node_modules/varint/decode.js\")\n  , encodingLength: __webpack_require__(/*! ./length.js */ \"(rsc)/../../node_modules/varint/length.js\")\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzL3ZhcmludC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBQTtBQUNBLFlBQVksbUJBQU8sQ0FBQyw4REFBYTtBQUNqQyxZQUFZLG1CQUFPLENBQUMsOERBQWE7QUFDakMsb0JBQW9CLG1CQUFPLENBQUMsOERBQWE7QUFDekMiLCJzb3VyY2VzIjpbIi9ob21lL2JhcmIvYWEvQXNzb2NpYXRlZEFjY291bnRzL25vZGVfbW9kdWxlcy92YXJpbnQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZW5jb2RlOiByZXF1aXJlKCcuL2VuY29kZS5qcycpXG4gICwgZGVjb2RlOiByZXF1aXJlKCcuL2RlY29kZS5qcycpXG4gICwgZW5jb2RpbmdMZW5ndGg6IHJlcXVpcmUoJy4vbGVuZ3RoLmpzJylcbn1cbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/varint/index.js\n");

/***/ }),

/***/ "(rsc)/../../node_modules/varint/length.js":
/*!*******************************************!*\
  !*** ../../node_modules/varint/length.js ***!
  \*******************************************/
/***/ ((module) => {

eval("\nvar N1 = Math.pow(2,  7)\nvar N2 = Math.pow(2, 14)\nvar N3 = Math.pow(2, 21)\nvar N4 = Math.pow(2, 28)\nvar N5 = Math.pow(2, 35)\nvar N6 = Math.pow(2, 42)\nvar N7 = Math.pow(2, 49)\nvar N8 = Math.pow(2, 56)\nvar N9 = Math.pow(2, 63)\n\nmodule.exports = function (value) {\n  return (\n    value < N1 ? 1\n  : value < N2 ? 2\n  : value < N3 ? 3\n  : value < N4 ? 4\n  : value < N5 ? 5\n  : value < N6 ? 6\n  : value < N7 ? 7\n  : value < N8 ? 8\n  : value < N9 ? 9\n  :              10\n  )\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzL3ZhcmludC9sZW5ndGguanMiLCJtYXBwaW5ncyI6IjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyIvaG9tZS9iYXJiL2FhL0Fzc29jaWF0ZWRBY2NvdW50cy9ub2RlX21vZHVsZXMvdmFyaW50L2xlbmd0aC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbnZhciBOMSA9IE1hdGgucG93KDIsICA3KVxudmFyIE4yID0gTWF0aC5wb3coMiwgMTQpXG52YXIgTjMgPSBNYXRoLnBvdygyLCAyMSlcbnZhciBONCA9IE1hdGgucG93KDIsIDI4KVxudmFyIE41ID0gTWF0aC5wb3coMiwgMzUpXG52YXIgTjYgPSBNYXRoLnBvdygyLCA0MilcbnZhciBONyA9IE1hdGgucG93KDIsIDQ5KVxudmFyIE44ID0gTWF0aC5wb3coMiwgNTYpXG52YXIgTjkgPSBNYXRoLnBvdygyLCA2MylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIChcbiAgICB2YWx1ZSA8IE4xID8gMVxuICA6IHZhbHVlIDwgTjIgPyAyXG4gIDogdmFsdWUgPCBOMyA/IDNcbiAgOiB2YWx1ZSA8IE40ID8gNFxuICA6IHZhbHVlIDwgTjUgPyA1XG4gIDogdmFsdWUgPCBONiA/IDZcbiAgOiB2YWx1ZSA8IE43ID8gN1xuICA6IHZhbHVlIDwgTjggPyA4XG4gIDogdmFsdWUgPCBOOSA/IDlcbiAgOiAgICAgICAgICAgICAgMTBcbiAgKVxufVxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/varint/length.js\n");

/***/ })

};
;