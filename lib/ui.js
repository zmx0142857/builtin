import { div, uid } from './main.js'
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

  // fixed color. 通常取 0.2 透明度用于背景色, 0.4 用于边框色
  // 例: rgb(from var(--c-red, #e91e63) r g b / 20%)
  'c-shadow': '#bbb', // 用于阴影
  'c-grey': '#808080', // 用于半透明遮罩
  'c-blue': '#3981e6',
  'c-green': '#259f1e',
  'c-red': '#e91e63',
  'c-purple': '#673ab7',
  'c-orange': '#e98124',
}

div.themes.dark = {
  'bg': '#222',
  'bg2': '#333',
  'fg': '#eee',
  'fg1': '#4399ff',
  'fg2': '#aaa',
  'bd': '#888',
  'bd2': '#303030',
  'c-shadow': '#555',
}

const renderTheme = (theme) => {
  return Object.entries(theme).map(([key, value]) => `--${div.key}-${key}: ${value}`).join(';\n')
}

div.css(`:root {
  ${renderTheme(div.themes.light)};
}
@media (prefers-color-scheme: dark) {
  :root {
    ${renderTheme(div.themes.dark)};
  }
}
body {
  background: $bg;
  color: $fg;
}
`, 'root')

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
        top: -201px;
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
        user-select: none;
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
      $console.style.top = show ? '0' : '-201px'
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
    $content.scrollTop = $content.scrollHeight + 100
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
      /*box-shadow: 0 0 8px $c-shadow;*/
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
      background: rgb(from $c-grey r g b / 50%);
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
  const rect = container.getBoundingClientRect()
  return Draggable({
    container,
    tag,
    className,
    innerHTML,
    transform: {
      x: rect.width - 100,
      y: rect.height - 100,
    },
    css: `& {
      position: absolute;
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
      stroke: rgb(from $c-grey r g b / 50%);
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
 * @typedef {{x: number, y: number, rotate: number, scale: number}} Transform
 * @param {object} props
 * @param {HTMLElement} props.el 元素
 * @param {HTMLElement} props.container 容器
 * @param {string} props.className 元素 class
 * @param {boolean} props.enableScale 是否允许缩放
 * @param {boolean} props.enableRotate 是否允许旋转
 * @param {number} props.snap 吸附距离 (px). snap > 0 时, 启用边缘吸附效果; snap = 0 时不吸附, 但有回弹效果; snap < 0 时无效果. enableRotate 为 true 时, snap 强制设为 -1
 * @param {number} props.duration 动画时长 (ms)
 * @param {(trans: Transform, duration?: number) => void} props.render 渲染函数
 * @param {(el: HTMLElement) => {w: number, h: number}} props.sizeInfo 元素大小
 * @param {() => Transform} props.transInfo 初始位置
 * @param {() => void} props.dispose 销毁
 */
const Draggable = ({
  el,
  container = document.body,
  className = 'draggable',
  enableScale = false,
  enableRotate = false,
  snap = -1,
  duration = 300,
  render,
  sizeInfo,
  transInfo,
  dispose,
  ...options
} = {}) => {
  el = div({
    el,
    container,
    className,
    ...options,
  })
  el.style.transformOrigin = 'top left'
  if (enableRotate) snap = -1

  // 位移 x, y, 旋转弧度 rotate, 缩放比例 scale
  const defaultTrans = () => ({ x: 0, y: 0, rotate: 0, scale: 1 })
  transInfo ||= defaultTrans

  render ||= (trans, duration = 0) => {
    const { x, y, rotate, scale } = trans
    el.style.transition = duration ? `transform ${duration}ms` : ''
    el.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}rad) scale(${scale})`
  }

  sizeInfo ||= (el) => {
    return { w: el.offsetWidth, h: el.offsetHeight }
  }

  let timer
  const trans = {
    ...defaultTrans(),
    ...transInfo(),
  }

  const state = {
    moved: false, // 是否移动过
    x0: 0, // 初始 x
    y0: 0, // 初始 y
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
    const { x, y, scale } = trans
    const rect = rectInfo()
    const { w, h } = sizeInfo(el)
    const { x: x0 = 0, y: y0 = 0 } = transInfo()
    trans.x = between(x, scale * x0, rect.width - scale * (w - x0), snap)
    trans.y = between(y, scale * y0, rect.height - scale * (h - y0), snap)
    render(trans, duration)
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

  const rectInfo = () => {
    return container.getBoundingClientRect()
  }

  const onMouseDown = (e) => {
    const { touches = [] } = e
    if (touches.length > 1) { // 多指缩放/旋转
      const { x0, y0, x1, y1, angle, dist } = touchInfo(e)
      const rect = rectInfo()
      state.x = (x0 + x1) / 2 - rect.left
      state.y = (y0 + y1) / 2 - rect.top
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
      multiTouch(e)
    } else { // 单指移动
      const x = e.clientX ?? e.touches[0].clientX
      const y = e.clientY ?? e.touches[0].clientY
      trans.x = state.x + x
      trans.y = state.y + y
    }
    render(trans)
  }

  const onMouseUp = (e) => {
    // 手机充电时可能断触 (意外触发 mouseup)
    snapToEdge()
    div.off(document, 'mousemove', onMouseMove)
    div.off(document, 'mouseup', onMouseUp)
    div.off(document, 'touchmove', onMouseMove, true)
    div.off(document, 'touchend', onMouseUp, true)
  }

  // 多指缩放/旋转
  const multiTouch = (e) => {
    const { angle, dist } = touchInfo(e)
    const k = dist / state.dist
    if (!(k > 0)) return
    const { x, y } = state
    let dx = state.trans.x - x
    let dy = state.trans.y - y
    let cos = 1
    let sin = 0
    // 以两指中点 state.x, state.y 为中心缩放
    if (enableScale) {
      dx *= k
      dy *= k
      trans.scale = state.trans.scale * k
    }
    // 绕两指中点旋转
    if (enableRotate) {
      const a = angle - state.angle
      cos = Math.cos(a)
      sin = Math.sin(a)
      trans.rotate = state.trans.rotate + a
    }
    trans.x = x + dx * cos - dy * sin
    trans.y = y + dx * sin + dy * cos
    render(trans)
    clearTimeout(timer)
    timer = setTimeout(snapToEdge, duration / 10)
  }

  const onWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault()
      if (enableRotate) wheelRotate(e)
    } else {
      if (enableScale) wheelScale(e)
    }
  }

  const diffInfo = (e) => {
    const rect = rectInfo()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const dx = trans.x - x
    const dy = trans.y - y
    return { x, y, dx, dy }
  }

  // 绕鼠标位置旋转
  const wheelRotate = (e) => {
    const a = e.deltaY < 0 ? 0.035 : -0.035
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const { x, y, dx, dy } = diffInfo(e)
    trans.x = x + dx * cos - dy * sin
    trans.y = y + dx * sin + dy * cos
    trans.rotate += a
    render(trans)
  }

  // 以鼠标位置为中心缩放
  const wheelScale = (e) => {
    const k = e.deltaY < 0 ? 1.1 : 1/1.1
    const scale = trans.scale * k
    const { x, y, dx, dy } = diffInfo(e)
    trans.x = x + k * dx
    trans.y = y + k * dy
    trans.scale = scale
    render(trans)
    clearTimeout(timer)
    timer = setTimeout(snapToEdge, duration / 10)
  }

  const stopPropagation = e => state.moved && e.stopPropagation() // 阻止点击事件冒泡

  div.on(el, 'mousedown', onMouseDown)
  div.on(el, 'touchstart', onMouseDown)
  div.on(el, 'wheel', onWheel)
  div.on(el, 'click', stopPropagation, true) // 阻止点击事件冒泡
  render(trans)

  return {
    el,
    dispose () {
      div.off(el, 'mousedown', onMouseDown)
      div.off(el, 'touchstart', onMouseDown)
      div.off(el, 'wheel', onWheel)
      div.off(el, 'click', stopPropagation, true)
      dispose?.()
    },
    getTransform () {
      return trans
    },
    setTransform (value) {
      Object.assign(trans, value)
      render(trans)
    },
    resetTransform () {
      this.setTransform({
        ...defaultTrans(),
        ...transInfo(),
      })
    },
  }
}

