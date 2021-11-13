// ==UserScript==
// @name         おーぷん2ch自動全表示
// @namespace    482F
// @version      0.1
// @author       482F
// @match        https://hayabusa.open2ch.net/test/read.cgi/*/*/l10
// @grant        unsafeWindow
// @require      file://C:/user-scripts/open-2ch-auto-shift.js
// ==/UserScript==

;(async function () {
  location.href = location.href.replace(/\/l10$/, '')
})()
