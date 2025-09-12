import { Universal } from "koishi";
import { SystemInfo } from "./types";

interface TemplateOptions {
  path: string;
  background: string;
  systemInfo: SystemInfo;
  // The currently-triggering session identity for selecting the primary bot
  activeSid?: string;
  activePlatform?: string;
}

function formatDuration(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `已运行 ${days}天${hours}小时${minutes}分钟`;
}

function getStatusInfo(status: Universal.Status): {
  text: string;
  color: string;
} {
  const statusMap: Record<Universal.Status, { text: string; color: string }> = {
    [Universal.Status.OFFLINE]: { text: "离线", color: "bg-[#8c8fa1]" },
    [Universal.Status.ONLINE]: { text: "运行中", color: "bg-[#40a02b]" },
    [Universal.Status.CONNECT]: { text: "连接中", color: "bg-[#df8e1d]" },
    [Universal.Status.DISCONNECT]: { text: "断开", color: "bg-[#d20f39]" },
    [Universal.Status.RECONNECT]: { text: "重连中", color: "bg-[#1e66f5]" },
  };
  return statusMap[status] || { text: "未知", color: "bg-gray-500" };
}

function getPlatformLabel(platform: string): string {
  const plain = platform.replace(/^sandbox:/, "");
  const map: Record<string, string> = {
    onebot: "Onebot",
    qq: "QQ",
    discord: "Discord",
    telegram: "Telegram",
    kook: "KOOK",
    "wechat-official": "微信公众号",
    lark: "飞书",
    dingtalk: "钉钉",
    line: "LINE",
    slack: "Slack",
    whatsapp: "WhatsAPP",
    milky: "Milky",
  };
  return map[plain] || plain;
}

function createCircularProgress(
  percentage: number,
  gradientId: string,
  from: string,
  to: string
): string {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return `
    <svg class="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
      </defs>
      <circle
        cx="40"
        cy="40"
        r="30"
        fill="transparent"
        stroke="rgba(255,255,255,0.18)"
        stroke-width="6"
      />
      <circle
        cx="40"
        cy="40"
        r="30"
        fill="transparent"
        stroke="url(#${gradientId})"
        stroke-width="6"
        stroke-linecap="round"
        stroke-dasharray="${strokeDasharray}"
        stroke-dashoffset="${strokeDashoffset}"
        class="transition-all duration-300"
        filter="drop-shadow(0 0 8px ${to}40)"
      />
    </svg>
  `;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let val = bytes
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024
    i++
  }
  const fixed = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)
  return `${fixed} ${units[i]}`
}

