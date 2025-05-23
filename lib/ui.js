export const config = {
  key: 'va', // short for vanilla-ui
  theme: 'light',
  cssVars: {
    light: {
      bg: '#fff', // background color
      'bg-primary': '#1976d2', // bright vivid surface color
      'bg-secondary': '#f8f8f8',  // surface color like modal, card
      'bg-mask': 'rgba(128, 128, 128, 0.5)',
      'bg-complement': '#333',
      fg: '#333', // foreground color
      'fg-primary': '#1976d2', // bright vivid color
      'fg-secondary': '#aaa', // secondary color, usually gray and unimportant
      'fg-complement': '#fff', // complement color, e.g. text color on primary background
      bd: '#ccc', // border color
      'bd-secondary': '#eee',
      sd: '#aaa', // shadow color
      rd: '8px', // border radius
      'rd-md': '4px',
      'rd-sm': '2px',
      // fixed color. 通常取 0.2 透明度用于背景色, 0.4 用于边框色
      'fg-blue': '#3981e6',
      'fg-green': '#259f1e',
      'fg-red': '#e91e63',
      'fg-purple': '#673ab7',
      'fg-orange': '#e98124',
    },
  },
}

export const utils = {
  // 遍历 object
  each (obj, fn) {
    return Object.entries(obj).forEach(([k, v]) => fn(v, k))
  },
  // 生成 className
  clsx (...args) {
    if (args.length === 0) return ''
    if (args.length > 1) return args.map(arg => utils.clsx(arg)).filter(Boolean).join(' ')
    const arg = args[0]
    if (Array.isArray(arg)) return utils.clsx(...arg)
    if (typeof arg === 'string') return arg
    // suppose arg is object
    let buf = []
    utils.each(arg, (value, key) => {
      if (value) buf.push(key)
    })
    return buf.join(' ')
  },
  /**
   * @param {HTMLElement} el
   * @param {object} options
   */
  assign (el, options) {
    utils.each(options, (value, key) => {
      switch (key) {
        case 'className': return el.className = utils.clsx(value)
        case 'style': return Object.assign(el.style, value)
        case 'attrs': return utils.each(value, (v, k) => el.setAttribute(k, v))
        case 'on':
          return utils.each(value, (v, k) => {
            const arr = k.split('.')
            el.addEventListener(arr[0], v)
          })
        case 'off':
          return utils.each(value, (v, k) => {
            const arr = k.split('.')
            el.removeEventListener(arr[0], v)
          })
        case 'children':
          return value.forEach(child => el.appendChild(child))
        default:
          if (key !== 'namespace') {
            el[key] = value
          }
      }
    })
    options.el = el
    return el
  },
  /**
   * 创建/查找 dom 元素
   * @param {HTMLElement | Document} container 容器, 可选
   * @param {string | HTMLElement | Document} selector 元素或选择器
   * @param {object} options 其它选项, 可选
   * @example
   * ```
   * // usage: $(container?: HTMLElement, selector: string | HTMLElement, options?: object)
   * $() => // create DocumentFragment
   * $('<div>') // create <div>
   * $('.name') // find <div class="name">
   * $(el, { children: [child1, child2] }) // append children
   * $(el, { on: { click: handler } }) // add event listener
   * ```
   */
  $ (...args) {
    if (args.length === 0) return document.createDocumentFragment()
    if (args.length === 1 || typeof args[0] === 'string' || args[1].toString() === '[object Object]') return utils.$(undefined, ...args)
    const [container, str = '', options = {}] = args

    let el
    if (str instanceof HTMLElement || str instanceof Document) {
      el = str
    } else if (str[0] === '<') {
      const tag = str.slice(1, -1)
      el = options.namespace
        ? document.createElementNS(options.namespace, tag)
        : document.createElement(tag)
      if (container) container.appendChild(el)
    } else {
      el = (container || document).querySelector(str)
    }
    return el && utils.assign(el, options)
  },
  styles: {},
  /**
   * 向 head 添加样式代码. 同一个 className 的样式只能添加一次
   */
  addStyle (str, className) {
    if (className && utils.styles[className]) return
    utils.styles[className] = true
    const style = $(document.head, `style[data-key="${config.key}"]`)
      || $(document.head, '<style>', { attrs: { 'data-key': config.key } })
    style.innerHTML += utils.removeIndent(str)
    return style
  },
  cssVar (key, defaultValue) {
    defaultValue ||= config.cssVars[config.theme][key]
    const name = `--${config.key}-${key}`
    return defaultValue ? `var(${name}, ${defaultValue})` : `var(${name})`
  },
  removeIndent (str) {
    return str.replace(/\n\s+/g, '\n')
  },
  escapeHTML (text) {
    return text.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  },
  /**
   * string template
   */
  html (arr, ...args) {
    const buf = []
    arr.forEach((str, i) => {
      buf.push(str)
      if (args[i] === undefined) args[i] = ''
      buf.push(utils.escapeHTML(String(args[i])))
    })
    return buf.join('')
  },
}

