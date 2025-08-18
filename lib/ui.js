import { div } from './main.js'
export { div } from './main.js'

div.themes.light = {
  // background color
  'bg': '#fff',
  'bg1': '#1976d2', // primary: bright vivid surface color
  'bg2': '#f8f8f8',  // secondary: surface color like modal, card
  'bg3': '#333', // complement surface color

  // foreground color
  'fg': '#333',
  'fg1': '#1976d2', // bright vivid color
  'fg2': '#aaa', // secondary: usually gray and unimportant
  'fg3': '#fff', // complement: e.g. text color on primary background

  // border color
  'bd': '#ccc',
  'bd1': '#1976d2',
  'bd2': '#eee',

  // measure
  'xl': '32px',
  'lg': '16px',
  'md': '8px',
  'sm': '4px',
  'xs': '2px',

  // colors
  'c-shadow': '#aaa', // 用于阴影
  'c-mask': 'rgba(128, 128, 128, 0.5)', // 半透明, 用于遮罩

  // fixed color. 通常取 0.2 透明度用于背景色, 0.4 用于边框色
  // 例: rgb(from var(--c-red, #e91e63) r g b / 20%)
  'c-blue': '#3981e6',
  'c-green': '#259f1e',
  'c-red': '#e91e63',
  'c-purple': '#673ab7',
  'c-orange': '#e98124',
}

/**
 * 日志
 * 劫持原生的 console 对象, 将日志追加到 dom 元素中, 主要用于移动端调试
 */
export const Console = ({ container = document.body, className = 'console', truncLength = 3000 } = {}) => {
  if (Console.oldConsole) return console.warn('Console has been initialized')
  const oldConsole = Console.oldConsole = window.console
  className = div.key + '-' + className

  const $console = div({
    container,
    className,
    innerHTML: `<button class="${className}-toggle">console</button><div class="${className}-content"></div>`,
    css: `
      & {
        position: absolute;
        z-index: 9999;
        top: -200px;
        left: 0;
        right: 0;
        background-color: $bg;
        border-bottom: 1px solid $bd;
      }
      &-content {
        height: 200px;
        overflow: auto;
        padding: 4px 10px;
        white-space: pre-wrap;
        line-break: anywhere;
        font-family: Consolas, monospace;
      }
      &-toggle {
        position: absolute;
        bottom: 0;
        right: 0;
        transform: translateY(100%);
        height: 30px;
        background: $bg;
        color: $fg;
        border: 1px solid $bd;
        cursor: pointer;
      }
      &-record { border-bottom: 1px solid $bd2; }
      &-log { color: $fg; }
      &-error { color: $c-red; }
      &-warn { color: $c-orange; }
    `,
  })

  let show = false
  const $toggle = div({
    container: $console,
    selector: `.${className}-toggle`,
    onclick () {
      show = !show
      $console.style.top = show ? '0' : '-200px'
    },
  })
  const $content = div({
    container: $console,
    selector: `.${className}-content`,
  })

  const trunc = (arg) => {
    const res = typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    return res.length > truncLength ? res.slice(0, truncLength) + '...' : res
  }
  const override = (key) => (...args) => {
    oldConsole[key](...args)
    $content.innerHTML += `<div class="${className}-record ${className}-${key}">` + args.map(trunc).join(' ') + '</div>'
    $content.scrollTop = $console.scrollHeight + 100
  }
  const newConsole = window.console = {
    ...oldConsole,
    ...Object.fromEntries(['log', 'error', 'warn'].map(key => [key, override(key)]))
  }
  window.onerror = (err) => {
    newConsole.error(err)
    return true
  }
  window.onunhandledrejection = (err) => {
    newConsole.error('Uncaught (in promise)', err.reason)
    return true
  }
  return $console
}

/**
 * 轻提示
 */
export const Toast = ({ container = document.body, className = 'toast', innerHTML = '', duration = 2000 } = {}) => {
  className = div.key + '-' + className
  const toast = div({
    container,
    className,
    selector: true,
    innerHTML,
    style: {
      display: 'block',
      opacity: '1',
    },
    css: `& {
      display: none;
      background-color: $bg;
      color: $fg;
      border: 1px solid $bd;
      border-radius: $md;
      padding: 10px 12px;
      transition: opacity .5s;
      min-width: 24px;
      max-width: 80%;
      position: fixed;
      left: 50%;
      top: 40px;
      transform: translateX(-50%);
      text-align: center;
    }`
  })
  clearTimeout(toast.timer1)
  clearTimeout(toast.timer2)
  toast.timer1 = setTimeout(() => toast.style.opacity = '0', duration)
  toast.timer2 = setTimeout(() => toast.style.display = 'none', duration + 500)
  return toast
}

