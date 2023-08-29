// ==UserScript==
// @name         clip spotify
// @version      0.1
// @author       You
// @match        https://open.spotify.com/*
// @require      file://C:/user-scripts/get-spotify-details.js
// ==/UserScript==

// Ctrl + 右クリックで動作

;(async function () {
  /**
   * @template T
   * @typedef { [T, undefined] | [undefined, Error] } Result<T>
   */

  /**
    * @typedef { {
        string: string,
        number: number,
      } } Types
    */

  /**
    * @satisfies {
        readonly {
          label: string,
          id: string,
          type?: keyof Types,
          converter?: (arg: never) => string,
        }[]
      }
    */
  const columns = /** @type { const } */ ([
    { label: 'タイトル', id: 'title' },
    { label: 'アーティスト', id: 'artist' },
    { label: 'アルバム', id: 'album' },
    { label: '時間', id: 'time' },
    // {
    //   label: '時間',
    //   id: 'second',
    //   type: 'number',
    //   /** @type { (num: number) => string } */
    //   converter: (num) => String(num),
    // },
  ])

  /**
   * @typedef {
       {
         [id in typeof columns[number]['id']]:
           { [iid in keyof typeof columns as iid extends `${number}`
               ? typeof columns[iid]['id'] extends id ? iid : never
               : never
             ]: typeof columns[iid] extends infer C extends { 'type': any }
               ? C['type'] extends keyof Types
                 ? Types[C['type']]
                 : never
               : string
           } extends infer U
             ? U[keyof U]
             : never
       }
     } Music
   */

  const sleep =
    /**
     *  @param { number } ms
     */
    async (ms) => await new Promise((resolve) => setTimeout(resolve, ms))
  const wait =
    /**
     * @template R
     * @param { (...args: any[]) => R } func
     * @returns { Promise<Result<NonNullable<R>>> }
     */
    async (func, interval = 100, timeout = 5000) => {
      let result = null
      let timeouted = false
      setTimeout(() => (timeouted = true), timeout)
      while (!(result = await func()) && !timeout) {
        await sleep(interval)
      }

      if (result) {
        return [result, undefined]
      } else {
        return [undefined, new Error('wait に失敗しました')]
      }
    }
  const clip =
    /**
     * @param { Record<string, string> } data
     */
    async (data) => {
      const blobs = Object.fromEntries(
        Object.entries(data).map(([type, body]) => [
          type,
          new Blob([body], { type }),
        ])
      )
      const clipboardItem = new ClipboardItem(blobs)
      await navigator.clipboard.write([clipboardItem])
    }
  const clipText =
    /**
     * @param { string } text
     */
    async (text) => clip({ 'text/plain': text })

  /**
   * @param { Element | Document } el
   * @param { string } query
   * @param { number } intervalMs
   */
  async function* querySelectorAllGenerator(el, query, intervalMs = 100) {
    let lastMatched = undefined
    while (true) {
      const matcheds = [...el.querySelectorAll(query)]
      const lastMatchedIndex = lastMatched
        ? matcheds.lastIndexOf(lastMatched)
        : -1
      const slicedMatcheds = matcheds.slice(
        lastMatchedIndex === -1 ? 0 : lastMatchedIndex
      )
      console.log({ lastMatched, matcheds, slicedMatcheds })
      if (matcheds && slicedMatcheds.length <= 1) {
        return
      }
      for (const matched of slicedMatcheds) {
        await sleep(intervalMs)
        matched.scrollIntoView()
        yield matched
        lastMatched = matched
      }
    }
  }

  /**
   * @param { string } text
   */
  function downloadUtf8Text(text) {
    const bom = new Uint8Array([0xef, 0xbb, 0xbf])
    const blob = new Blob([bom, text], { type: 'text/csv' })
    const url = (window.URL || window.webkitURL).createObjectURL(blob)
    const a = document.createElement('a')
    a.download = `spotify-infos.csv`
    a.href = url
    a.click()
  }

  /**
   * @overload
   * @param { Element } el
   * @param { true } needAlbum
   * @returns { Music }
   */
  /**
   * @overload
   * @param { Element } el
   * @param { false } needAlbum
   * @returns { Omit<Music, 'album'> }
   */
  /**
   * @param { Element } el
   * @param { boolean } needAlbum
   * @returns { Music | Omit<Music, 'album'> }
   */
  function getMusicInfo(el, needAlbum) {
    // const { minStr, secStr } =
    //   [...el.querySelectorAll('div')]
    //     .map((el) => el.textContent?.match(/^(?<minStr>\d*):(?<secStr>\d+)$/))
    //     .find(Boolean)?.groups ?? {}
    // if (minStr === undefined || secStr === undefined) {
    //   throw new Error('時間の取得に失敗しました')
    // }
    const time = [...el.querySelectorAll('div')]
      .map((el) => el.textContent?.match(/^(?<minStr>\d*):(?<secStr>\d+)$/))
      .find(Boolean)?.[0]
    if (!time) {
      throw new Error('時間の取得に失敗しました')
    }

    const titleEl = el.querySelector('a[data-testid="internal-track-link"]')
    if (!titleEl) {
      throw new Error('タイトルの取得に失敗しました')
    }

    const artistEl = titleEl.nextElementSibling
    if (!artistEl) {
      throw new Error('アーティストの取得に失敗しました')
    }

    const partMusic = {
      artist: artistEl.textContent ?? '',
      // second: Number(minStr) * 60 + Number(secStr),
      time,
      title: titleEl.textContent ?? '',
    }

    const albumEl = titleEl.parentElement?.parentElement?.nextElementSibling
    if (needAlbum) {
      if (!albumEl) {
        throw new Error('アルバムの取得に失敗しました')
      }
      return {
        ...partMusic,
        album: albumEl?.textContent ?? '',
      }
    } else {
      return partMusic
    }
  }

  /**
   * @param { Element } el
   * @returns { Promise<Music[]> }
   */
  async function artist(el) {
    // 一旦スクロールして全要素を出す
    // NOTE: 何故か img だけは最初から全部あるため、現状の querySelectorAllGenerator 単発ではうまく動かない。修正したい
    for await (const _ of querySelectorAllGenerator(el, 'img')) {
    }

    /** @type { Music[] } */
    const musics = []
    /** @type { string? } */
    let currentAlbum = null
    for await (const child of querySelectorAllGenerator(
      el,
      'img,div[data-testid="tracklist-row"]'
    )) {
      if (child instanceof HTMLImageElement) {
        currentAlbum = child.alt
      } else if (child instanceof HTMLDivElement) {
        if (!currentAlbum) {
          throw new Error('アルバム名の取得に失敗しました')
        }

        musics.push({ ...getMusicInfo(child, false), album: currentAlbum })
      } else {
        throw new Error(
          'artist 関数でのクエリに誤りがあります。受け取った要素: ' +
            child.nodeName
        )
      }
    }
    return musics
  }

  /**
   * @returns { Promise<Music[]> }
   */
  async function playlist() {
    /** @type { Music[] } */
    const musics = []
    for await (const child of querySelectorAllGenerator(
      document,
      'div[data-testid="tracklist-row"]'
    )) {
      musics.push(getMusicInfo(child, true))
    }
    return musics
  }

  async function main() {
    const [type, el] = await Promise.any([
      wait(() =>
        document.querySelector('div[data-testid="infinite-scroll-list"]')
      ).then((r) => {
        if (r[1]) {
          throw r[1]
        }
        return /** @type { const } */ (['artist', r[0]])
      }),
      wait(() =>
        document.querySelector('div[data-testid="playlist-image"]')
      ).then((r) => {
        if (r[1]) {
          throw r[1]
        }
        return /** @type { const } */ (['playlist', r[0]])
      }),
    ]).catch(() => [])

    el.scrollIntoView()

    /** @type { Music[] } */
    const musics = await (() => {
      if (!type) {
        throw new Error('データ取得対象のコンテンツが見つかりませんでした')
      } else if (type === 'artist') {
        return artist(el)
      } else if (type === 'playlist') {
        return playlist()
      } else {
        /**
         * @param { never } neverType
         */
        const t = (neverType) => neverType
        throw new Error('予期しない処理タイプが渡されました: ' + t(type))
      }
    })()

    downloadUtf8Text(
      [
        columns.map((column) => column.label).join(','),
        ...musics.map((music) =>
          columns
            .map((column) => {
              return music[column.id]
            })
            .map((column) =>
              column
                .replaceAll(',', '，')
                .replaceAll('\n', '')
                .replaceAll(/^\s+|\s+$/g, '')
            )
            .join(',')
        ),
      ].join('\n')
    )
  }

  document.body.addEventListener(
    'contextmenu',
    (e) => {
      console.log(e)
      if (!e.ctrlKey) {
        return
      }
      main()
    },
    true
  )
})()