const { $, cssVar } = utils

/**
 * 日志
 * 劫持原生的 console 对象, 将日志追加到 dom 元素中, 主要用于移动端调试
 */
export const Console = ({ container = document.body, className = 'console' } = {}) => {
  if (Console.oldConsole) return
  Console.oldConsole = window.console

  className = config.key + '-' + className

  const $console = $(container, '<div>', {
    className,
    innerHTML: `<button class="${className}-toggle">console</button><div class="${className}-content"></div>`,
  })

  let show = false
  const $toggle = $($console, `.${className}-toggle`, {
    onclick () {
      show = !show
      $console.style.top = show ? '0' : '-200px'
    }
  })
  const $content = $($console, `.${className}-content`)

  utils.addStyle(`
    .${className} {
      position: absolute;
      z-index: 9999;
      top: -200px;
      left: 0;
      right: 0;
      background-color: ${cssVar('bg')};
      border-bottom: 1px solid ${cssVar('bd')};
    }
    .${className}-content {
      height: 200px;
      overflow: auto;
      padding: 10px;
      white-space: pre-wrap;
      line-break: anywhere;
      font-family: Consolas, monospace;
    }
    .${className}-toggle {
      position: absolute;
      bottom: 0;
      right: 0;
      transform: translateY(100%);
      height: 30px;
      background: ${cssVar('bg')};
      color: ${cssVar('fg')};
      border: 1px solid ${cssVar('bd')};
      cursor: pointer;
    }
    .${className}-log { color: ${cssVar('fg')}; }
    .${className}-error { color: #f00; }
    .${className}-warn { color: #f80; }
    .${className}-debug { color: ${cssVar('fg-secondary')}; }
  `, className)

  const trunc = (arg) => {
    const res = typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    return res.length > 3000 ? res.slice(0, 3000) + '...' : res
  }
  const override = (key) => (...args) => {
    Console.oldConsole[key](...args)
    $content.innerHTML += `<div class="${className}-${key}">` + args.map(trunc).join(' ') + '</div>'
    $content.scrollTop = $console.scrollHeight + 100
  }
  const newConsole = window.console = Object.fromEntries(
    ['log', 'error', 'warn', 'debug'].map(key => [key, override(key)])
  )
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
  className = config.key + '-' + className

  const options = {
    className,
    innerHTML,
    style: {
      display: 'block',
      opacity: '1',
    },
  }

  const $toast = $(container, '.' + className, options) || $(container, '<div>', options)

  utils.addStyle(`
  .${className} {
    display: none;
    background-color: ${cssVar('bg')};
    color: ${cssVar('fg')};
    border: 1px solid ${cssVar('bd')};
    border-radius: ${cssVar('rd')};
    padding: 10px 12px;
    transition: opacity .5s;
    min-width: 24px;
    max-width: 80%;
    position: fixed;
    left: 50%;
    top: 40px;
    transform: translateX(-50%);
    text-align: center;
  }`, className)

  setTimeout(() => {
    $toast.style.opacity = '0'
  }, duration)
  setTimeout(() => {
    $toast.style.display = 'none'
  }, duration + 500)
}

/**
 * 弹窗
 */
export const Modal = ({ container = document.body, className = 'modal', innerHTML = '', show = true } = {}) => {
  className = config.key + '-' + className
  const $modal = $(container, '.' + className) || $(container, '<div>', {
    className,
    innerHTML: `<div class="${className}-mask g-fixed g-full-window"></div><div class="${className}-body g-fixed g-transform-center"></div>`,
  })
  $modal.show = show
  const $modalBody = $($modal, `.${className}-body`)
  const $modalMask = $($modal, `.${className}-mask`)

  utils.addStyle(`
  .${className} {
    display: none;
    position: absolute;
    z-index: 1;
    transition: opacity .2s;
  }
  .${className}-mask {
    background: ${cssVar('bg-mask')};
  }
  .${className}-body {
    background-color: ${cssVar('bg-secondary')};
    padding: 20px;
    color: ${cssVar('fg')};
    border-radius: ${cssVar('rd')};
    width: 80%;
    overflow: hidden;
  }`, className)

  if (show) {
    Object.assign($modal.style, {
      display: 'block',
      opacity: '0',
    })
    if (innerHTML) $modalBody.innerHTML = innerHTML
    $modalMask.onclick = () => Modal({ show: false })
    setTimeout(() => {
      $modal.style.opacity = '1'
    }, 200)
  } else {
    $modal.style.opacity = '0'
    setTimeout(() => {
      $modal.style.display = 'none'
    }, 200)
  }
}

