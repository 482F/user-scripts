// ==UserScript==
// @name         copy lyric
// @namespace    482F
// @version      0.1
// @author       482F
// @match        http*://*/*
// @grant        unsafeWindow
// @require      file://C:/user-scripts/copy-lyric.js
// @run-at       context-menu
// ==/UserScript==

;(async function () {
  const f = unsafeWindow.tmFunctions
  const rawLyric = window.getSelection?.()?.toString?.()
  if (!rawLyric) {
    return
  }
  const lyric = rawLyric
    .replaceAll(/\n+/g, '\n')
    .replaceAll(/^\s+/g, '')
    .replaceAll(/　/g, ' ')
  await f.clipText(lyric)
})()
