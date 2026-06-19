import { defineStore } from 'pinia'
import { nextTick, reactive, ref, watch } from 'vue'

import { useModelStore } from './model'

/**
 * 背景模式：
 * - transparent: 完全透明，不显示任何背景图（默认）
 * - scene: 按猫的动作自动切换背景（预留，未来阶段实现）
 */
export type BackgroundMode = 'transparent' | 'scene'

export interface CatStore {
  model: {
    mirror: boolean
    mouseMirror: boolean
    motionSound: boolean
    behavior: boolean
    autoReleaseDelay: number
    maxFPS: number
    ignoreMouse: boolean
  }
  window: {
    visible: boolean
    passThrough: boolean
    alwaysOnTop: boolean
    scale: number
    opacity: number
    radius: number
    hideOnHover: boolean
    hideOnHoverDelay: number
    keepInScreen: boolean
  }
  /**
   * 背景配置
   * - mode: 'transparent' 默认透明；'scene' 为按动作切换背景（预留接口）
   * - scenesDirectory: 场景背景图所在子目录（约定: resources/<scenesDirectory>/<group>_<name>.png）
   */
  background: {
    mode: BackgroundMode
    scenesDirectory: string
  }
}

export const useCatStore = defineStore('cat', () => {
  /* ------------ 废弃字段（后续删除） ------------ */

  /** @deprecated 请使用 `model.mirror` */
  const mirrorMode = ref(false)

  /** @deprecated 请使用 `model.mouseMirror` */
  const mouseMirror = ref(false)

  /** @deprecated 请使用 `window.passThrough` */
  const penetrable = ref(false)

  /** @deprecated 请使用 `window.alwaysOnTop` */
  const alwaysOnTop = ref(true)

  /** @deprecated 请使用 `window.scale` */
  const scale = ref(100)

  /** @deprecated 请使用 `window.opacity` */
  const opacity = ref(100)

  /** @deprecated 用于标识数据是否已迁移，后续版本将删除 */
  const migrated = ref(false)

  const model = reactive<CatStore['model']>({
    mirror: false,
    mouseMirror: false,
    motionSound: true,
    behavior: true,
    autoReleaseDelay: 3,
    maxFPS: 60,
    ignoreMouse: false,
  })

  const window = reactive<CatStore['window']>({
    visible: true,
    passThrough: false,
    alwaysOnTop: false,
    scale: 100,
    opacity: 100,
    radius: 0,
    hideOnHover: false,
    hideOnHoverDelay: 0,
    keepInScreen: true,
  })

  const background = reactive<CatStore['background']>({
    mode: 'transparent',
    scenesDirectory: 'scenes',
  })

  // 规范化 scale：超出合理范围 [80, 150] 或非数字时重置为 100。
  // shift+right+drag 可以把 scale 改成 10-500 之间的任意值，
  // 持久化里如果残留 50、39 之类的异常值，启动后自动恢复。
  function normalizeScale() {
    if (typeof window.scale !== 'number' || !Number.isFinite(window.scale) || window.scale < 80 || window.scale > 150) {
      window.scale = 100
    }
  }

  // 在 scale 变化时持续检查（拦截 handleResize 的反向计算覆盖）。
  // useModel.handleResize 会在窗口 resize 时根据当前窗口尺寸反向计算 scale
  // （如 250/640*100=39），这个值可能在 [80,150] 之外。这个 watch 立即纠正
  // 任何异常值。nextTick 防止 watch 自身引起的连锁写入。
  // 用户手动 shift+right+drag 到 < 80 或 > 150 也会被纠正，这是有意的
  // （这些值都被视为异常，不在合理范围）。
  watch(
    () => window.scale,
    (newScale) => {
      if (typeof newScale !== 'number' || !Number.isFinite(newScale) || newScale < 80 || newScale > 150) {
        nextTick(() => {
          window.scale = 100
        })
      }
    },
  )

  const init = () => {
    // 每次启动都规范化一次（处理持久化里的脏值）
    normalizeScale()

    if (migrated.value) return

    model.mirror = mirrorMode.value
    model.mouseMirror = mouseMirror.value

    window.visible = true
    window.passThrough = penetrable.value
    window.alwaysOnTop = alwaysOnTop.value
    window.scale = scale.value
    window.opacity = opacity.value

    migrated.value = true
  }

  return {
    migrated,
    model,
    window,
    background,
    init,
  }
})
