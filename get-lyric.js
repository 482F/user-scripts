// ==UserScript==
// @name         get lyric
// @namespace    482F
// @version      0.1
// @author       482F
// @match        https://www.uta-net.com/song/*
// @match        https://utaten.com/lyric/*
// @match        https://www.utamap.com/showkasi.php?surl=*
// @match        https://j-lyric.net/artist/*
// @match        https://www.google.com/search?q=*
// @grant        unsafeWindow
// @require      file://C:/user-scripts/get-lyric.js
// ==/UserScript==

;(async function () {
  const f = unsafeWindow.tmFunctions
  async function utaNet() {
    const kashiArea = await f.wait(() => document.getElementById('kashi_area'))
    return kashiArea.innerText.replaceAll(/\n+/g, '\n')
  }
  async function utaten() {
    const lyrics = Array.from(document.querySelector('.hiragana').childNodes)
    return lyrics
      .map((node) => {
        if (node.nodeName === '#text') {
          return node.textContent
        } else if (node.nodeName === 'SPAN') {
          return node.children[0].innerText
        }
        return ''
      })
      .reduce((all, part) => all + part, '')
  }
  async function utamap() {
    return document.querySelector('td.noprint.kasi_honbun').innerText
  }
  async function jlyric() {
    return document.getElementById('Lyric').innerText
  }
  async function google() {
    return [...document.querySelectorAll('div')].filter(
      (e) => e.children.length === 0 && e.innerText === '歌詞は印刷できません'
    )?.[0]?.nextSibling?.firstChild?.innerText
  }
  const functions = {
    'www.uta-net.com': utaNet,
    'utaten.com': utaten,
    'www.utamap.com': utamap,
    'j-lyric.net': jlyric,
    'www.google.com': google,
  }
  const lyric = (await functions[location.host]())
    .replaceAll(/\n+/g, '\n')
    .replaceAll(/^\s+/g, '')
    .replaceAll(/　/g, ' ')
  if (!lyric) return
  await f.clipText(lyric)
})()