/**
 * 浮动按钮
 */
export const Float = ({ container = document.body, className = 'float', innerHTML = '' } = {}) => {
  className = config.key + '-' + className
  const $float = $(container, '<div>', {
    className,
    innerHTML,
    on: {
      pointerdown: (e) => {
        const x0 = $float.offsetLeft - e.clientX
        const y0 = $float.offsetTop - e.clientY
        const onMouseMove = (e) => {
          const { clientX, clientY } = e
          $($float, {
            style: {
              left: x0 + clientX + 'px',
              top: y0 + clientY + 'px',
            }
          })
        }
        const onMouseUp = (e) => {
          $(document, {
            off: {
              pointermove: onMouseMove,
              pointerup: onMouseUp,
            }
          })
        }
        $(document, {
          on: {
            pointermove: onMouseMove,
            pointerup: onMouseUp,
          }
        })
      }
    }
  })
  utils.addStyle(`
  .${className} {
    position: absolute;
    left: calc(100% - 100px);
    top: calc(100% - 100px);
    z-index: 1;
    height: 50px;
    width: 50px;
    line-height: 50px;
    text-align: center;
    border-radius: 50%;
    background-color: ${cssVar('bg-primary')};
    color: ${cssVar('fg-complement')};
    user-select: none;
    font-size: 24px;
    font-weight: bold;
    box-shadow: ${cssVar('sd')} 0px 5px 7px -2px;
    cursor: move;
  }`, className)
}

/**
 * 按钮
 * @param {object} props
 * @param {string} props.type 'primary' | 'default'
 */
export const Button = ({ container, className = 'button', innerHTML = '', onClick, type = 'default', suffix = false } = {}) => {
  className = config.key + '-' + className
  const $button = $(container, '<button>', {
    className: `${className} ${className}-${type}`,
    innerHTML: suffix ? innerHTML + `<a class="${className}-suffix ${className}-suffix-arrow"></a>` : innerHTML,
    on: {
      click: onClick,
    }
  })
  utils.addStyle(`
  .${className} {
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    border-radius: ${cssVar('rd-sm')};
    font-size: 14px;
    cursor: pointer;
    color: ${cssVar('fg')};
    background-color: ${cssVar('bg')};
    border: 1px solid ${cssVar('bd')};
    opacity: 0.9;
    user-select: none;
  }
  .${className}.${className}-primary {
    color: ${cssVar('fg-complement')};
    background-color: ${cssVar('bg-primary')};
    border-color: ${cssVar('bg-primary')};
  }
  .${className}:active {
    opacity: 1;
  }
  .${className}:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .${className}-suffix {
    position: relative;
    border-left: 1px solid ${cssVar('bd')};
    margin-left: 6px;
    display: inline-block;
    height: 18px;
    width: 36px;
    margin-right: -16px;
    font-size: 20px;
  }
  .${className}-suffix-arrow::after {
    content: '';
    position: absolute;
    display: block;
    top: 2px;
    left: 12px;
    width: 8px;
    height: 8px;
    border-left: 1px solid ${cssVar('bd')};
    border-top: 1px solid ${cssVar('bd')};
    transform: rotate(-135deg);
    transform-origin: center;
  }`, className)
  return $button
}

/**
 * 下拉菜单
 * @param {object} props 
 * @param {[{ label: string, value: string }]} props.items
 */