/**
 * 弹窗
 */
export const Modal = ({ container = document.body, className = 'modal', innerHTML = '', show = true } = {}) => {
  className = div.key + '-' + className
  const modal = div({
    container,
    className,
    selector: true,
    innerHTML: `<div class="${className}-mask g-fixed g-full-window"></div><div class="${className}-body g-fixed g-transform-center"></div>`,
    css: `
    & {
      display: none;
      position: absolute;
      z-index: 1;
      transition: opacity .2s;
    }
    &-mask {
      background: $c-mask;
    }
    &-body {
      background-color: $bg2;
      padding: 20px;
      color: $fg;
      border-radius: $md;
      width: 80%;
      overflow: hidden;
    }`,
    setShow (value) {
      if (value) {
        Object.assign(modal.style, {
          display: 'block',
          opacity: '0',
        })
        if (innerHTML) body.innerHTML = innerHTML
        setTimeout(() => modal.style.opacity = '1', 200)
      } else {
        modal.style.opacity = '0'
        setTimeout(() => modal.style.display = 'none', 200)
      }
    },
  })
  const body = div({
    container: modal,
    selector: `.${className}-body`,
  })
  const mask = div({
    container: modal,
    selector: `.${className}-mask`,
    onclick: () => modal.setShow(false),
  })
  modal.setShow(show)
  return modal
}

/**
 * 浮动按钮
 */
export const Float = ({ container = document.body, className = 'float', innerHTML = '', tag = 'button' } = {}) => {
  return Draggable({
    container,
    tag,
    className,
    innerHTML,
    css: `& {
      position: absolute;
      left: calc(100% - 100px);
      top: calc(100% - 100px);
      z-index: 1;
      height: 50px;
      width: 50px;
      line-height: 50px;
      text-align: center;
      border-radius: 50%;
      border: none;
      padding: 0;
      background-color: $bg1;
      color: $fg3;
      user-select: none;
      font-size: 24px;
      font-weight: bold;
      box-shadow: $c-shadow 0px 5px 7px -2px;
      cursor: move;
    }`
  })
}

/**
 * 按钮
 * @param {object} props
 * @param {'primary' | 'default'} props.type
 */
export const Button = ({ container, className = 'button', innerHTML = '', onClick, type = 'default', onDropdown } = {}) => {
  className = div.key + '-' + className
  const button = div({
    container,
    tag: 'button',
    className,
    innerHTML: onDropdown ? innerHTML + `<a class="${className}-suffix ${className}-suffix-arrow"></a>` : innerHTML,
    on: {
      click: onClick,
    },
    css: `& {
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      border-radius: $xs;
      font-size: 14px;
      cursor: pointer;
      color: $fg;
      background-color: $bg;
      border: 1px solid $bd;
      opacity: 0.9;
      user-select: none;
    }
    &-primary {
      color: $fg3;
      background-color: $bg1;
      border-color: $bd1;
    }
    &:active {
      opacity: 1;
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    &-suffix {
      position: relative;
      border-left: 1px solid $bd;
      margin-left: 6px;
      display: inline-block;
      height: 18px;
      width: 36px;
      margin-right: -16px;
      font-size: 20px;
    }
    &-suffix-arrow::after {
      content: '';
      position: absolute;
      display: block;
      top: 2px;
      left: 12px;
      width: 8px;
      height: 8px;
      border-left: 1px solid $bd;
      border-top: 1px solid $bd;
      transform: rotate(-135deg);
      transform-origin: center;
    }`,
  })
  button.classList.add(`${className}-${type}`)
  if (onDropdown) {
    const suffix = div({
      container: button,
      selector: `.${className}-suffix`,
      onclick: onDropdown,
    })
  }
  return button
}

/**
 * 下拉菜单
 * @param {object} props 
 * @param {[{ label: string, value: string }]} props.items
 */
