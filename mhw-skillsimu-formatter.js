// ==UserScript==
// @name         mhw スキルシミュレータ フォーマッター
// @namespace    482F
// @version      0.1
// @author       482F
// @match        https://mhw.wiki-db.com/sim/
// @require      file://C:/user-scripts/mhw-skillsimu-formatter.js
// ==/UserScript==

;(function () {
  javascript: (function () {
    let mainDiv = document.querySelectorAll('div#ui>div>div>div')[1]
    let selectTd = ['<tr>', '<tr>']
    let tables = '<table>'
    mainDiv.querySelectorAll('select').forEach(function (select, index) {
      select.setAttribute(
        'style',
        'background: rgb(255, 255, 255); width: 14%; min-width: 160px; font-size: 80%; margin: 20px 10px 20px 0px;'
      )
      selectTd[0] += '<td>' + select.getAttribute('id') + '</td>'
      selectTd[1] += '<td>' + select.outerHTML + '</td>'
      if (index % 6 == 5) {
        selectTd[0] += '</tr>'
        selectTd[1] += '</tr>'
        tables += selectTd[0] + selectTd[1]
        selectTd = ['<tr>', '<tr>']
      }
    })
    tables += '</table>'
    mainDiv.outerHTML = tables
  })()
  // Your code here...
})()
