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
      json.data.threads[mainIndex].commentCount =
        json.data.threads[mainIndex].comments.length

      const easyIndex = json.data.threads.findIndex(
        (thread) => thread.fork === 'easy'
      )
      json.data.threads[easyIndex].comments = []
      json.data.threads[easyIndex].commetCount = 0
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

  function adjustWidth() {
    document.body.style.minWidth = '0px'
    document.body.style.overflowX = 'hidden'
    const historyContent = document.querySelector('HistoryPage-content')
    if (historyContent) {
      historyContent.style.width = 'auto'
    }
    const classes = [
      'HeaderContainer_Re',
      'UserPageFooterContainer',
      'PageTopButtonContainer',
      'UserPage-main',
      'UserDetailsHeader',
    ]
    classes.forEach((cls) => {
      const el = document.querySelector(`.${cls}`)
      if (el) {
        el.style.width = '100%'
      }
    })
  }

  async function hidePremiumHeader() {
    let premiumEl = await unsafeWindow.tmFunctions.wait(
      () =>
        [...document.querySelectorAll('ul[class^=common-header] > li')].filter(
          (el) => el.textContent === 'プレミアム会員登録'
        )[0],
      1000
    )
    console.log({ premiumEl })
    const parentNum = 4
    for (let i = 0; i < parentNum; i++) {
      premiumEl = premiumEl.parentElement
    }
    premiumEl.style.display = 'none'
  }

  async function userVideosContinuous() {
    const fc = unsafeWindow.fetch
    unsafeWindow.fetch = async (...args) => {
      const r = await fc(...args)
      if (
        !args[0]?.includes?.(
          'https://nvapi.nicovideo.jp/v1/playlist/user-uploaded/'
        ) ||
        !location.href.match(/watch\/sm\d+/)
      ) {
        return r
      }
      console.log('%cA', 'background-color: lightblue;')
      const json = await r.json()

      const userId = args[0].match(/user-uploaded\/(\d+)/)[1]
      const getVideos = (page) =>
        fc(
          `https://nvapi.nicovideo.jp/v3/users/${userId}/videos?` +
            Object.entries({
              sortKey: 'registeredAt',
              sortOrder: 'asc',
              sensitiveContents: 'mask',
              pageSize: '100',
              page,
            })
              .map((keyValue) => keyValue.join('='))
              .join('&'),
          {
            headers: {
              'x-frontend-id': '6',
            },
          }
        )
          .then((r) => r.json())
          .then((json) =>
            json.data.items.map((item) => ({
              content: item.essential,
              watchId: item.essential.id,
            }))
          )
      const currentVideoId = location.href.match(/sm\d+/)[0]

      const totalCount = json.data.totalCount
      const videos = []
      let newVideos = []
      let includedIndex = Infinity
      let i = 1

      while (videos.length < totalCount && i < includedIndex + 2) {
        console.log('getVideos', i)
        newVideos = await getVideos(i++)
        videos.push(...newVideos)
        if (newVideos.map((video) => video.watchId).includes(currentVideoId)) {
          includedIndex = i
        }
        console.log({totalCount, len: videos.length})
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      json.data.items = videos
      console.log({ json })
      r.json = () => json
      return r
    }
  }

  commentInterceptor()
  hideSeekbarHoverItem()
  adjustWidth()
  hidePremiumHeader()
  userVideosContinuous()
})()
