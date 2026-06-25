/**
 * 日志
 * 劫持原生的 console 对象, 将日志追加到 dom 元素中, 主要用于移动端调试
 * @example
 * ```js
 * c = Console() // 创建
 * c = Console({ position: ['bottom', 'right'], height: 220 }) // 创建后可以更新位置大小
 * c.dispose() // 销毁
 * ```
 */
const Console = ({ container = document.body, className = 'console', truncLength = 3000, position = ['top', 'right'], height = 500 } = {}) => {
  if (typeof height === 'number') height += 'px'
  let { $console } = Console
  if ($console) {
    $console.className = `${className} ${position.join(' ')}`
    $console.style.setProperty('--console-height', height)
    return $console
  }
  $console = Console.$console = document.createElement('div')
  $console.className = `${className} ${position.join(' ')}`
  $console.style.setProperty('--console-height', height)
  $console.innerHTML = `<button class="${className}-toggle">console</button>
  <div class="${className}-content"></div>
  <div class="${className}-input">
    <textarea rows="1" placeholder="输入 js.."></textarea>
    <button class="${className}-input-clear">清空</button>
    <button class="${className}-input-send">发送</button>
  </div>`
  container.appendChild($console)

  const css = `& {
    --console-height: 220px;
    position: fixed;
    z-index: 99999;
    height: var(--console-height);
    left: 0;
    right: 0;
    background-color: #fff;
    border-top: 1px solid #666;
    border-bottom: 1px solid #666;
  }
  &, & * {
    box-sizing: border-box;
  }
  &-content {
    height: calc(100% - 25px);
    overflow: auto;
    padding: 10px;
    white-space: pre-wrap;
    line-break: anywhere;
    font-family: Consolas, monospace;
    font-size: 14px;
  }
  &-content > div {
    padding: 4px 0;
  }
  &-content > div + div {
    border-top: 1px solid #ccc;
  }
  &-toggle {
    position: absolute;
    height: 30px;
    background: #fff;
    color: #333;
    border: 1px solid #666;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
  }
  &-input {
    position: relative;
    display: flex;
    border-top: 1px solid #ccc;
  }
  &-input textarea {
    flex: auto;
    border: none;
    height: 24px;
    min-height: 24px;
    background: #fff;
    color: #333;
    scrollbar-width: none;
  }
  &-input button {
    border: none;
    border-left: 1px solid #ccc;
    background: transparent;
    color: #444;
    height: 100%;
  }
  &.top { top: calc(0px - var(--console-height)); }
  &.bottom { bottom: calc(0px - var(--console-height)); }
  &.top.is-show { top: 0; }
  &.bottom.is-show { bottom: 0; }
  &.top &-toggle { bottom: -30px; }
  &.bottom &-toggle { top: -30px; }
  &.left &-toggle { left: 0; }
  &.right &-toggle { right: 0; }
  &-log { color: #000; }
  &-error { color: #f00; }
  &-warn { color: #f80; }
  &-debug { color: #aaa; }`
  $style = document.createElement('style')
  $style.innerHTML = css.replace(/\n\s+/g, '\n').replace(/&/g, `.${className}`)
  document.head.appendChild($style)

  let show = false
  const $toggle = $console.querySelector(`.${className}-toggle`)
  const $content = $console.querySelector(`.${className}-content`)
  const $input = $console.querySelector(`.${className}-input textarea`)
  const $clear = $console.querySelector(`.${className}-input-clear`)
  const $send = $console.querySelector(`.${className}-input-send`)
  $toggle.onclick = () => {
    show = !show
    $console.classList.toggle('is-show')
  }
  $input.onkeydown = (e) => {
    if (e.code === 'Enter' && e.ctrlKey) {
      $send.onclick()
    }
  }
  $send.onclick = (e) => {
    const cmd = $input.value.trim()
    if (!cmd) return
    console.log('›', cmd)
    try {
      const res = new Function(`return (${cmd})`)()
      console.log('‹', res)
    } catch (e) {
      console.error(e)
    }
    setTimeout(() => {
      $input.value = ''
      scrollToBottom()
    })
  }
  $clear.onclick = () => {
    $content.innerHTML = ''
  }
  const scrollToBottom = () => {
    $content.scrollTop = $content.scrollHeight + 100
  }
  const toJson = (obj) => {
    const cache = new Set()
    return JSON.stringify(obj, (k, v) => {
      if (typeof v === 'function') return '𝑓' // 函数
      if (v instanceof Object) {
        if (cache.has(v)) return '𝑟𝑒𝑓' // 循环引用
        cache.add(v)
      }
      return v
    })
  }
  const trunc = (arg) => {
    let res = arg instanceof Object ? toJson(arg) : String(arg)
    if (res.length > truncLength) res = res.slice(0, truncLength) + '...'
    return res
  }
  const override = (key) => (...args) => {
    oldConsole[key](...args)
    if (key === 'error') args = args.map(arg => {
      if (!(arg instanceof Error)) arg = new Error(trunc(arg))
      return arg.message + '\n' + arg.stack.replace(/^/gm, '  ')
    })
    const row = document.createElement('div')
    row.className = `${className}-${key}`
    row.innerText = args.map(trunc).join(' ')
    $content.appendChild(row)
  }
  const oldConsole = window.console
  window.console = {
    ...oldConsole,
    ...Object.fromEntries(['log', 'error', 'warn'].map(key => [key, override(key)])),
  }
  const oldError = window.onerror
  window.onerror = (err) => {
    window.console.error(err)
    return true
  }
  const oldRejection = window.onunhandledrejection
  window.onunhandledrejection = (err) => {
    window.console.error('Uncaught (in promise)', err.reason)
    return true
  }
  $console.dispose = () => {
    $console.remove()
    $style.remove()
    window.console = oldConsole
    window.onerror = oldError
    window.onunhandledrejection = oldRejection
    Console.$console = undefined
  }
  return $console
}

export default Console