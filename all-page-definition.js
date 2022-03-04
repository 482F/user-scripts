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
    while (!(result = await func()) && !timeouted) {
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

  class Dialog {
    constructor(cancel = true) {
      this.ready = false
      this.progresses = {}
      this._duration = 0.4
      this.cancel = cancel
      this._dialog = document.createElement('dialog')
      this.id = 'TamperMonkeyDialog'
      this._dialog.id = this.id
      this._inner = this.createInner()
      this._dialog.appendChild(this._inner)
      const cancelFunc = (e) => {
        e?.preventDefault?.()
        if (this.cancel) {
          this.close()
        }
      }
      this._dialog.addEventListener('cancel', cancelFunc)
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cancelFunc()
      })
      this._append()
      this.close()
    }
    appendChild(element) {
      this._inner.appendChild(element)
    }
    createInner() {
      const inner = document.createElement('div')
      inner.className = 'inner'
      return inner
    }
    appendLoading() {
      const loading = document.createElement('div')
      loading.className = 'loading'
      const loadingInner = document.createElement('div')
      loadingInner.className = 'inner'
      loading.appendChild(loadingInner)
      this._inner.appendChild(loading)
      this._loading = loading
    }
    removeLoading() {
      this._loading.remove()
    }
    appendProgress(id) {
      const progress = document.createElement('div')
      progress.className = 'progress'
      const progressInner = document.createElement('div')
      progressInner.className = 'inner'
      progress.appendChild(progressInner)
      this._inner.appendChild(progress)
      this.progresses[id] = progress
    }
    setProgress(id, value) {
      this.progresses[id].style.setProperty('--value', value)
    }
    removeProgress(id) {
      this.progresses[id].remove()
    }
    async _append() {
      await f.wait(() => document.body)
      const style = document.createElement('style')
      style.textContent = `
      #${this.id} {
        all: revert;
        padding: 1em;
        top: 50%;
        left: 50%;
        margin: 0px;
        font-family: 'Cica', 'ＭＳ ゴシック';
        font-size: 22px;
        transform: translate(-50%, -50%);
        transition-property: clip-path;
        transition-duration: ${this._duration}s;
      }
      #${this.id}.show {
        clip-path: inset(0);
      }
      #${this.id}.hide {
        clip-path: inset(100%);
      }
      #${this.id}::backdrop {
        all: revert;
        transition-property: background-color;
        transition-duration: ${this._duration}s;
      }
      #${this.id}.show::backdrop {
        background-color: rgba(0, 0, 0, 0.2);
      }
      #${this.id}.hide::backdrop {
        background-color: rgba(0, 0, 0, 0);
      }
      #${this.id} > .inner {
        all: revert;
      }
      #${this.id} > .inner > .loading,
      #${this.id} > .inner > .progress {
        all: revert;
        --size: 20px;
        --steps: 10;
        position: relative;
        height: var(--size);
        width: calc(var(--size) * var(--steps));
        border-style: solid;
        border-width: 1px;
        margin: 0px;
      }
      #${this.id} > .inner > .progress {
        --value: 0;
      }
      #${this.id} > .inner > .loading > .inner {
        all: revert;
        position: absolute;
        background-color: black;
        height: 100%;
        width: calc(100% / var(--steps));
        animation-duration: 2s;
        animation-timing-function: steps(var(--steps), jump-none);
        animation-iteration-count: infinite;
        animation-name: loading;
      }
      @keyframes loading {
        0% {
          left: 0px;
        }
        100% {
          left: calc(100% - var(--size) + 1px);
        }
      }
      #${this.id} > .inner > .progress > .inner {
        all: revert;
        background-color: black;
        height: 100%;
        width: calc(100% * min(1, var(--value)));
        transition-property: width;
        transition-duration: 0.1s;
      }
      `
      this._dialog.appendChild(style)
      document.body.appendChild(this._dialog)
      this.ready = true
    }
    async _waitReady() {
      if (!this.ready) {
        await f.wait(() => this.ready)
      }
    }
    async show() {
      await this._waitReady()
      this._dialog.showModal()
      this._dialog.className = 'show'
    }
    async close() {
      await this._waitReady()
      this._dialog.className = 'hide'
      await f.sleep(this._duration * 1000)
      this._dialog.close()
    }
  }

  f.dialog = new Dialog()

  unsafeWindow.tmFunctions = f
})()