/**
 * 表格
 */
export const Table = ({ container, el, className = 'table', title = '', header = [], rows = [], columns = [], data = [] }) => {
  className = div.key + '-' + className
  const render = (content, value, ...args) => {
    return typeof content === 'function' ? content(value, ...args) : value
  }

  const renderTable = () => {
    const buf = []
    if (title) buf.push(`<caption>${title}</caption>`)
    if (!header.length && columns.length) header = columns.map(v => v.label)
    if (!rows.length && data.length) rows = data.map(row => columns.map(v => render(v.render, row[v.key], row)))
    if (header.length) buf.push('<tr>', ...header.map(th => render(th, `<th>${th}</th>`)), '</tr>')
    rows.forEach(tr => buf.push('<tr>', ...tr.map(td => render(td, `<td>${td}</td>`)), '</tr>'))
    return buf.join('\n')
  }

  const table = div({
    tag: 'table',
    container,
    el,
    className,
    css: `& {
      margin: 0 auto;
      border-top: 2px solid;
      border-bottom: 2px solid;
    }

    & caption {
      font-weight: bold;
      margin: 0.9em 0 0.9em 0;
    }

    & td, & th {
      padding: 0.45em 0.75em 0.45em 0.75em;
    }

    &.col2 td:nth-child(odd), &.col2 th:nth-child(odd) {
      background: rgb(from $c-grey r g b / 30%);
    }`,
    innerHTML: renderTable(),
  })
  return table
}

