// ==UserScript==
// @name         niconico comment interceptor
// @namespace    482F
// @version      0.1
// @author       482F
// @match        https://www.nicovideo.jp/watch/*
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @require      file://C:/user-scripts/niconico-comment-interceptor.js
// ==/UserScript==

;(async function () {
  while (!unsafeWindow.tmFunctions) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  const f = unsafeWindow.tmFunctions
  const fc = unsafeWindow.fetch
  const blacklist = GM_getValue('blacklist')
  unsafeWindow.fetch = async (...args) => {
    const r = await fc(...args)
    if (args[0] !== 'https://nvcomment.nicovideo.jp/legacy/api.json') return r
    // console.log(args, r)
    const arr = (await r.json()).filter((c) => {
      if (!c?.chat?.content) return true
      return !(
        blacklist.word.some((word) => c.chat.content.match(new RegExp(word))) ||
        blacklist.userId.some((userId) => c.chat.user_id === userId)
      )
    })
    return { json: () => arr }
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
})()
