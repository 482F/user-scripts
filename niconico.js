// ==UserScript==
// @name         niconico
// @namespace    482F
// @version      0.1
// @author       482F
// @match        https://www.nicovideo.jp/*
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @require      file://C:/user-scripts/niconico.js
// ==/UserScript==

;(async function () {
  while (!unsafeWindow.tmFunctions) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  function commentInterceptor() {
    const fc = unsafeWindow.fetch
    const blacklist = GM_getValue('blacklist') ?? { word: [], userId: [] }
    unsafeWindow.fetch = async (...args) => {
      const r = await fc(...args)
      if (args[0] !== 'https://nvcomment.nicovideo.jp/v1/threads') return r
      const json = await r.json()
      const mainIndex = json.data.threads.findIndex(
        (thread) => thread.fork === 'main'
      )
      json.data.threads[mainIndex].comments = json.data.threads[
        mainIndex
      ].comments.filter(
        (c) =>
          !(
            blacklist.word.some((word) => c.body.match(new RegExp(word))) ||
            blacklist.userId.some((userId) => c.userId === userId)
          )
      )
      r.json = () => json
      return r
    }
    function addBlacklist(e) {
      const p = e.target.parentElement
      if (p.className === 'CommentContextMenuItems') {
        addUserId(p)
      } else {
        addWord()
      }
    }
    function addUserId(p) {
      const _userId = p
        .querySelector('input[name="inquiry"]')
        .value.match(/(?<=ユーザーID： )[^\s]+/)[0]
      const userId = prompt('ブラックリストへ登録するユーザ ID を入力', _userId)
      if (!userId) {
        return
      }
      blacklist.userId.push(userId)
      GM_setValue('blacklist', blacklist)
    }
    function addWord() {
      const word = prompt('ブラックリストへ登録する正規表現を入力')
      blacklist.word.push(word)
      GM_setValue('blacklist', blacklist)
    }
    document.addEventListener('contextmenu', (e) => {
      if (e.altKey) {
        e.preventDefault()
        addBlacklist(e)
      }
    })
  }

  function hideSeekbarHoverItem() {
    const style = document.createElement('style')
    document.head.appendChild(style)
    style.sheet.insertRule('.SeekBarHoverItem { display: none; }')
  }

  commentInterceptor()
  hideSeekbarHoverItem()
})()
