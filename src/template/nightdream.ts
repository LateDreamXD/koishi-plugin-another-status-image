/**
 * NightDream theme by @LateDreamXD
 */
import fs from 'node:fs';
import disk from 'diskusage';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { version, Universal } from 'koishi';

const platforms = {
  onebot: 'QQ (OneBot)',
  qq: 'QQ (Official)',
  discord: 'Discord',
  telegram: 'Telegram',
  kook: 'KOOK',
  'wechat-official': '微信公众号',
  lark: '飞书',
  dingtalk: '钉钉',
  line: 'LINE',
  slack: 'Slack',
  whatsapp: 'WhatsAPP',
  milky: 'Milky',
}

const resPath = path.join(__dirname, '../resource');
const resPathUrl = pathToFileURL(resPath).href;

const osIcons = [
  {os: 'windows', icon: path.join(resPathUrl, 'icon/windows.svg')},
  {os: 'android', icon: path.join(resPathUrl, 'icon/android.svg')},
  {os: 'linux', icon: path.join(resPathUrl, 'icon/linux.svg')},
  {os: 'darwin', icon: path.join(resPathUrl, 'icon/apple.svg')},
  {os: 'macos', icon: path.join(resPathUrl, 'icon/apple.svg')},
  {os: 'ios', icon: path.join(resPathUrl, 'icon/apple.svg')}
];

function formatDuration(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  return `${days} 天 ${hours} 小时 ${minutes} 分钟`
}

function getStatusInfo(status: Universal.Status): {
  text: string
  color: string
} {
  const statusMap: Record<Universal.Status, { text: string, color: string }> = {
    [Universal.Status.OFFLINE]: { text: '离线', color: '#8c8fa1' },
    [Universal.Status.ONLINE]: { text: '运行中', color: '#40a02b' },
    [Universal.Status.CONNECT]: { text: '连接中', color: '#df8e1d' },
    [Universal.Status.DISCONNECT]: { text: '断开', color: '#d20f39' },
    [Universal.Status.RECONNECT]: { text: '重连中', color: '#1e66f5' },
  }
  return statusMap[status] || { text: '未知', color: '#bbb' }
}

export function genHtml(options: TemplateOptions) {
  const { activeSid, activePlatform, systemInfo } = options;
  const { bots, system } = systemInfo;
  const currentBot =
    (activeSid && bots.find((b) => b.sid === activeSid)) ||
    (activePlatform && bots.find((b) => b.platform === activePlatform)) ||
    bots[0];
  if(!currentBot) throw new Error('No bot available');
  ;

  const mainDisk = system.os.toLowerCase().includes('windows')? 'c:': '/';
  const diskInfo = disk.checkSync(mainDisk)
  const diskUsage = (100 - diskInfo.free / diskInfo.total * 100).toFixed(1);

  let name = currentBot.name;
  options.displayName.find(d => d.sid === currentBot.sid? name = d.name: void 0)

  let template = fs.readFileSync(path.join(resPath, 'template', 'nightdream.html'), 'utf-8');
  template = template.replace('%avatar%', currentBot.avatar).replace('%name%', `${name} | ${platforms[currentBot.platform]}`)
    .replace('%bg%', options.background).replace('%uptime%', formatDuration(currentBot.runningTime))
    .replaceAll('%cpu_usage%', `${(system.cpu.usage * 100).toFixed(1)}%`)
    .replaceAll('%memory_usage%', `${(system.memory.percentage * 100).toFixed(1)}%`)
    .replaceAll('%disk_usage%', `${diskUsage}%`)
    .replace('%os%', system.os).replace('%koishi_version%', version)
    .replace('%node_version%', process.versions.node)
    .replace('%mask_opacity%', options.maskOpacity.toString())
    .replace('%status_color%', getStatusInfo(currentBot.status).color);

  for(const icon of osIcons) {
    if(system.os.toLowerCase().includes(icon.os))
      template = template.replace('%os_icon%', icon.icon);
  }

  return template;
}
