// ==UserScript==
// @name         Booking.com スクレイピング
// @namespace    482F
// @version      0.1
// @author       482F
// @match        https://www.booking.com/searchresults.ja.html?*
// @grant        unsafeWindow
// @require      file://C:/user-scripts/scraping-booking-com.js
// @run-at       context-menu
// ==/UserScript==

function parseList(doc) {
  const rawList = doc.querySelectorAll('div[data-testid="property-card"]')
  const infos = []
  for (const rawElement of rawList) {
    try {
      const info = {}
      const children = [
        ...rawElement.firstChild.children[1].firstChild.children,
      ]
      const header = children[0]
      const detail = children.at(-1)
      if (!detail.children.length) {
        continue
      }
      const title = header.querySelector('a')
      info['name'] = title.innerText.replace(/\n|別のウィンドウで開きます/, '')
      info['pageLink'] = title.href
      info['starNum'] = header
        .querySelector('div[role="img"]')
        .children.length.toString()

      const headerDetail = header.firstChild.firstChild.firstChild.children[1]
      const cityA = headerDetail.querySelector('a')
      info['city'] = cityA.innerText.replace(/地図に表示/, '')
      info['mapLink'] = cityA.href
      info['distanceText'] = headerDetail
        .querySelector('span[data-testid="distance"]')
        .innerText.replace(/ $/, '')
      try {
        info['distance'] = info['distanceText'].match(/\d+(\.\d+)/)[0]
      } catch (e) {
        info['distance'] = ''
      }

      info['description'] = detail.firstChild.firstChild.innerText
      const price = detail.querySelector(
        'div[data-testid="price-and-discounted-price"]'
      ).parentElement

      info['price'] = price.children[1].innerText
        .match(/(\d+,)+\d+$/)[0]
        .replaceAll(/,/g, '')
      info['priceDescription'] = price.children[2].innerText

      const numberKey = ['distance', 'starNum']
      for (const [key, value] of Object.entries(info)) {
        if (numberKey.includes(key)) {
          continue
        }
        info[key] = `"${
          value?.replaceAll?.(/\n/g, '')?.replaceAll?.(/"/g, '”') ?? ''
        }"`
      }

      infos.push(info)
    } catch (e) {
      continue
    }
  }
  return infos
}

function toCsv(infos) {
  const keys = [
    'name',
    'starNum',
    'city',
    'price',
    'priceDescription',
    'distance',
    'description',
    'pageLink',
    'mapLink',
    'distanceText',
  ]
  let csv = keys.join(',')
  for (const info of infos) {
    csv += '\n'
    for (const key of keys) {
      csv += info[key] + ','
    }
  }
  return csv
}

function downloadText(name, text) {
  const url = URL.createObjectURL(
    new Blob([text], {
      type: 'text/plain',
    })
  )
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
}

;(async function () {
  const f = unsafeWindow.tmFunctions
  const createUrl = (offset) =>
    location.href.replace(/\&offset\=\d+/, '') + `&offset=${offset}`
  const infos = []
  let offset = 100
  while (offset < 1000) {
    const response = await fetch(createUrl(offset))
    const html = new DOMParser().parseFromString(
      await response.text(),
      'text/html'
    )
    infos.push(...parseList(html))
    offset += 25
    if (offset % 100 === 0) {
      downloadText(`${offset}.txt`, toCsv(infos))
    }
    console.log(`${offset}/1000`)
  }
})()
