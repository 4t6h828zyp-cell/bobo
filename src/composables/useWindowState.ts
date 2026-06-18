import type { Event } from '@tauri-apps/api/event'
import type { Monitor } from '@tauri-apps/api/window'

import { PhysicalPosition, PhysicalSize } from '@tauri-apps/api/dpi'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { availableMonitors, primaryMonitor } from '@tauri-apps/api/window'
import { useDebounceFn } from '@vueuse/core'
import { isNumber } from 'es-toolkit/compat'
import { onMounted, ref, watch } from 'vue'

import { WINDOW_LABEL } from '@/constants'
import { useAppStore } from '@/stores/app'
import { useCatStore } from '@/stores/cat'
import { getCursorMonitor } from '@/utils/monitor'

export type WindowState = Record<string, Partial<PhysicalPosition & PhysicalSize> | undefined>

// ─── 安全默认 ──────────────────────────────────────────────────
/** 默认窗口尺寸（fallback）。模型加载后会被 resize 到自然尺寸。 */
const DEFAULT_WIDTH = 500
const DEFAULT_HEIGHT = 500
/** 最小有效尺寸（防止保存的 size 异常导致窗口消失） */
const MIN_SIZE = 200
/** 有效判定：至少 60% 窗口面积在某个显示器可见范围内（桌宠靠边 OK） */
const VISIBLE_RATIO_THRESHOLD = 0.6

interface ResolvedState {
  x: number
  y: number
  width: number
  height: number
}

const appWindow = getCurrentWebviewWindow()
const { label } = appWindow

export function useWindowState() {
  const appStore = useAppStore()
  const catStore = useCatStore()
  const isRestored = ref(false)

  onMounted(() => {
    appWindow.onMoved(onChange)

    appWindow.onResized(onChange)

    appWindow.onScaleChanged(clampToMonitor)
  })

  const clampToMonitor = useDebounceFn(async () => {
    if (label !== WINDOW_LABEL.MAIN || !catStore.window.keepInScreen) return

    const monitor = await getCursorMonitor()

    if (!monitor) return

    const { position: monitorPos, size: monitorSize } = monitor
    const windowSize = await appWindow.outerSize()
    const windowPos = await appWindow.outerPosition()

    const minX = monitorPos.x
    const maxX = monitorPos.x + monitorSize.width - windowSize.width
    const minY = monitorPos.y
    const maxY = monitorPos.y + monitorSize.height - windowSize.height

    const clampedX = Math.max(minX, Math.min(windowPos.x, maxX))
    const clampedY = Math.max(minY, Math.min(windowPos.y, maxY))

    if (clampedX === windowPos.x && clampedY === windowPos.y) return

    return appWindow.setPosition(new PhysicalPosition(clampedX, clampedY))
  }, 500)

  watch(() => catStore.window.keepInScreen, clampToMonitor)

  const onChange = async (event: Event<PhysicalPosition | PhysicalSize>) => {
    const minimized = await appWindow.isMinimized()

    if (minimized) return

    appStore.windowState[label] ??= {}

    Object.assign(appStore.windowState[label], event.payload)

    clampToMonitor()
  }

  /**
   * 判定一个保存的窗口状态是否仍然有效。
   * 规则（满足任一即可）：
   *   1. 窗口中心点在某个显示器内，且至少 60% 面积在那个显示器可见
   *   2. 尺寸不合理（小于 MIN_SIZE 或超过主屏）→ 视为无效
   */
  function isValidWindowState(
    state: Partial<PhysicalPosition & PhysicalSize>,
    monitors: Monitor[],
    primaryMax: { width: number, height: number },
  ): boolean {
    if (!isNumber(state.x) || !isNumber(state.y) || !isNumber(state.width) || !isNumber(state.height)) {
      return false
    }
    // 尺寸合理性
    if (state.width < MIN_SIZE || state.height < MIN_SIZE) return false
    if (state.width > primaryMax.width * 1.5 || state.height > primaryMax.height * 1.5) return false

    // 中心点在某个显示器内
    const centerX = state.x + state.width / 2
    const centerY = state.y + state.height / 2

    for (const monitor of monitors) {
      const { position, size } = monitor
      const inMonitorX = centerX >= position.x && centerX <= position.x + size.width
      const inMonitorY = centerY >= position.y && centerY <= position.y + size.height
      if (!inMonitorX || !inMonitorY) continue

      // 计算可见面积
      const visX1 = Math.max(state.x, position.x)
      const visY1 = Math.max(state.y, position.y)
      const visX2 = Math.min(state.x + state.width, position.x + size.width)
      const visY2 = Math.min(state.y + state.height, position.y + size.height)
      const visibleArea = Math.max(0, visX2 - visX1) * Math.max(0, visY2 - visY1)
      const totalArea = state.width * state.height
      if (totalArea <= 0) return false
      if (visibleArea / totalArea >= VISIBLE_RATIO_THRESHOLD) return true
    }

    return false
  }

  /**
   * 计算安全默认位置：主屏幕中心。
   * x = primary.x + (primary.width - defaultWidth) / 2
   * y = primary.y + (primary.height - defaultHeight) / 2
   */
  async function getDefaultWindowState(): Promise<ResolvedState> {
    const primary = await primaryMonitor()
    const size = primary?.size ?? { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
    const position = primary?.position ?? { x: 0, y: 0 }
    return {
      x: position.x + Math.floor((size.width - DEFAULT_WIDTH) / 2),
      y: position.y + Math.floor((size.height - DEFAULT_HEIGHT) / 2),
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
    }
  }

  const restoreState = async () => {
    const saved = appStore.windowState[label]
    const monitors = await availableMonitors()
    const primary = await primaryMonitor()
    const primaryMax = primary?.size ?? { width: 9999, height: 9999 }

    let resolved: ResolvedState

    if (saved && isValidWindowState(saved, monitors, primaryMax)) {
      resolved = {
        x: saved.x!,
        y: saved.y!,
        width: saved.width!,
        height: saved.height!,
      }
    } else {
      resolved = await getDefaultWindowState()
    }

    await appWindow.setPosition(new PhysicalPosition(resolved.x, resolved.y))
    await appWindow.setSize(new PhysicalSize(resolved.width, resolved.height))

    isRestored.value = true

    clampToMonitor()
  }

  return {
    isRestored,
    restoreState,
  }
}