/**
 * 标签页
 */
export const Tabs = ({ container, className = 'tabs', items = [], active, onChange }) => {
  className = div.key + '-' + className
  active ||= items[0]?.key

  const renderTabs = () => {
    const buf = [
      `<div class="${className}-body">`,
      ...items.map(v => `<div id="tabs-${v.key}" class="${className}-body-item">${v.innerHTML}</div>`),
      '</div>',
      `<div class="${className}-footer">`,
      ...items.map(v => `<a class="${div.clsx(className + '-footer-item', { active: active === v.key })}" href="#tabs-${v.key}">${v.label}</a>`),
      '</div>',
    ]
    return buf.join('\n')
  }

  const tabs = div({
    container,
    innerHTML: renderTabs(),
    className,
    css: `& {
      border-radius: 10px;
      background-color: $bg;
      box-shadow: 0 0 10px 0 $c-shadow;
      overflow: hidden;
    }
    &-body {
      height: 500px;
      overflow: hidden;
    }
    &-body-item {
      height: 100%;
      padding: 10px 16px;
      overflow-y: auto;
      overflow-x: hidden;
      font-size: 0.85rem;
      display: none;
    }
    &-body-item:first-child,
    &-body-item:target {
      display: block;
    }
    &-footer {
      display: flex;
      padding: 10px 16px 10px 0;
      border-left: 16px solid $bg;
      flex-wrap: wrap;
      overflow: hidden;
    }
    &-footer-item {
      padding: 0 8px;
      text-align: center;
      border-left: 1px solid $bd;
      transform: translateX(-1px);
    }
    &-footer-item:link, &-footer-item:visited {
      color: $fg;
    }
    &-footer-item:hover, &-footer-item.active {
      color: $fg1;
    }`
  })

  const footer = div({
    container: tabs,
    selector: `.${className}-footer`,
    onclick (e) {
      const el = e.target
      if (el.tagName.toLowerCase() !== 'a') return
      ;[...footer.querySelectorAll('a')].forEach(a => a.classList.remove('active'))
      el.classList.add('active')
      onChange?.(el.getAttribute('href').slice(6))
    }
  })

  return tabs
}

/**
 * 进度条
 */
export const Progress = ({ container, className = 'progress', color = '#8ef', autoIncrement = 0 } = {}) => {
  className = div.key + '-' + className
  const dom = div({
    container,
    className,
    style: {
      backgroundImage: `linear-gradient(90deg, transparent, ${color})`,
    },
    css: `& {
      position: absolute;
      left: -3px;
      top: 0;
      height: 6px;
      border-radius: 3px;
      opacity: 1;
      transition: width linear .3s, opacity .3s;
    }`,
  })

  let current = 0
  let timer
  let loaded = {}
  let total = {}
  const id = uid(6)

  dom.update = (percent) => {
    if (percent === current) return
    current = percent
    dom.style.width = percent + '%'
    if (percent >= 100) {
      dom.style.opacity = 0
      clearInterval(timer)
      console.timeEnd(`${className}-${id}`)
    } else {
      dom.style.opacity = 1
    }
  }

  dom.onProgress = (e, key) => {
    loaded[key] = e.loaded
    total[key] = e.total
    const sumLoaded = Object.values(loaded).reduce((a, b) => a + b, 0)
    const sumTotal = Object.values(total).reduce((a, b) => a + b, 0)
    const percent = sumLoaded / sumTotal * 100 | 0
    dom.update(percent)
  }

  dom.start = () => {
    console.time(`${className}-${id}`)
    dom.update(0)
    loaded = {}
    total = {}
    if (autoIncrement) {
      clearInterval(timer)
      timer = setInterval(() => {
        if (current >= 99) clearInterval(timer)
        dom.update(Math.min(current + autoIncrement, 99))
      }, 100)
    }
    return this
  }

  dom.end = () => {
    dom.update(100)
    return this
  }

  dom.start() // 默认开始
  return dom
}

export const Canvas = ({
  el,
  container,
  className = 'canvas',
  dpr = window.devicePixelRatio,
  type,
} = {}) => {
  className = div.key + '-' + className
  const canvas = div({
    el,
    container,
    tag: 'canvas',
    className,
    selector: className,
    style: {
      width: '100%',
      height: '100%',
      display: 'block',
    },
  })
  const responsive = () => {
    const width = canvas.clientWidth * dpr | 0
    const height = canvas.clientHeight * dpr | 0
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
  }
  responsive()
  return {
    canvas,
    cpr,
    ctx: type && canvas.getContext(type),
    responsive,
    dpr,
  }
}
