// ==UserScript==
// @name         pso2 雑談降順ソート
// @namespace    482F
// @version      0.1
// @author       482F
// @match        https://pso2.swiki.jp/index.php?%E9%9B%91%E8%AB%87%E6%8E%B2%E7%A4%BA%E6%9D%BF
// @grant        unsafeWindow
// @require      file://C:/user-scripts/pso2-zatsudan-reverse.js
// ==/UserScript==

;(async function () {
  const f = unsafeWindow.tmFunctions
  const list = document.querySelector('ul.list1')
  const ls = Array.from(list.querySelectorAll('li.pcmt'))
  list.prepend(...ls.reverse())
})()
