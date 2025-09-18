import { type SystemInfo } from '../types';


declare global {
  interface TemplateOptions {
    path: string
    background: string
    systemInfo: SystemInfo
    // The currently-triggering session identity for selecting the primary bot
    activeSid?: string
    activePlatform?: string
    displayName: {
      sid: string
      name: string
    }[]
    darkMode?: boolean,
    maskOpacity?: number
  }
}