export function generate(options: TemplateOptions): string {
  const { path, background, systemInfo, activeSid, activePlatform } = options;
  const { bots, system } = systemInfo;

  // Select primary bot by sid > platform > fallback to first
  const primaryBot =
    (activeSid && bots.find((b) => b.sid === activeSid)) ||
    (activePlatform && bots.find((b) => b.platform === activePlatform)) ||
    bots[0];
  if (!primaryBot) {
    throw new Error("No bots available");
  }

  const statusInfo = getStatusInfo(primaryBot.status);
  const platformLabel = getPlatformLabel(primaryBot.platform);
  const cpuPercentage = Math.round(system.cpu.usage * 100);
  const memoryPercentage = Math.round(system.memory.percentage * 100);
  const memoryUsedText = `${formatBytes(system.memory.used)} / ${formatBytes(system.memory.total)}`;
  const swapUsed = system.swap?.used ?? 0;
  const swapTotal = system.swap?.total ?? 0;
  const swapPercentage = Math.round((system.swap?.percentage ?? 0) * 100);
  const swapUsedText = `${formatBytes(swapUsed)} / ${formatBytes(swapTotal)}`;

  // Ensure the current (primary) bot is listed first in the tabs
  const orderedBots = primaryBot
    ? [primaryBot, ...bots.filter((b) => b.sid !== primaryBot.sid)]
    : bots;

  const botTabsHtml = orderedBots
    .map((bot) => {
      const s = getStatusInfo(bot.status);
      const active = bot.sid === primaryBot.sid;
      const ring = active
        ? "ring-2 ring-[#1e66f5] ring-offset-2 ring-offset-white/20"
        : "ring-1 ring-white/20";
      const title = `${bot.name || ""} (${getPlatformLabel(bot.platform)})`;
      return `
          <div class="relative shrink-0" title="${title}">
            <img src="${bot.avatar || ""}" alt="${
        bot.name || "Bot"
      }" class="w-12 h-12 rounded-full object-cover avatar-border ${ring}">
            <div class="absolute -bottom-1 -right-1 w-5 h-5 ${
              s.color
            } rounded-full border-[2px] border-white"></div>
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=430, initial-scale=1.0">
      <title>Status Card</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @font-face {
          font-family: 'NotoSansSC';
          src: url('${path}/fonts/NotoSansSC-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        
        body {
          font-family: 'NotoSansSC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;
          margin: 0;
          padding: 0;
        }
        
        .glassmorphism {
          background: rgba(81, 80, 80, 0.4);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 10px 36px 0 rgba(0, 0, 0, 0.16);
        }
        
        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .avatar-border {
          border: 3px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
        }

        .text-high-contrast {
          color: #f2f3f8ff;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
        }
        
        .text-high-contrast {
          color: #f2f3f8ff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }
        
        .text-low-contrast {
          color: #f2f3f8ff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
        }

        .bg-container {
          background-image: url('${background}');
          background-size: cover;
          background-position: top center;
          background-repeat: no-repeat;
          width: 100%;
          height: auto;
          min-height: 780px;
          position: relative;
        }

        .bg-overlay {
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.2));
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(4px);
        }

        /* hide horizontal scrollbar for avatar tabs */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      </style>
    </head>
    <body style="width: 560px; height: auto; margin: 0; padding: 0; min-height: 780px">
      <div class="bg-container">
        <div class="bg-overlay w-full h-full">
          <!-- Main Container -->
          <div class="flex items-center justify-center py-8 px-6" style="min-height: 780px;">
            <div class="w-[92%] max-w-2xl space-y-5">
              
              <!-- Bot Tabs -->
              <div class="glassmorphism rounded-2xl px-4 py-3 inline-flex items-center gap-4 max-w-full overflow-x-auto no-scrollbar">
                ${botTabsHtml}
              </div>
              
              <!-- Bot Info Card -->
              <div class="glassmorphism rounded-2xl p-6">
                <div class="flex items-center space-x-5 mb-4">
                  <!-- Avatar -->
                  <div class="relative">
                    <img src="${primaryBot.avatar || ""}" 
                         alt="Avatar" 
                         class="w-20 h-20 rounded-full avatar-border object-cover">
                    <!-- Status Indicator -->
                    <div class="absolute -bottom-1 -right-1 w-6 h-6 ${
                      statusInfo.color
                    } rounded-full border-[3px] border-white flex items-center justify-center">
                      <div class="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  
                  <!-- Bot Details -->
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h2 class="text-2xl font-semibold text-high-contrast leading-tight">${primaryBot.name}</h2>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-xl text-sm font-medium bg-[#7f849c] text-[#f2f3f8ff] leading-none translate-y-[3px]">${platformLabel}</span>
                    </div>
                    <div class="text-base text-high-contrast mt-1">Running on ${system.os}</div>
                  </div>
                </div>
                
                <!-- Runtime -->
                <div class="text-base text-high-contrast mb-4">
                  ${formatDuration(primaryBot.runningTime)}
                </div>
                
                <!-- Message Stats -->
                <div class="flex justify-between text-base">
                  <div class="flex items-center space-x-2">
                    <img src="${path}/icon/sent.png" alt="Sent" class="w-5 h-5 opacity-90">
                    <span class="text-high-contrast">昨日发送</span>
                    <span class="text-high-contrast font-semibold">${
                      primaryBot.messages.send || 0
                    }</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <img src="${path}/icon/recv.png" alt="Received" class="w-5 h-5 opacity-90">
                    <span class="text-high-contrast">昨日接收</span>
                    <span class="text-high-contrast font-semibold">${
                      primaryBot.messages.receive || 0
                    }</span>
                  </div>
                </div>
              </div>
              
              <!-- System Stats Card -->
              <div class="glassmorphism rounded-2xl p-6">
                <div class="flex justify-center gap-10">
                  <!-- CPU Usage -->
                  <div class="flex flex-col items-center">
                    <div class="relative w-[120px] h-[120px]">
                      ${createCircularProgress(
                        cpuPercentage,
                        "cpuGrad",
                        "#179299",
                        "#209fb5"
                      )}
                      <div class="progress-text">
                        <div class="text-2xl font-semibold text-high-contrast">${cpuPercentage}%</div>
                      </div>
                    </div>
                    <div class="text-base text-high-contrast mt-3 font-medium">CPU</div>
                  </div>
                  
                   <!-- RAM Usage -->
                  <div class="flex flex-col items-center">
                    <div class="relative w-[120px] h-[120px]">
                      ${createCircularProgress(
                        memoryPercentage,
                        "ramGrad",
                        "#0478e5ff",
                        "#1e66f5"
                      )}
                      <div class="progress-text">
                        <div class="text-2xl font-semibold text-high-contrast">${memoryPercentage}%</div>
                      </div>
                    </div>
                    <div class="text-base text-high-contrast mt-3 font-medium">RAM</div>
                    <div class="text-xs text-high-contrast mt-1">${memoryUsedText}</div>
                  </div>

                  <!-- SWAP Usage -->
                  <div class="flex flex-col items-center">
                    <div class="relative w-[120px] h-[120px]">
                      ${createCircularProgress(
                        swapPercentage,
                        "swapGrad",
                        "#8839ef",
                        "#ea76cb"
                      )}
                      <div class="progress-text">
                        <div class="text-2xl font-semibold text-high-contrast">${swapPercentage}%</div>
                      </div>
                    </div>
                    <div class="text-base text-high-contrast mt-3 font-medium">SWAP</div>
                    <div class="text-xs text-high-contrast mt-1">${swapUsedText}</div>
                  </div>
                </div>
              </div>
              
              <!-- Footer -->
              <div class="text-center text-sm text-low-contrast pb-2">
                Node <span class="text-high-contrast font-medium">v${
                  system.nodeVersion
                }</span> & V8 <span class="text-high-contrast font-medium">v${
    system.v8Version
  }</span>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
