import { Universal } from 'koishi'

export interface MessageStats {
  send?: number
  receive?: number
}

export interface BotInfo {
  sid: string
  platform: string
  status: Universal.Status
  name: string
  avatar?: string
  runningTime: number
  messages: MessageStats
}

export interface SystemInfo {
  bots: BotInfo[]
  system: {
    os: string
    nodeVersion: string
    v8Version: string
    uptime: number
    memory: {
      used: number
      total: number
      percentage: number
    }
    cpu: {
      usage: number
    }
  }
}