export const Menu = ({ container = document.body, className = 'menu', innerHTML = '', show = true, items = [], renderItem, onSelect } = {}) => {
  className = div.key + '-' + className
  renderItem ||= item => (
    `<div class="${className}-body-item" role="link" data-value="${item.value}">${item.label}</div>`
  )
  const menu = div({
    container,
    className,
    selector: true,
    innerHTML: `<div class="${className}-mask g-full"></div><div class="${className}-body g-absolute"></div>`,
    css: `& {
      display: none;
      z-index: 1;
    }
    &-body {
      color: $fg;
      background-color: $bg;
      padding: 6px;
      border: 1px solid $bd;
      border-radius: $sm;
    }
    &-body-item {
      padding: 4px 10px;
      cursor: pointer;
      border-radius: $sm;
    }
    &-body-item:hover {
      background-color: $bg2;
    }`,
    setShow (value, { bodyStyle } = {}) {
      if (value) {
        menu.style.display = 'block'
        body.innerHTML = innerHTML || items.map(renderItem).join('')
        Object.assign(body.style, bodyStyle)
      } else {
        menu.style.display = 'none'
      }
    },
  })
  menu.classList.add('g-fixed', 'g-full-window')
  const body = div({
    container: menu,
    selector: `.${className}-body`,
    onclick: (e) => {
      const { value } = e.target.dataset
      if (value) onSelect?.(value)
    },
  })
  const mask = div({
    container: menu,
    selector: `.${className}-mask`,
    onclick: () => menu.setShow(false),
  })
  menu.setShow(show)
  return menu
}

/**
 * 可折叠元素
 */
export const Expand = ({ container, className = 'expand', innerHTML = '', show = false, duration = 300 } = {}) => {
  className = div.key + '-' + className
  const expand = div({
    container,
    className,
    css: `& {
      height: 0;
      transition: height ${duration / 1000}s;
      overflow: hidden;
    }`,
    setShow (value) {
      if (value) {
        expand.style.height = body.offsetHeight + 'px'
      } else {
        expand.style.height = '0'
      }
    },
  })
  const body = div({
    container: expand,
    className: `${className}-body`,
    innerHTML,
  })
  expand.setShow(show)
  return expand
}

/**
 * 加载中
 */
export const Loading = ({ container, className = 'loading' } = {}) => {
  className = div.key + '-' + className
  const loading = div({
    container,
    className,
    selector: true,
    innerHTML: `<svg viewBox="0 0 50 50" class="${className}-circle">
      <circle cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke-miterlimit="10" />
    </svg>`,
    css: `& {
      position: relative;
      width: 100px;
      height: 100px;
    }
    &-circle {
      width: 100%;
      height: 100%;
      stroke: $c-mask;
      stroke-dasharray: 120;
      stroke-dashoffset: 0;
      stroke-linecap: round;
      animation: ${className} 2s ease infinite;
      transform: rotate(-90deg);
    }
    @keyframes ${className} {
      0% { stroke-dashoffset: 120; }
      50% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: -120; }
    }`,
  })
  return loading
}

/**
 * 可拖拽元素
 * 使用时, 建议为 container 设置样式 overflow: hidden;
 * @param {object} props
 * @param {boolean} enableScale 是否允许缩放
 * @param {boolean} enableRotate 是否允许旋转
 * @param {number} snap 吸附距离 (px). snap > 0 时, 启用边缘吸附效果; snap = 0 时不吸附, 但有回弹效果; snap < 0 时无效果. enableRotate 为 true 时, snap 强制设为 -1
 * @param {number} transition 动画时长 (ms)
 */
