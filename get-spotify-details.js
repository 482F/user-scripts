// ==UserScript==
// @name         clip spotify
// @version      0.1
// @author       You
// @match        https://open.spotify.com/collection/tracks
// @match        https://open.spotify.com/playlist/*
// @require      file://C:/user-scripts/get-spotify-details.js
// ==/UserScript==

;(async function () {
  const sleep = async (ms, interval = 100) =>
    await new Promise((resolve) => setTimeout(resolve, ms))
  const wait = async (func, interval) => {
    let result = null
    while (!(result = await func())) {
      await sleep(interval)
    }
    return result
  }
  const clip = async (data) => {
    const blobs = Object.fromEntries(
      Object.entries(data).map(([type, body]) => [
        type,
        new Blob([body], { type }),
      ])
    )
    const clipboardItem = new ClipboardItem(blobs)
    await navigator.clipboard.write([clipboardItem])
  }
  const clipText = async (text) => clip({ 'text/plain': text })
  let scroller = await wait(() =>
    document.querySelector(
      'div.Root__main-view div.os-viewport.os-viewport-native-scrollbars-invisible'
    )
  )
  const clipData = async () => {
    const data = []
    const numberOfMusics = [...document.querySelectorAll("span[as='span']")]
      .filter((el) => el.innerText.match(/^\d+ 曲, .+分$/))?.[0]
      .innerText.match(/^\d+/)?.[0]
    let isFirst = true
    while (data.at(-1)?.match(/^\d+/)?.[0] !== numberOfMusics) {
      const elements = await wait(() => {
        const es = (() => {
          const ptl = [
            ...document.querySelectorAll(
              "div[data-testid='playlist-tracklist'] div[data-testid='tracklist-row']"
            ),
          ]
          if (ptl.length) return ptl
          const ftl = [
            ...document.querySelectorAll("div[data-testid='tracklist-row']"),
          ]
          return ftl
        })()
        if (isFirst) {
          if (es?.[0].innerText.match(/^1\n/)) {
            return es
          } else {
            return null
          }
        } else {
          if (es.at(-1).innerText !== data.at(-1)) {
            return es
          } else {
            return null
          }
        }
      })
      const partData = elements.map((el) => el.innerText)
      isFirst = false
      elements.at(-1).scrollIntoView(true)
      data.push(...partData)
      await sleep(100)
    }
    const uniqueData = Object.values(
      Object.fromEntries(data.map((datum) => [datum.match(/^\d+/)[0], datum]))
    )
    await clipText(
      uniqueData
        .map((datum) => datum.replaceAll(',', '，').replaceAll('\n', ','))
        .join('\n')
    )
  }

  document.addEventListener('contextmenu', (e) => {
    if (e.ctrlKey) clipData()
  })
})()
