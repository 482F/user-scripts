// ==UserScript==
// @name         mhアンテナ自動遷移
// @namespace    482F
// @version      0.1
// @author       482F
// @match        https://mhwmatome.antenam.jp/items/view/*
// @grant        unsafeWindow
// @require      file://C:/user-scripts/mhw-antenna-auto-shift.js
// ==/UserScript==

;(async function () {
  const f = unsafeWindow.tmFunctions
  location.href =
    'http://mhwmatome.antenam.jp/items/click/' +
    location.href.match(/[^\/]+$/)[0]
})()
