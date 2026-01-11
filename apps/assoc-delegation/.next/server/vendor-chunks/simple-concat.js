/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/simple-concat";
exports.ids = ["vendor-chunks/simple-concat"];
exports.modules = {

/***/ "(rsc)/../../node_modules/simple-concat/index.js":
/*!*************************************************!*\
  !*** ../../node_modules/simple-concat/index.js ***!
  \*************************************************/
/***/ ((module) => {

eval("/*! simple-concat. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */\nmodule.exports = function (stream, cb) {\n  var chunks = []\n  stream.on('data', function (chunk) {\n    chunks.push(chunk)\n  })\n  stream.once('end', function () {\n    if (cb) cb(null, Buffer.concat(chunks))\n    cb = null\n  })\n  stream.once('error', function (err) {\n    if (cb) cb(err)\n    cb = null\n  })\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzL3NpbXBsZS1jb25jYXQvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIIiwic291cmNlcyI6WyIvaG9tZS9iYXJiL2FhL0Fzc29jaWF0ZWRBY2NvdW50cy9ub2RlX21vZHVsZXMvc2ltcGxlLWNvbmNhdC9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiEgc2ltcGxlLWNvbmNhdC4gTUlUIExpY2Vuc2UuIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZy9vcGVuc291cmNlPiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc3RyZWFtLCBjYikge1xuICB2YXIgY2h1bmtzID0gW11cbiAgc3RyZWFtLm9uKCdkYXRhJywgZnVuY3Rpb24gKGNodW5rKSB7XG4gICAgY2h1bmtzLnB1c2goY2h1bmspXG4gIH0pXG4gIHN0cmVhbS5vbmNlKCdlbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGNiKSBjYihudWxsLCBCdWZmZXIuY29uY2F0KGNodW5rcykpXG4gICAgY2IgPSBudWxsXG4gIH0pXG4gIHN0cmVhbS5vbmNlKCdlcnJvcicsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoY2IpIGNiKGVycilcbiAgICBjYiA9IG51bGxcbiAgfSlcbn1cbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/simple-concat/index.js\n");

/***/ })

};
;