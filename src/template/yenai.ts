import { Universal } from 'koishi'
import { SystemInfo } from '../types'

interface TemplateOptions {
  path: string
  background: string
  systemInfo: SystemInfo
  maskOpacity: number
  displayName: {
    sid: string
    name: string
  }[]
  darkMode: boolean
}

const statusMap: Record<Universal.Status, string[]> = {
  [Universal.Status.OFFLINE]: ['offline', '离线'],
  [Universal.Status.ONLINE]: ['online', '运行中'],
  [Universal.Status.CONNECT]: ['connect', '正在连接'],
  [Universal.Status.DISCONNECT]: ['disconnect', '正在断开'],
  [Universal.Status.RECONNECT]: ['reconnect', '正在重连']
}

function formatDuring(ms: number) {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.round((ms % (1000 * 60 * 60)) / (1000 * 60))
  return `${days}天${hours}小时${minutes}分`
}

// Forked from https://github.com/yeyang52/yenai-plugin/blob/098e0310392a25b036021f5523108ee2a8d57032/model/State/utils.js#L107
function circle(value: number) {
  const perimeter = 3.14 * 80
  const per = perimeter - perimeter * value
  let color = '--low-color'
  if (value >= 0.9) {
    color = '--high-color'
  } else if (value >= 0.8) {
    color = '--medium-color'
  }
  return {
    per,
    color: `var(${color})`,
    inner: Math.ceil(value * 100) + '%'
  }
}

// Forked from https://github.com/yeyang52/yenai-plugin/blob/098e0310392a25b036021f5523108ee2a8d57032/resources/state/index.html
export function generateYenaiTheme(options: TemplateOptions) {
  const botList = []
  for (const v of options.systemInfo.bots) {
    let botName = v.name || ''
    const customize = options.displayName.find(e => e.sid === v.sid)
    if (customize) {
      botName = customize.name
    }
    const content = `
          <div class="box">
              <div class="botInfo">
                  <div class="avatar-box">
                      <div class="avatar">
                          ${v.avatar ? `<img src="${v.avatar}" />` : ''}
                      </div>
                      <div class="info">
                          <div class="onlineStatus">
                              <span class="status-light ${statusMap[v.status][0]}"></span>
                          </div>
                          <div class="status-text">${statusMap[v.status][1]}</div>
                      </div>
                  </div>
                  <div class="header">
                      <h1>${botName}</h1>
                      <hr noshade />
                      <p>
                          <span class="platform">
                              ${v.platform}
                          </span>
                          <span class="running-time">
                              已运行 ${formatDuring(v.runningTime)}
                          </span>
                      </p>
                      <p>
                          <span class="sent">
                              <img src="${options.path}/icon/sent.png" />
                              昨日发送 ${v.messages.send || 0}
                          </span>
                          <span class="received">
                              <img src="${options.path}/icon/recv.png" />
                              昨日接收 ${v.messages.receive || 0}
                          </span>
                      </p>
                  </div>
              </div>
          </div>
      `
    botList.push(content)
  }
  const cpuCircle = circle(options.systemInfo.system.cpu.usage)
  const memoryCircle = circle(options.systemInfo.system.memory.percentage)
  const maskColor = options.darkMode ? [0, 0, 0] : [220, 224, 232]
  const darkStylesheet = `<link rel="stylesheet" href="${options.path}/css/yenai/dark.css" />`
  return `
        <!DOCTYPE html>
        <html lang="zh">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>status</title>
                <link rel="stylesheet" href="${options.path}/css/yenai/common.css" />
                <link rel="stylesheet" href="${options.path}/css/yenai/index.css" />
                ${options.darkMode ? darkStylesheet : ''}
                <style>
                    .container {
                        background-image: url(${options.background});
                    }
                    .container::before {
                        background-color: rgba(${maskColor[0]}, ${maskColor[1]}, ${maskColor[2]}, ${options.maskOpacity});
                    }
                </style>
            </head>
            <body class="elem-hydro default-mode">
                <div class="container" id="container">
                    ${botList.join('')}
                    <div class="box">
                        <ul class="mainHardware">
                            <li class="li">
                                <div class="container-box" data-num="${cpuCircle.inner}">
                                    <div class="circle-outer"></div>
                                    <svg>
                                        <circle id="circle" stroke="${cpuCircle.color}" style="stroke-dashoffset: ${cpuCircle.per}">
                                        </circle>
                                    </svg>
                                </div>
                                <article>
                                    <summary>CPU</summary>
                                </article>
                            </li>
                            <li class="li">
                                <div class="container-box" data-num="${memoryCircle.inner}">
                                    <div class="circle-outer"></div>
                                    <svg>
                                        <circle id="circle" stroke="${memoryCircle.color}" style="stroke-dashoffset: ${memoryCircle.per}">
                                        </circle>
                                    </svg>
                                </div>
                                <article>
                                    <summary>RAM</summary>
                                </article>
                            </li>
                        </ul>
                    </div>
                    <div class="box">
                        <div class="speed">
                            <p>系统</p>
                            <p>${options.systemInfo.system.os}</p>
                        </div>
                    </div>
                    <div class="copyright">Node <span class="version">v${options.systemInfo.system.nodeVersion}</span> & V8 <span class="version">v${options.systemInfo.system.v8Version}</span></div>
                </div>
            </body>
        </html>
    `
}
