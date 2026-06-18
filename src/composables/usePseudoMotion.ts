import { ref } from 'vue'

import { LISTEN_KEY } from '@/constants'
import live2d from '@/utils/live2d'

import { useTauriListen } from './useTauriListen'

/**
 * bobo 伪动作系统
 *
 * 罗小黑模型本身没有 motions（0 motions），通过代码驱动 Live2D 参数合成
 * 三个稳定动作 + 一个最简 typing 点头。
 *
 * 设计原则：
 * 1. 复用 Tauri 现有的 device-changed 事件（不要 window.addEventListener fallback）
 * 2. 写 Live2D 参数前检查 live2d.model 是否已加载
 * 3. start() 幂等：调用前先 stop() 防止 HMR 后动作加速
 * 4. 顶层常量集中管理所有时序
 */

// ─── 常量集中管理 ────────────────────────────────────────────────
/** sleep 触发超时：dev 10s 方便验收，prod 60s 正常使用 */
const SLEEP_TIMEOUT_MS = import.meta.env.DEV ? 10_000 : 60_000
/** 眨眼最小间隔 */
const BLINK_MIN_MS = 2_000
/** 眨眼最大间隔 */
const BLINK_MAX_MS = 6_000
/** 单次眨眼总时长（闭眼 + 睁眼） */
const BLINK_DURATION_MS = 200
/** typing 点头持续时间 */
const TYPING_NOD_MS = 150
/** typing 点头幅度（ParamAngleY 范围约 -1~1） */
const TYPING_NOD_VALUE = 0.3
/** idle 检测间隔（秒级即可） */
const IDLE_CHECK_INTERVAL_MS = 1_000

// ─── 辅助：安全写 Live2D 参数 ────────────────────────────────────
function safeSetParam(id: string, value: number): void {
  if (!live2d.model) return
  try {
    live2d.setParameterValue(id, value)
  }
  catch {
    // 参数在当前模型中不存在时静默跳过
  }
}

// ─── 主体 ────────────────────────────────────────────────────────
export function usePseudoMotion() {
  const isSleeping = ref(false)
  const lastInputTime = ref<number>(Date.now())

  // 所有 timer/raf id 都用 let，HMR 时 start() 先 stop() 重置
  let blinkTimer: number | null = null
  let breathRafId: number | null = null
  let idleCheckTimer: number | null = null
  let typingResetTimer: number | null = null

  // ── 动作 1：idle breathing ─────────────────────────────────────
  function startBreath() {
    stopBreath()
    let t = 0
    const tick = () => {
      t += 0.05
      // sin 慢正弦，范围 0~1
      const value = 0.5 + 0.5 * Math.sin(t)
      safeSetParam('ParamBreath', value)
      breathRafId = requestAnimationFrame(tick)
    }
    breathRafId = requestAnimationFrame(tick)
  }

  function stopBreath() {
    if (breathRafId !== null) {
      cancelAnimationFrame(breathRafId)
      breathRafId = null
    }
  }

  // ── 动作 2：blink ─────────────────────────────────────────────
  async function doBlink() {
    if (isSleeping.value) return
    safeSetParam('ParamEyeLOpen', 0)
    safeSetParam('ParamEyeROpen', 0)
    await new Promise<void>(resolve => setTimeout(resolve, BLINK_DURATION_MS - 80))
    safeSetParam('ParamEyeLOpen', 1)
    safeSetParam('ParamEyeROpen', 1)
  }

  function scheduleBlink() {
    if (blinkTimer !== null) clearTimeout(blinkTimer)
    const delay = BLINK_MIN_MS + Math.random() * (BLINK_MAX_MS - BLINK_MIN_MS)
    blinkTimer = window.setTimeout(async () => {
      blinkTimer = null
      await doBlink()
      scheduleBlink()
    }, delay)
  }

  // ── 动作 4：typing nod（最简化）────────────────────────────────
  function doTypingNod() {
    safeSetParam('ParamAngleY', TYPING_NOD_VALUE)
    if (typingResetTimer !== null) clearTimeout(typingResetTimer)
    typingResetTimer = window.setTimeout(() => {
      safeSetParam('ParamAngleY', 0)
      typingResetTimer = null
    }, TYPING_NOD_MS)
  }

  // ── 动作 5：sleep ──────────────────────────────────────────────
  function enterSleep() {
    if (isSleeping.value) return
    isSleeping.value = true
    safeSetParam('ParamEyeLOpen', 0)
    safeSetParam('ParamEyeROpen', 0)
  }

  function wakeUp() {
    if (!isSleeping.value) return
    isSleeping.value = false
    safeSetParam('ParamEyeLOpen', 1)
    safeSetParam('ParamEyeROpen', 1)
  }

  function noteUserInput() {
    lastInputTime.value = Date.now()
    wakeUp()
  }

  // ── 复用现有 Tauri 事件流（不引入新监听）────────────────────
  // device-changed 事件：MousePress / MouseRelease / MouseMove / KeyboardPress / KeyboardRelease
  useTauriListen<{ kind: string, value: unknown }>(LISTEN_KEY.DEVICE_CHANGED, ({ payload }) => {
    const { kind } = payload
    // 任何事件都算用户输入
    noteUserInput()
    // 键盘按下额外触发点头
    if (kind === 'KeyboardPress') {
      doTypingNod()
    }
  })

  function checkIdle() {
    const idleMs = Date.now() - lastInputTime.value
    if (idleMs > SLEEP_TIMEOUT_MS) {
      enterSleep()
    }
  }

  // ── 生命周期（幂等，HMR 安全）─────────────────────────────────
  function start() {
    stop()
    lastInputTime.value = Date.now()
    isSleeping.value = false
    startBreath()
    scheduleBlink()
    idleCheckTimer = window.setInterval(checkIdle, IDLE_CHECK_INTERVAL_MS)
  }

  function stop() {
    if (blinkTimer !== null) {
      clearTimeout(blinkTimer)
      blinkTimer = null
    }
    if (idleCheckTimer !== null) {
      clearInterval(idleCheckTimer)
      idleCheckTimer = null
    }
    if (typingResetTimer !== null) {
      clearTimeout(typingResetTimer)
      typingResetTimer = null
    }
    stopBreath()
  }

  return {
    isSleeping,
    start,
    stop,
  }
}
