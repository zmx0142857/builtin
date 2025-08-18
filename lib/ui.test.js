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
    snap: 20,
    enableScale: true,
    enableRotate: true,
  })
}
