// ==UserScript==
// @name         Feeder control
// @namespace    482F
// @version      0.1
// @author       482F
// @match        https://feeder.co/reader?ctx=extension
// @grant        unsafeWindow
// @grant        GM_openInTab
// @require      file://C:/user-scripts/feeder-control.js
// ==/UserScript==

;(async function () {
  const f = unsafeWindow.tmFunctions
  const page = await f.wait(() =>
    document.querySelector('div.application-container')
  )
  page.tabIndex = -1

  const unread = [...document.querySelectorAll('.list-item')].find((el) =>
    el.innerText.match('Unread')
  )
  const itemsContainer = document.querySelector('.tpl-post-feed--scroll')
  const getCurrent = () => itemsContainer.querySelector('.expanded')

  function move(delta) {
    const current = getCurrent()
    const next = (() => {
      const all = [
        ...itemsContainer.querySelectorAll('.reader--post-content[data-post-id]'),
      ]
      const currentIndex = all.indexOf(current)
      if (delta === 1) {
        return all[currentIndex + 1] ?? all.at(-1)
      } else {
        return all[currentIndex - 1] ?? all[0]
      }
    })()
    console.log({ next })
    if (!next) {
      return false
    }
    next.click()
    return true
  }

  function update() {
    unread.click()
  }

  function open() {
    const current = getCurrent()
    const href = getCurrent()?.querySelector?.('.post-content--title')?.href
    if (!href) {
      return false
    }
    GM_openInTab(href, { active: false, insert: true })
  }

  function onKeydown(e) {
    if (e.key === 'ArrowDown') {
      move(1)
    } else if (e.key === 'ArrowUp') {
      move(-1)
    } else if (e.key === 'ArrowLeft') {
      update()
    } else if (e.key === 'ArrowRight') {
      open()
    }
    e.stopPropagation()
  }
  page.addEventListener('keydown', onKeydown, true)

  page.focus()
  unread.click()
})()
