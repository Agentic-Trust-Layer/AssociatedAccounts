"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/responselike";
exports.ids = ["vendor-chunks/responselike"];
exports.modules = {

/***/ "(rsc)/../../node_modules/responselike/node_modules/lowercase-keys/index.js":
/*!****************************************************************************!*\
  !*** ../../node_modules/responselike/node_modules/lowercase-keys/index.js ***!
  \****************************************************************************/
/***/ ((module) => {

eval("\nmodule.exports = object => {\n\tconst result = {};\n\n\tfor (const [key, value] of Object.entries(object)) {\n\t\tresult[key.toLowerCase()] = value;\n\t}\n\n\treturn result;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzL3Jlc3BvbnNlbGlrZS9ub2RlX21vZHVsZXMvbG93ZXJjYXNlLWtleXMvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQWE7QUFDYjtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBIiwic291cmNlcyI6WyIvaG9tZS9iYXJiL2FhL0Fzc29jaWF0ZWRBY2NvdW50cy9ub2RlX21vZHVsZXMvcmVzcG9uc2VsaWtlL25vZGVfbW9kdWxlcy9sb3dlcmNhc2Uta2V5cy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdCA9PiB7XG5cdGNvbnN0IHJlc3VsdCA9IHt9O1xuXG5cdGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKG9iamVjdCkpIHtcblx0XHRyZXN1bHRba2V5LnRvTG93ZXJDYXNlKCldID0gdmFsdWU7XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufTtcbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/responselike/node_modules/lowercase-keys/index.js\n");

/***/ }),

/***/ "(rsc)/../../node_modules/responselike/src/index.js":
/*!****************************************************!*\
  !*** ../../node_modules/responselike/src/index.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nconst Readable = (__webpack_require__(/*! stream */ \"stream\").Readable);\nconst lowercaseKeys = __webpack_require__(/*! lowercase-keys */ \"(rsc)/../../node_modules/responselike/node_modules/lowercase-keys/index.js\");\n\nclass Response extends Readable {\n\tconstructor(statusCode, headers, body, url) {\n\t\tif (typeof statusCode !== 'number') {\n\t\t\tthrow new TypeError('Argument `statusCode` should be a number');\n\t\t}\n\t\tif (typeof headers !== 'object') {\n\t\t\tthrow new TypeError('Argument `headers` should be an object');\n\t\t}\n\t\tif (!(body instanceof Buffer)) {\n\t\t\tthrow new TypeError('Argument `body` should be a buffer');\n\t\t}\n\t\tif (typeof url !== 'string') {\n\t\t\tthrow new TypeError('Argument `url` should be a string');\n\t\t}\n\n\t\tsuper();\n\t\tthis.statusCode = statusCode;\n\t\tthis.headers = lowercaseKeys(headers);\n\t\tthis.body = body;\n\t\tthis.url = url;\n\t}\n\n\t_read() {\n\t\tthis.push(this.body);\n\t\tthis.push(null);\n\t}\n}\n\nmodule.exports = Response;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzL3Jlc3BvbnNlbGlrZS9zcmMvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQWE7O0FBRWIsaUJBQWlCLHNEQUEwQjtBQUMzQyxzQkFBc0IsbUJBQU8sQ0FBQyxrR0FBZ0I7O0FBRTlDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEiLCJzb3VyY2VzIjpbIi9ob21lL2JhcmIvYWEvQXNzb2NpYXRlZEFjY291bnRzL25vZGVfbW9kdWxlcy9yZXNwb25zZWxpa2Uvc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuY29uc3QgUmVhZGFibGUgPSByZXF1aXJlKCdzdHJlYW0nKS5SZWFkYWJsZTtcbmNvbnN0IGxvd2VyY2FzZUtleXMgPSByZXF1aXJlKCdsb3dlcmNhc2Uta2V5cycpO1xuXG5jbGFzcyBSZXNwb25zZSBleHRlbmRzIFJlYWRhYmxlIHtcblx0Y29uc3RydWN0b3Ioc3RhdHVzQ29kZSwgaGVhZGVycywgYm9keSwgdXJsKSB7XG5cdFx0aWYgKHR5cGVvZiBzdGF0dXNDb2RlICE9PSAnbnVtYmVyJykge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgYHN0YXR1c0NvZGVgIHNob3VsZCBiZSBhIG51bWJlcicpO1xuXHRcdH1cblx0XHRpZiAodHlwZW9mIGhlYWRlcnMgIT09ICdvYmplY3QnKSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBgaGVhZGVyc2Agc2hvdWxkIGJlIGFuIG9iamVjdCcpO1xuXHRcdH1cblx0XHRpZiAoIShib2R5IGluc3RhbmNlb2YgQnVmZmVyKSkge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgYGJvZHlgIHNob3VsZCBiZSBhIGJ1ZmZlcicpO1xuXHRcdH1cblx0XHRpZiAodHlwZW9mIHVybCAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IGB1cmxgIHNob3VsZCBiZSBhIHN0cmluZycpO1xuXHRcdH1cblxuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy5zdGF0dXNDb2RlID0gc3RhdHVzQ29kZTtcblx0XHR0aGlzLmhlYWRlcnMgPSBsb3dlcmNhc2VLZXlzKGhlYWRlcnMpO1xuXHRcdHRoaXMuYm9keSA9IGJvZHk7XG5cdFx0dGhpcy51cmwgPSB1cmw7XG5cdH1cblxuXHRfcmVhZCgpIHtcblx0XHR0aGlzLnB1c2godGhpcy5ib2R5KTtcblx0XHR0aGlzLnB1c2gobnVsbCk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXNwb25zZTtcbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/responselike/src/index.js\n");

/***/ })

};
;