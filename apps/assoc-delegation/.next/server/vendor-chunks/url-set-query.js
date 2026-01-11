/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/url-set-query";
exports.ids = ["vendor-chunks/url-set-query"];
exports.modules = {

/***/ "(rsc)/../../node_modules/url-set-query/index.js":
/*!*************************************************!*\
  !*** ../../node_modules/url-set-query/index.js ***!
  \*************************************************/
/***/ ((module) => {

eval("module.exports = urlSetQuery\nfunction urlSetQuery (url, query) {\n  if (query) {\n    // remove optional leading symbols\n    query = query.trim().replace(/^(\\?|#|&)/, '')\n\n    // don't append empty query\n    query = query ? ('?' + query) : query\n\n    var parts = url.split(/[\\?\\#]/)\n    var start = parts[0]\n    if (query && /\\:\\/\\/[^\\/]*$/.test(start)) {\n      // e.g. http://foo.com -> http://foo.com/\n      start = start + '/'\n    }\n    var match = url.match(/(\\#.*)$/)\n    url = start + query\n    if (match) { // add hash back in\n      url = url + match[0]\n    }\n  }\n  return url\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzL3VybC1zZXQtcXVlcnkvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsiL2hvbWUvYmFyYi9hYS9Bc3NvY2lhdGVkQWNjb3VudHMvbm9kZV9tb2R1bGVzL3VybC1zZXQtcXVlcnkvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSB1cmxTZXRRdWVyeVxuZnVuY3Rpb24gdXJsU2V0UXVlcnkgKHVybCwgcXVlcnkpIHtcbiAgaWYgKHF1ZXJ5KSB7XG4gICAgLy8gcmVtb3ZlIG9wdGlvbmFsIGxlYWRpbmcgc3ltYm9sc1xuICAgIHF1ZXJ5ID0gcXVlcnkudHJpbSgpLnJlcGxhY2UoL14oXFw/fCN8JikvLCAnJylcblxuICAgIC8vIGRvbid0IGFwcGVuZCBlbXB0eSBxdWVyeVxuICAgIHF1ZXJ5ID0gcXVlcnkgPyAoJz8nICsgcXVlcnkpIDogcXVlcnlcblxuICAgIHZhciBwYXJ0cyA9IHVybC5zcGxpdCgvW1xcP1xcI10vKVxuICAgIHZhciBzdGFydCA9IHBhcnRzWzBdXG4gICAgaWYgKHF1ZXJ5ICYmIC9cXDpcXC9cXC9bXlxcL10qJC8udGVzdChzdGFydCkpIHtcbiAgICAgIC8vIGUuZy4gaHR0cDovL2Zvby5jb20gLT4gaHR0cDovL2Zvby5jb20vXG4gICAgICBzdGFydCA9IHN0YXJ0ICsgJy8nXG4gICAgfVxuICAgIHZhciBtYXRjaCA9IHVybC5tYXRjaCgvKFxcIy4qKSQvKVxuICAgIHVybCA9IHN0YXJ0ICsgcXVlcnlcbiAgICBpZiAobWF0Y2gpIHsgLy8gYWRkIGhhc2ggYmFjayBpblxuICAgICAgdXJsID0gdXJsICsgbWF0Y2hbMF1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVybFxufVxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/url-set-query/index.js\n");

/***/ })

};
;