export const Draggable = ({
  el,
  container = document.body,
  className = 'draggable',
  enableScale = false,
  enableRotate = false,
  snap = 0,
  transition = 300,
  ...options
} = {}) => {
  className = div.key + '-' + className
  el = div({
    el,
    container,
    className,
    ...options,
  })
  el.style.transformOrigin = 'center'
  if (enableRotate) snap = -1

  let timer
  const trans = {
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
  }

  const state = {
    moved: false, // 是否移动过
    x0: 0, // 初始 x
    y0: 0, // 初始 y
  }

  const render = (transition) => {
    const { x, y, rotate, scale } = trans
    el.style.transition = transition ? `transform ${transition}ms` : ''
    el.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`
  }

  const between = (x, min, max, snap) => {
    if (min > max) {
      const tmp = min
      min = max
      max = tmp
    }
    if (min + snap > max - snap) return min
    if (x < min + snap) return min
    if (x > max - snap) return max
    return x
  }

  // 边缘吸附
  const snapToEdge = () => {
    if (!(snap >= 0)) return
    const rect = container.getBoundingClientRect()
    const { x, y, scale } = trans
    const { offsetWidth: w, offsetHeight: h } = el
    const k = (scale - 1) / 2
    trans.x = between(x, k * w, rect.width - (1 + k) * w, snap)
    trans.y = between(y, k * h, rect.height - (1 + k) * h, snap)
    render(transition)
  }

  const touchInfo = (e) => {
    const { touches = [] } = e
    const { atan2, max, abs } = Math
    const x0 = touches[0].clientX
    const y0 = touches[0].clientY
    const x1 = touches[1].clientX
    const y1 = touches[1].clientY
    return {
      x0, y0, x1, y1,
      angle: atan2(y1 - y0, x1 - x0),
      dist: max(abs(x1 - x0), abs(y1 - y0)),
    }
  }

  const onMouseDown = (e) => {
    const { touches = [] } = e
    if (touches.length > 1) { // 多指缩放/旋转
      const { x0, y0, x1, y1, angle, dist } = touchInfo(e)
      state.x = (x0 + x1) / 2
      state.y = (y0 + y1) / 2
      state.angle = angle
      state.dist = dist
      state.trans = { ...trans }
    } else { // 单指移动
      const x = e.clientX ?? e.touches[0].clientX
      const y = e.clientY ?? e.touches[0].clientY
      state.x = trans.x - x
      state.y = trans.y - y
      state.moved = false
    }
    div.on(document, 'mousemove', onMouseMove)
    div.on(document, 'mouseup', onMouseUp)
    div.on(document, 'touchmove', onMouseMove, true)
    div.on(document, 'touchend', onMouseUp, true)
  }

  const onMouseMove = (e) => {
    state.moved = true
    const { touches = [] } = e
    if (touches.length > 1) { // 多指缩放/旋转
      const { angle, dist } = touchInfo(e)
      const k = dist / state.dist
      if (k > 0) {
        // TODO: 目前是绕 el 的中心旋转. 改为绕 state.x 旋转?
        if (enableRotate) {
          trans.rotate = state.trans.rotate + (angle - state.angle) * 180 / Math.PI
        }
        if (enableScale) {
          trans.x = state.x - (state.x - state.trans.x) * k
          trans.y = state.y - (state.y - state.trans.y) * k
          trans.scale = state.trans.scale * k
        }
        render()
        clearTimeout(timer)
        timer = setTimeout(snapToEdge, transition / 10)
      }
    } else { // 单指移动
      const x = e.clientX ?? e.touches[0].clientX
      const y = e.clientY ?? e.touches[0].clientY
      trans.x = state.x + x
      trans.y = state.y + y
    }
    render()
  }

  const onMouseUp = (e) => {
    snapToEdge()
    div.off(document, 'mousemove', onMouseMove)
    div.off(document, 'mouseup', onMouseUp)
    div.off(document, 'touchmove', onMouseMove, true)
    div.off(document, 'touchend', onMouseUp, true)
  }

  const onWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault()
      if (enableRotate) rotate(e)
    } else {
      if (enableScale) scale(e)
    }
  }

  const rotate = (e) => {
    const angle = e.deltaY < 0 ? 2 : -2
    trans.rotate += angle
    render()
  }

  const scale = (e) => {
    const k = e.deltaY < 0 ? 1.1 : 1/1.1
    const scale = trans.scale * k
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left - el.offsetWidth / 2
    const y = e.clientY - rect.top - el.offsetHeight / 2
    trans.x = x - (x - trans.x) * k
    trans.y = y - (y - trans.y) * k
    trans.scale = scale
    render()
    clearTimeout(timer)
    timer = setTimeout(snapToEdge, transition / 10)
  }

  div.on(el, 'mousedown', onMouseDown)
  div.on(el, 'touchstart', onMouseDown)
  div.on(el, 'wheel', onWheel)
  div.on(el, 'click', (e) => state.moved && e.stopPropagation(), true) // 阻止点击事件冒泡
  return el
}