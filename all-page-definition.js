// ==UserScript==
// @name         All Page Definition
// @namespace    482F
// @version      0.1
// @author       482F
// @match        http*://*/*
// @grant        unsafeWindow
// @require      file://C:/user-scripts/all-page-definition.js
// ==/UserScript==

;(function () {
  const f = {}
  f.sleep = async (ms = 10) =>
    await new Promise((resolve) => setTimeout(resolve, ms))
  f.wait = async (func, waitTime, timeout) => {
    let timeouted = false
    if (timeout) {
      setTimeout(() => (timeouted = true), timeout)
    }
    let result
    while (!(result = await func())) {
      await f.sleep(waitTime)
      console.log(result)
    }
    return result
  }
  f.clip = async (data) => {
    const blobs = Object.fromEntries(
      Object.entries(data).map(([type, body]) => [
        type,
        new Blob([body], { type }),
      ])
    )
    const clipboardItem = new ClipboardItem(blobs)
    await navigator.clipboard.write([clipboardItem])
  }
  f.clipText = async (text) => f.clip({ 'text/plain': text })
  unsafeWindow.tmFunctions = f
})()