export const Menu = ({ container = document.body, className = 'menu', innerHTML = '', show = true, bodyStyle, items = [] } = {}) => {
  className = config.key + '-' + className
  const bodyClass = className + '-body'
  const $menu = $(container, '.' + className) || $(container, '<div>', {
    className: [className, 'g-fixed g-full-window'],
    innerHTML: `<div class="${className}-mask g-full"></div><div class="${bodyClass}"></div>`,
  })
  if (show) {
    $menu.style.display = 'block'
    $($menu, `.${bodyClass}`, {
      innerHTML: innerHTML || items.map(item => `<div class="${bodyClass}-item" role="link" data-value="${item.value}">${item.label}</div>`).join(''),
      style: bodyStyle,
    })
    $($menu, `.${className}-mask`, {
      on: {
        click: () => UI.Menu({ show: false })
      }
    })
  } else {
    $menu.style.display = 'none'
  }

  utils.addStyle(`
  .${className} {
    display: none;
    z-index: 1;
  }
  .${bodyClass} {
    position: absolute;
    color: ${cssVar('fg')};
    background-color: ${cssVar('bg')};
    padding: 6px;
    border: 1px solid ${cssVar('bd')};
    border-radius: ${cssVar('rd-md')};
    transform: translate(-100%, -100%);
  }
  .${bodyClass}-item {
    padding: 4px 10px;
    cursor: pointer;
    border-radius: ${cssVar('rd-md')};
  }
  .${bodyClass}-item:hover {
    background-color: ${cssVar('bg-secondary')};
  }`, className)

  return $menu
}

/**
 * 手风琴菜单
 */
export const Expand = ({ container, className = 'expand', innerHTML = '', show = false, duration = 300 } = {}) => {
  className = config.key + '-' + className
  const $expand = $(container, '<div>', {
    className,
  })
  const $body = $($expand, '<div>', {
    className: `${className}-body`,
    innerHTML,
  })
  utils.addStyle(`
  .${className} {
    height: 0;
    transition: height ${duration / 1000}s;
    overflow: hidden;
  }`, className)
  Object.defineProperties($expand, {
    show: {
      get () {
        return show
      },
      set (value) {
        show = value
        $expand.style.height = value ? $body.offsetHeight + 'px' : '0'
      }
    },
    innerHTML: {
      get () {
        return $body.innerHTML
      },
      set (value) {
        $body.innerHTML = value
        $expand.style.height = show ? $body.offsetHeight + 'px' : '0'
      }
    },
  })
  $expand.show = show
  return $expand
}

/**
 * 加载中
 */
export const Loading = ({ container, className = 'loading' } = {}) => {
  className = config.key + '-' + className
  const $loading = $(container, '<div>', {
    className,
    innerHTML: `<svg viewBox="0 0 50 50" class="${className}-circle">
      <circle cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke-miterlimit="10" />
    </svg>`
  })
  utils.addStyle(`
  .${className} {
    position: relative;
    width: 100px;
    height: 100px;
  }
  .${className}-circle {
    width: 100%;
    height: 100%;
    stroke: ${cssVar('bg-mask')};
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
  }`, className)
  return $loading
}

export const Draggable = ({ el, container, className, style, pin = true }) => {
  el = el || $('<div>')
  $(el, {
    className: config.key + '-' + className,
    style,
  })
  let moved = false
  el.addEventListener('pointerdown', e => {
    const { clientX, clientY } = e
    const { offsetLeft, offsetTop } = el
    moved = false
    const pinToEdge = () => {
      const rect = container.getBoundingClientRect()
      const { offsetLeft, offsetWidth, offsetTop, offsetHeight } = el
      el.style.transition = 'left 0.3s, top 0.3s'
      const threshold = 20
      if (offsetLeft < threshold) el.style.left = '0px'
      if (offsetTop < threshold) el.style.top = '0px'
      if (offsetLeft + offsetWidth > rect.width - threshold) el.style.left = rect.width - offsetWidth + 'px'
      if (offsetTop + offsetHeight > rect.height - threshold) el.style.top = rect.height - offsetHeight + 'px'
      setTimeout(() => {
        el.style.transition = ''
      }, 300)
    }
    const onMouseMove = (e) => {
      moved = true
      const dx = e.clientX - clientX
      const dy = e.clientY - clientY
      Object.assign(el.style, {
        left: offsetLeft + dx + 'px',
        top: offsetTop + dy + 'px',
      })
    }
    const onMouseUp = (e) => {
      document.removeEventListener('pointermove', onMouseMove)
      document.removeEventListener('pointerup', onMouseUp)
      if (pin) pinToEdge()
    }
    document.addEventListener('pointermove', onMouseMove)
    document.addEventListener('pointerup', onMouseUp)
  })

  el.addEventListener('click', (e) => {
    if (moved) e.stopPropagation()
  }, true)
  container.appendChild(el)
}
