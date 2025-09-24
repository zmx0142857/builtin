import * as UI from './ui.js'

window.div = UI.div
window.UI = UI

window.testConsole = () => {
  UI.Console()
  console.log(111)
  console.warn(222)
  console.error(333)
}

window.testToast = () => {
  UI.Toast({
    innerHTML: 'Ciallo~(∩_∩)~',
  })
}

window.testModal = () => {
  UI.Modal({
    innerHTML: 'Modal content',
  })
}

window.testFloat = () => {
  div.css(`body {
    overflow: hidden;
  }`, 'body')
  UI.Float({
    innerHTML: '+',
  })
}

window.testButton = (type) => {
  UI.Button({
    type,
    innerHTML: 'Button',
    onClick: () => {
      testToast()
    }
  })
}

window.testMenu = () => {
  const menu = UI.Menu({
    items: [
      { label: 'Item 1', value: 1 },
      { label: 'Item 2', value: 2 },
      { label: 'Item 3', value: 3 },
    ],
    show: false,
    onSelect: console.log,
  })
  const button = UI.Button({
    innerHTML: 'Menu',
    onDropdown () {
      menu.setShow(true, {
        bodyStyle: {
          left: button.clientLeft + 'px',
          top: (button.clientTop + button.offsetHeight - 2) + 'px',
        }
      })
    },
  })
}

window.testExpand = () => {
  const expand = UI.Expand({
    innerHTML: 'Lorem ipsum maiores nemo laboriosam quisquam! Obcaecati asperiores sed enim adipisci vel consequatur, facere? Laudantium voluptate inventore placeat commodi rerum Corrupti voluptate non excepturi incidunt blanditiis At harum voluptatem possimus',
  })
  let show = false
  const button = UI.Button({
    innerHTML: 'Expand',
    onClick: () => {
      show = !show
      expand.setShow(show)
    },
  })
}

window.testLoading = () => {
  UI.Loading()
}

window.testDraggable = () => {
  div.css(`body {
    overflow: hidden;
  }`, 'body')
  UI.Draggable({
    className: 'draggable',
    css: `& {
      position: absolute;
      width: 100px;
      height: 100px;
      background: #1976d2;
      color: #fff;
      line-height: 100px;
      text-align: center;
      user-select: none;
      cursor: move;
    }`,
    innerHTML: 'Drag',
    snap: 20, // 启用 enableRotate 时无效
    enableScale: true,
    // enableRotate: true,
  })
}

window.testTable = () => {
  const table = UI.Table({
    title: 'Test Table',
    // header: ['Name', 'Age', 'Address'],
    // rows: [
    //   ['John', 30, 'New York'],
    //   ['Jane', 25, 'London'],
    //   ['Bob', 35, 'Paris'],
    // ],
    columns: [
      { label: 'Name', key: 'name' },
      { label: 'Age', key: 'birth', render: birth => 2025 - birth },
      { label: 'Address', key: 'address' },
    ],
    data: [
      { name: 'John', birth: 1995, address: 'New York' },
      { name: 'Jane', birth: 2000, address: 'London' },
      { name: 'Bob', birth: 1990, address: 'Paris' },
    ],
  })
  table.classList.add('col2')
}

window.testTabs = () => {
  UI.div({
    style: {
      padding: '8px',
    },
    children: [
      UI.Tabs({
        items: [
          { key: '1', label: 'Tab 1', innerHTML: 'Content 1' },
          { key: '2', label: 'Tab 2', innerHTML: 'Content 2' },
          { key: '3', label: 'Tab 3', innerHTML: 'Content 3' },
        ],
        onChange: console.log,
      })
    ]
  })
}

window.testProgress = () => {
  return UI.Progress({ autoIncrement: 3 })
}

window.testCanvas = () => {
  const { canvas, ctx, dpr } = UI.Canvas()
  const beginTrans = { x: 0, y: 0, rotate: 0, scale: 1 }
  const endTrans = { x: 0, y: 0, rotate: 0, scale: 1 }
  let frameId, beginTime

  // 线性插值
  const lerp = (x, y, k) => x * (1 - k) + y * k
  // 缓动函数
  const ease = k => Math.sin((k - 0.5) * Math.PI) * 0.5 + 0.5

  // 过渡动画
  const transition = (trans, duration) => {
    if (duration) {
      const loop = (t) => {
        if (beginTime === undefined) {
          beginTime = t
          Object.assign(endTrans, trans)
        }
        const k = (t - beginTime) / duration
        if (k <= 1) {
          Object.keys(trans).forEach(key => {
            trans[key] = lerp(beginTrans[key], endTrans[key], ease(k))
          })
          render(trans, duration)
          frameId = requestAnimationFrame(loop)
        }
      }
      frameId ??= requestAnimationFrame(loop)
    } else {
      cancelAnimationFrame(frameId)
      frameId = undefined
      beginTime = undefined
      Object.assign(beginTrans, trans)
    }
  }

  // 渲染
  const render = (trans, duration) => {
    const { x, y, rotate, scale } = trans
    transition(trans, duration)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(x * dpr, y * dpr)
    ctx.rotate(rotate)
    ctx.scale(scale * dpr, scale * dpr)

    // 绘制矩形与文字
    ctx.fillStyle = '#4399ff'
    ctx.fillRect(0, 0, 100, 100)
    ctx.fillStyle = '#fff'
    ctx.font = '20px Arial'
    ctx.fillText('Drag', 30, 55)

    ctx.restore()
  }

  UI.Draggable({
    el: canvas,
    render,
    sizeInfo () {
      return { w: 100, h: 100 }
    },
    snap: 20, // TODO: canvas snap
    enableScale: true,
    // enableRotate: true,
  })
}

window.testCanvas()
