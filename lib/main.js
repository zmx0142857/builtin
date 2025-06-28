var window = globalThis

// 1. should be on Array

/**
 * 生成数组. 特别 `range(5)` 相当于 `range(0, 5)`
 * @param {number} start 第一个数
 * @param {number | undefined | ((v: number) => any)} stop 最后一个数 (不含)
 * @param {number} step 步长, 默认 1
 * @returns {any[]}
 * @example
 * ```
 * range(5) => [0, 1, 2, 3, 4]
 * range(0, 5) => [0, 1, 2, 3, 4]
 * range(5, 0, -1) => [5, 4, 3, 2, 1]
 * range(5, i => i**2) => [0, 1, 4, 9, 16]
 * ```
 */
export const range = (start, stop, step = 1) => {
  // Array.from({ length }, fn) 相当于 new Array(length).fill().map(fn)
  if (typeof stop === 'function') return Array.from({ length: start }, (_, i) => stop(i))
  if (stop === undefined) {
    stop = start
    start = 0
  }
  return range((stop - start) / step | 0, i => start + step * i)
}

/**
 * 将数组或字符串切片为长度 n 的小段
 * @param {any[] | string} arr 数组或字符串
 * @param {number} n 切片长度
 * @returns {(any[] | string)[]}
 */
export const chunk = (arr, n) => {
  const res = []
  for (let i = 0; i < arr.length; i += n) {
    res.push(arr.slice(i, i + n))
  }
  return res
}

/**
 * 数组去重. 另一种写法是
 * ```js
 * arr.filter((item, i, self) => self.indexOf(item) === i)
 * ```
 */
export const uniq = (arr) => {
  return [...new Set(arr)]
}

export const groupby = (arr, getKey) => {
  const res = {}
  arr.forEach(item => {
    const key = getKey(item)
    res[key] = res[key] || []
    res[key].push(item)
  })
  return res
}

// 2. should be on Object

/**
 * 按路径取出属性
 * @example
 * ```js
 * const obj = { a: { b: [1, 2, 3] } }
 * get(obj, 'a.b.length') // 3
 * get(obj, 'a.c.length') // undefined
 * ```
 */
export const get = (obj, path) => {
  return path.split('.').reduce((cur, key) => {
    return cur instanceof Object ? cur[key] : undefined
  }, obj)
}

/**
 * 判断是否为简单对象
 * 还有一种常用方法是 `Object.prototype.toString.call(obj) === '[object Object]'`
 * 但这种方法对 `function Foo() {}; obj = new Foo()` 失效
 * @example
 * ```js
 * function Foo() {}
 * isPlainObject(new Foo()) // false
 * isPlainObject({}) // true
 * isPlainObject(Object.create(null)) // true
 * isPlaingObject([]) // false
 * ```
 */
export const isPlainObject = (obj) => {
  if (!obj) return false
  const proto = Object.getPrototypeOf(obj)
  return proto === null || proto === Object.prototype
}

export const mapEntries = (obj, fn) => {
  return Object.fromEntries(Object.entries(obj).map(fn))
}

/**
 * 遍历 object
 * @param {object} obj 待遍历的对象
 * @param {(value: any, key: string) => void} fn 施加的函数
 */
export const each = (obj, fn) => {
  return Object.entries(obj).forEach(([k, v]) => fn(v, k))
}

/**
 * object 上的 map 操作
 * @param {object} obj 待操作的对象
 * @param {(value: any, key: string) => any} fn 施加的函数
 * @example
 * ```
 * map({ a: 1, b: 2, c: 3 }, v => v + 1) // { a: 2, b: 3, c: 4 }
 * ```
 */
export const map = (obj, fn) => {
  return mapEntries(obj, ([k, v]) => [k, fn(v, k)])
}

/**
 * object 上的 filter 操作
 * @param {object} obj 待操作的对象
 * @param {(value: any, key: string) => boolean} fn 施加的函数
 * @example
 * ```
 * filter({ a: 1, b: 2, c: 3 }, v => v === 2) // { b: 2 }
 * ```
 */
export const filter = (obj, fn) => {
  return Object.fromEntries(Object.entries(obj).filter(([k, v]) => fn(v, k)))
}

/**
 * 挑选 obj 的部分属性, 返回新对象
 * @param {object} obj 待操作的对象
 * @param {string[]} keys 属性列表
 * @example
 * ```
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) // { a: 1, c: 3 }
 * ```
 */
export const pick = (obj, keys) => {
  // return filter(obj, (v, k) => keys.includes(k))
  return Object.fromEntries(keys.map(key => [key, get(obj, key)]))
}

// 3. should be on JSON

/**
 * 解析 JSON
 * @param {string} str 待解析的字符串
 * @param {any} defaultValue 解析失败时的默认值
 * @param {any} options 其它选项
 */
export const parseJson = (str, defaultValue = {}, options) => {
  if (!str) return defaultValue
  try {
    return JSON.parse(str, options) ?? defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * 读取本地存储
 * @param {string} key
 * @param {any} defaultValue
 */
export const getStorage = (key, defaultValue = {}) => {
  return parseJson(localStorage.getItem(key), defaultValue)
}

/**
 * 写入本地存储
 * @param {string} key
 * @param {any} value
 */
export const setStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

/**
 * 更新本地存储
 */
export const updateStorage = async (key, handler, defaultValue = {}) => {
  const value = parseJson(localStorage.getItem(key), defaultValue)
  const newValue = await handler(value)
  localStorage.setItem(key, JSON.stringify(newValue))
  return newValue
}

// 4. should be on Promise

/**
 * 睡眠
 * TIPS: 不要写睡眠排序!
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 5. should be on Function

export const memo = () => {
  const cache = {}
  return function memoed (fn) {
    return async function (...args) {
      const key = JSON.stringify(args)
      cache[key] = cache[key] ?? await fn(...args)
      return cache[key]
    }
  }
}

/**
 * 缓存异步调用结果, fn 应当是纯函数
 * @param {function} fn 一个异步的纯函数
 * @example
 * ```
 * const memoedSqrt = memoed((v) => {
 *    console.log('computing sqrt', v)
 *    return Math.sqrt(v)
 * })
 * await memoedSqrt(2) // console output: computing sqrt 2
 * await memoedSqrt(2) // console output: <empty>
 * ```
 */
export const memoed = (fn) => memo()(fn) // memo 不是纯函数, 它内部创建了一个状态 cache, 因此不能化简为 memoed = memo()


/**
 * 防抖
 * @param {function} fn 回调
 * @param {number} delay 延迟时间
 * @returns {function} 经过防抖处理的函数
 * @example
 * ```
 * const onInput = debounced(function (e) {
 *   // 注意要用 function 而不是箭头函数, 否则不能使用 this
 * })
 * ```
 */
export const debounced = (fn, delay = 500) => {
  let timer
  return function (...args) {
    clearTimeout(timer) // 从头计时
    timer = setTimeout(() => {
      fn.call(this, ...args) // delay 毫秒后执行
    }, delay)
  }
}

/**
 * 更适合 react
 * @example
 * ```
 * const debounced = debounce()
 *
 * const ReactComponent = (props) => {
 *   const onInput = (e) => {
 *     debounced(() => {
 *       console.log(e.target.value)
 *     }, 300, 'onInput')
 *   }
 *   return <input onInput={onInput} />
 * }
 * ```
 */
export const debounce = () => {
  let timers = {}
  return (fn, delay = 500, key = undefined) => {
    clearTimeout(timers[key])
    timers[key] = setTimeout(fn, delay)
  }
}

/**
 * 节流, 用法参考防抖
 * @param {function} fn 回调
 * @param {number} delay 延迟时间
 */
export const throttled = (fn, delay = 500) => {
  let timer
  return function (...args) {
    if (timer) return // is busy
    timer = setTimeout(() => {
      timer = undefined // delay 毫秒后, 移除 busy 状态
    }, delay)
    fn.call(this, ...args)
  }
}

/**
 * 节流, 用法参考防抖
 */
export const throttle = () => {
  let timers = {}
  return function (fn, delay = 500, key = undefined) {
    if (timers[key]) return
    timers[key] = setTimeout(() => {
      timers[key] = undefined
    }, delay)
    fn()
  }
}

/**
 * 什么都不做
 */
export const noop = () => {}

/**
 * 输出等于输入
 */
export const identity = x => x

/**
 * 空对象
 */
export const isNone = x => x === undefined || x === null
export const isEmpty = x => [undefined, null, NaN, ''].includes(x)

// 6. should be on Number

/**
 * 截断, 若 `x` 超出 `[min, max]` 的范围, 则返回边界值
 * @param {number} x
 * @param {number} min
 * @param {number} max
 */
export const between = (x, min, max) => {
  if (x < min) return min
  if (x > max) return max
  return x
}

/**
 * 舍入
 * @example
 * ```
 * round(3.1415926, 2) // 3.14
 * ```
 * 当然另一种写法是 `parseFloat(x.toFixed(2))`
 */
export const round = (x, digits) => {
  const pow = Math.pow(10, digits)
  return Math.round(x * pow) / pow
}

/**
 * 字符串转数字, 不合法的输入将得到 `NaN`
 * 函数可能返回 `Infinity/-Infinity/NaN`, 如果你只想要正常的数字, 请用 `Number.isFinite(x)` 筛选结果
 * ```
 * const arr = [undefined, null, [], '', ' ', '\t', '1,2,3', '0x10', [42]]
 * arr.map(v => Number(v)) // [NaN, 0, 0, 0, 0, 0, NaN, 16, 42]
 * arr.map(v => parseFloat(v)) // [NaN, NaN, NaN, NaN, NaN, NaN, 1, 0, 42]
 * arr.map(v => toNumber(v)) // [NaN, NaN, NaN, NaN, NaN, NaN, NaN, 16, 42]
 * ```
 */
export const toNumber = (x) => {
  const res1 = parseFloat(x)
  const res2 = Number(x)
  if (Number.isNaN(res1) || Number.isNaN(res2)) return NaN
  return res2 || res1
}

// 7. should be on String

export const uid = (len = 16) => {
  return Math.random().toFixed(len).slice(2)
}

/**
 * 相当于 String.prototype.padStart
 * @param {string} x
 * @param {number} len
 * @param {string} str
 */
export const pad = (x, len, str = '0') => {
  return (str.repeat(len) + x).slice(-len)
}

export const matchString = (a = '', b = '', { ignoreCase = true } = {}) => {
  if (ignoreCase) {
    return String(a).toLowerCase().includes(String(b).toLowerCase())
  }
  return a.includes(b)
}

// 8. base64 & file

/**
 * 读取文件
 * @param {Blob | File} blob
 * @param {object} options
 * @param {"string" | "base64" | "bytes"} options.type
 */
export const readFile = async (blob, { type = 'string' }) => {
  if (!blob) return
  return Promise((resolve, reject) => {
    const reader = new window.FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    if (type === 'string') return reader.readAsText(blob)
    if (type === 'base64') return reader.readAsDataURL(blob)
    if (type === 'bytes') return reader.readAsArrayBuffer(blob)
    reject('unknown type: ' + type)
  })
}

export const Base64 = {
  fromBytes (bytes) {
    return window.btoa(String.fromCharCode.apply(null, bytes))
  },
  toBytes (b64) {
    return Uint8Array.from(window.atob(b64), c => c.charCodeAt(0))
  },
  async fromBlob (blob) {
    return readFile(blob, { type: 'base64' })
  },
  toBlob (b64) {
    const arr = b64.split(',')
    if (!arr[1]) arr.unshift('')
    // 从前缀 'data:image/jpeg;base64,' 中识别数据类型
    const type = arr[0].match(/:(.*?);/)[1] || 'image/jpeg'
    const bytes = Base64.toBytes(arr[1])
    return new Blob([bytes], { type })
  },
  fromString (str) {
    return window.btoa(
      window.encodeURIComponent(str)
      .replace(
        /%([0-9A-F]{2})/g,
        (_, $1) => String.fromCharCode('0x' + $1)
      )
    )
  },
  toString (b64) {
    return window.decodeURIComponent(
      window.atob(b64).split('').map(
        c => c.codePointAt(0) >= 0x80
        ? '%' + c.codePointAt(0).toString(16) : c
      ).join('')
    )
  },
}

/**
 * 载入图片
 * @param {string} src
 * @param {object} options
 * @param {string} options.crossOrigin
 * @returns {Promise<HTMLImageElement | undefined>}
 */
export const loadImage = async (src, { crossOrigin = 'Anonymous' } = {}) => {
  if (!src) return
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.src = src
    if (crossOrigin) img.crossOrigin = crossOrigin
    img.onload = () => resolve(img)
    img.onerror = (err) => {
      console.error('load image error: ' + src)
      resolve()
    }
  })
}

/**
 * 压缩图片
 * @param {string} src 原图片地址
 * @param {object} options
 * @param {number} options.width 最大宽度 (px), 默认为原图宽度
 * @param {number} options.height 最大高度 (px), 默认为原图高度
 * @param {boolean} options.keepAspect 是否保持宽高比, 默认 true
 * @param {HTMLCanvasElement?} options.canvas 可选的 canvas 对象
 * @param {"canvas" | "base64" | "blob"} options.type 输出格式, 默认 'canvas'
 * @param {string} options.mime MIME 类型, 默认 'image/jpeg'
 * @param {number} options.quality 压缩质量, 默认 0.8
 * @example
 * ```
 * const url = await compressImage('example.jpg', {
 *   width: 550,
 *   height: 400,
 *   type: 'base64',
 * })
 * ```
 */
export const compressImage = async (src, {
  width,
  height,
  keepAspect = true,
  canvas,
  type = 'canvas',
  mime = 'image/jpeg',
  quality = 0.8
} = {}) => {
  canvas = canvas || document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('[compressImage] ctx is null')
  const img = await loadImage(src)
  width = width || img.width
  height = height || img.height
  if (keepAspect) {
    const k = Math.min(width / img.width, height / img.height)
    width = img.width * k | 0
    height = img.height * k | 0
  }
  canvas.width = width
  canvas.height = height
  ctx.drawImage(img, 0, 0, width, height)

  if (type === 'canvas') return canvas
  if (type === 'base64') return canvas.toDataURL(mime, quality)
  if (type === 'blob') return new Promise(async (resolve) => {
    return canvas.toBlob(resolve, mime, quality)
  })

  throw new Error('[compressImage] unknown type: ' + type)
}

/**
 * 下载文件
 * @param {object} options
 * @param {string} options.url 地址, url 与 blob 必传其一
 * @param {Blob | string} options.blob 文件, url 与 blob 必传其一
 * @param {string} options.filename
 */
export const download = ({ url, blob, filename = 'untitled' }) => {
  if (typeof blob === 'string') blob = new Blob([blob])
  const a = document.createElement('a')
  a.href = url || URL.createObjectURL(blob)
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  if (!url) URL.revokeObjectURL(a.href)
}

/**
 * 上传文件
 */
export const upload = ({ id = 'file-input', multiple = false, accept } = {}) => {
  return new Promise(resolve => {
    const input = document.getElementById(id) || document.createElement('input')
    input.type = 'file'
    input.id = id
    input.style.display = 'none'
    input.multiple = multiple
    input.accept = accept
    input.onclick = () => input.value = null // 清空选中的文件
    input.onchange = () => resolve(input.files)
    document.body.appendChild(input)
    input.click()
  })
}

// 9. 业务中常用的

/**
 * 日期格式化为 YYYY-MM-DD HH:mm:ss (本地时间)
 */
export const formatDate = (date = new Date()) => {
  return new Date(date - date.getTimezoneOffset() * 60000).toISOString().replace(/T/, ' ').slice(0, 19)
}

/**
 * 拆分 url, 用于获取文件名、文件后缀等
 * @example
 * ```js
 * const [filename, filepath] = splitPath('/path/to/1.2.3.jpg').reverse() // ['1.2.3.jpg', '/path/to']
 * const [name, ext] = splitPath(filename, '.') // ['1.2.3', 'jpg']
 * splitPath('http://localhost:3000/?p=1&s=10', '?') => ['http://localhost:3000/', 'p=1&s=10']
 * ```
 */
export const splitPath = (str, sep = '/') => {
  const arr = str.split(sep)
  return arr.length > 1 ? [arr.slice(0, -1).join(sep), ...arr.slice(-1)] : arr
}

/**
 * 拼接 url
 * @example
 * ```
 * joinPath('aaa/', '/bbb/', '/ccc/') => 'aaa/bbb/ccc/'
 * ```
 */
export const joinPath = (...urls) => {
  return urls.join('/').replace(/\/+/g, '/')
}

/**
 * 将 object 编码到 url 中.
 * 默认情况下, undefined 的值被忽略, 不会被编码
 * @example
 * ```
 * encodeParams({a:1, b:2, c:undefined, d:null}) => 'a=1&b=2'
 * ```
 * TIP: 浏览器还提供了 URLSearchParams 的 API
 */
export const encodeParams = (params, { encode = window.encodeURIComponent, discard = isNone } = {}) => {
  if (!params) return ''
  return Object.entries(params)
    .filter(([k, v]) => !discard(v))
    .map(([k, v]) => encode(k) + '=' + encode(v))
    .join('&')
}

/**
 * @example
 * ```
 * decodeParams('a=1&b=2') => {a: 1, b: 2}
 * ```
 */
export const decodeParams = (query = '', { decode = window.decodeURIComponent } = {}) => {
  return Object.fromEntries(query.split('&')
    .map(pair => pair.split('=').map(v => decode(v)))
  )
}

/**
 * 用于在请求接口前清理参数
 * 1. 去掉字符串前后空白符
 * 2. 过滤 `NaN`, `''`,  `null` 和 `undefined`
 * @example
 * ```
 * cleanParams({a: 1, b: '  ', c: undefined, d: null, e: 0}) // {a: 1, e: 0}
 * ```
 */
export const cleanParams = (params = {}, { trim = true, discard = isEmpty } = {}) => {
  const res = {}
  Object.keys(params).forEach(key => {
    let value = params[key]
    if (trim && typeof value === 'string') {
      value = value.trim()
    }
    if (!discard(value)) {
      res[key] = value
    }
  })
  return res
}

export const createFormData = (params = {}, { discard = isNone } = {}) => {
  const formData = new FormData()
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v.forEach(item => formData.append(k, item))
    } else if (!discard(v)) {
      formData.append(k, v)
    }
  })
  return formData
}

/**
 * @typedef {{ label: string, value: number | string }} LabelValue
 */

/**
 * 构造枚举对象
 * @template {object} I
 * @param {I} input
 * @returns {{
 *   enum: { [key in keyof I]: number | string },
 *   dict: { [key in string]: LabelValue },
 *   options: LabelValue[],
 * }}
 * @example
 * ```
 * const todoStatus = createEnum({
 *  todo: { label: '未完成', color: 'red', value: 0 },
 *  done: { label: '已完成', color: 'green', value: 1 },
 * })
 * ```
 */
export const createEnum = (input) => {
  return {
    enum: mapEntries(input, ([k, v]) => [k, v.value]),
    dict: mapEntries(input, ([k, v]) => [v.value, v]),
    options: Object.values(input),
  }
}

/**
 * 创建数据存储, 亦可用于函数缓存
 * @example
 * ```
 * const [store, clearStore] = createStore()
 * const fetchProductData = async (params) => {
 *   const key = JSON.stringify(params)
 *   store.product = store.product || {}
 *   const data = store.product[key]
 *   if (data) return data
 *   const { status, data } = await api(params)
 *   if (status === 0) {
 *     store.product[key] = data
 *     return data
 *   }
 *   return []
 * }
 * ```
 */
export const createStore = () => {
  const store = {}
  const clearStore = () => {
    Object.keys(store).forEach(key => {
      delete store[key]
    })
  }
  return [store, clearStore]
}

/**
 * @typedef {{ label?: string, value?: string, page?: number, size?: number }} FetchParams
 * @typedef {{ status: number, data: object[], total: number, desc?: string }} FetchReturns
 * @param {string} name
 * @param {{ [k in string]: object }[]} dataSource
 * @param {object} options
 * @param {string} options.labelKey
 * @param {string} options.valueKey
 * @param {number} options.delay
 * @returns {(params: FetchParams) => Promise<FetchReturns>}
 */
export const createMock = (name, dataSource, { labelKey = 'label', valueKey = 'value', delay = 100 } = {}) => {
  /**
   * @param {FetchParams} params
   * @returns {Promise<FetchReturns>}
   */
  const fetch = async (params = {}) => {
    const { label = '', value = '', page = 1, size = 10 } = params
    await sleep(delay)
    const filteredList = value
      ? dataSource.filter(v => {
        const a = v[valueKey] ?? ''
        return a === value || typeof a === 'string' && matchString(a, value)
      })
      : dataSource.filter(v => {
        const a = v[labelKey] ?? ''
        return a === value || typeof a === 'string' && matchString(a, label.trim())
      })
    const data = filteredList.slice(size * (page - 1), size * page)
    const res = { status: 0, data, total: filteredList.length }
    console.log('[createMock]', name, params, res)
    return res
  }
  return fetch
}

const fetchDebounce = debounce()
/**
 * @typedef {(params: object) => Promise<FetchReturns>} ApiFunc
 * @param {ApiFunc & { isFetch?: boolean }} api
 * @param {{
 *   mapParams?: (params: FetchParams) => object
 *   mapList?: (params: object) => object
 *   debounce?: number
 * }} options
 * @example
 * ```
 * const dataSource = [
 *   { name: 'aaa', id: 1 },
 *   { name: 'bbb', id: 2 },
 *   { name: 'ccc', id: 3 },
 *   { name: 'abc', id: 4 },
 *   { name: 'cba', id: 5 },
 * ]
 * const mockData = async ({ name }) => {
 *   await sleep(500)
 *   const data = dataSource.filter(v => v.name.includes(name))
 *   return {
 *     status: 0,
 *     data,
 *     total: data.length,
 *     desc: 'success',
 *   }
 * }
 * const fetchData = createFetch(mockData, {
 *   label: 'name',
 *   value: 'id',
 * })
 *
 * fetchData({ label: 'a' }) =>
 * {
 *   status: 0,
 *   data: Array(3),
 *   total: 3,
 *   desc: 'success'
 * }
 * ```
 */
export const createFetch = (api, { label, value, mapParams, mapList, debounce = 0, onLoading, onError } = {}) => {
  if (typeof api === 'function' && api.isFetch) return api

  if (label && value) {
    mapParams = mapParams || ((params) => ({
      ...params,
      [params[label]]: params.label,
      [params[value]]: params.value
    }))
    mapList = mapList || ((item) => ({
      ...item,
      label: item[label],
      value: item[value],
    }))
  }

  const run = async (params, defaultValue) => {
    try {
      if (!api) throw new Error('api is not defined')
      params = mapParams ? mapParams(params) : params
      return api(params)
    } catch (err) {
      console.error(err)
    }
    return defaultValue
  }

  const fetch = async (params) => {
    let res = { status: -1, data: [], total: 0, desc: '网络异常' }
    onLoading?.(true)
    // 以 value 进行搜索时不必 debounce
    if (debounce && !params.value) {
      res = await new Promise(resolve => {
        fetchDebounce(() => resolve(run(params, res)))
      })
    } else {
      res = await run(params, res)
    }
    onLoading?.(false)
    if (res.status === 0) {
      res.data = mapList ? res.data.map(mapList) : res.data
      return res
    } else {
      onError?.(res.desc)
    }
    return res
  }

  fetch.isFetch = true
  return fetch
}

// 10. 实用工具类

/**
 * 创建移动端分页器.
 *
 * 注意, mapParams 和 mapList 等是 fetch 的功能, 而不是 pager 的功能
 * @example
 * ```
 * {
 *   // page init
 *   onLoad () {
 *     this.productPager = new Pager(listProducts)
 *     this.listProduct()
 *   },
 *   // save api result to page state
 *   async listProduct (params) {
 *     const products = await this.productPager.list(params)
 *     this.setData({ products })
 *   },
 *   // user input on searchbar
 *   onSearchProduct: throttled(async function (e = {}) {
 *     this.setData({ productsTop: 0 })
 *     this.productPager.reset()
 *     return this.listProduct({ label: e.detail })
 *   }),
 *   // scroll to lower
 *   onNextProduct: throttled(async function () {
 *     if (this.productPager.next()) {
 *       return this.listProduct()
 *     } else {
 *       toast('没有更多了')
 *     }
 *   }),
 *   // refresh
 *   onResetProduct: async function () {
 *     return this.onSearchProduct()
 *   },
 * }
 * ```
 */
export class Pager {
  constructor (fetch, { size = 10 } = {}) {
    this.fetch = fetch
    this.data = []
    this.page = 1
    this.size = size
    this.total = 0
    this.label = undefined
  }

  reset () {
    this.page = 1
    this.label = undefined
  }

  next () {
    const shouldRequest = this.data.length < this.total
    if (shouldRequest) this.page += 1
    return shouldRequest
  }

  async list ({ label }) {
    this.label = label
    const { status, data, total } = await this.fetch({ label, page: this.page, size: this.size })
    if (status === 0) {
      this.total = total
      if (this.page === 1) {
        this.data = data
      } else {
        this.data = this.data.concat(data)
      }
    }
    return this.data
  }
}

/**
 * @example
 * ```
 * const treeUtils = new TreeUtils()
 * const addNode = (key, name) => {
 *   setTree(tree => treeUtils.add(tree, v => v.key === key && {
 *     key: uid(),
 *     name,
 *   }))
 * }
 * const deleteNode = (key) => {
 *   setTree(tree => treeUtils.delete(tree, v => v.key === key))
 * }
 * const editNode = (key, name) => {
 *   setTree(tree => treeUtils.map(tree, v => v.key === key ? {
 *     ...v,
 *     name,
 *   } : v))
 * }
 * const findNode = (key) => {
 *   return treeUtils.find(tree, v => v.key === key)
 * }
 * ```
 */
export class TreeUtils {
  constructor ({ children = 'children' } = {}) {
    this.children = children
  }

  // 先根遍历, 查找第一个满足条件的节点. path 中保存该节点路径
  find (tree, fn, path = []) {
    let res
    tree?.some((node, i) => {
      path.push(i)
      res = fn(node) ? node : this.find(node[this.children], fn, path)
      if (res) return res
      path.pop()
      return undefined
    })
    return res
  }

  // 先根遍历, 排除掉不满足条件的节点 (即使它的某个子节点满足条件)
  filter (tree, fn) {
    return tree?.map(node => {
      return fn(node) && {
        ...node,
        [this.children]: this.filter(node[this.children], fn)
      }
    })?.filter(Boolean)
  }

  // 后根遍历, 排除掉不满足条件的节点 (此时它的所有子节点也不满足条件)
  search (tree, fn) {
    return tree?.map(node => {
      const children = this.search(node[this.children], fn)
      if (fn(node)) return node
      return children?.length && { ...node, [this.children]: children }
    })?.filter(Boolean)
  }

  // 对每个节点调用一次 fn, 得到一棵新的树
  map (tree, fn) {
    return tree?.map(node => {
      const newNode = fn(node)
      // fn 返回 falsy 值时, 删除这个节点
      if (!newNode) return undefined
      // fn 更新了 children 数组时, 直接返回 newNode 的浅拷贝
      if (newNode[this.children] !== node[this.children]) return { ...newNode }
      // 若 fn 没有更新 children 数组, 则进行递归更新
      return {
        ...newNode,
        [this.children]: this.map(node[this.children], fn)
      }
    })?.filter(Boolean)
  }

  // 对每个节点调用一次 fn, 将新节点 (如果有) 添加到子节点列表中
  add (tree, fn) {
    return this.map(tree, node => {
      const newNode = fn(node)
      return newNode ? {
        ...node,
        [this.children]: (node[this.children] || []).concat(newNode)
      } : node
    })
  }

  // 删除节点. 逻辑正好是 filter 取反
  delete (tree, fn) {
    return this.filter(tree, node => !fn(node))
  }

  // 对所有兄弟节点进行排序
  sort (tree, fn) {
    return this.map(tree, node => ({
      ...node,
      [this.children]: this.sort(node[this.children], fn)
    }))?.sort(fn)
  }

  // 先根遍历
  flat (tree) {
    return tree?.reduce((res, node) => {
      return res.concat(node, this.flat(node[this.children]) || [])
    }, [])
  }
}

// 事件总线
const Bus = () => ({
  events: {},
  add (key, fn) {
    const { events } = this
    events[key] ||= []
    events[key].push(fn)
  },
  remove (key, fn) {
    const { events } = this
    if (fn === 'all') {
      delete events[key]
    } else if (events[key]) {
      events[key] = events[key].filter(v => v !== fn)
    }
  },
  async trigger (key, ...args) {
    const { events } = this
    if (events[key]?.length) {
      return Promise.all(events[key].map(fn => fn(...args)))
    } else {
      console.warn('[bus]: no callback for key: ' + key)
    }
  },
  reset () {
    this.events = {}
  },
})

// dom 操作
export const div = ({ tag = 'div', container = document.body, selector, className, css, style, attr, ...options } = {}) => {
  selector ||= '.' + className
  const dom = container.querySelector(selector) || container.appendChild(document.createElement(tag))
  if (className && !dom.className) dom.className = className
  if (css) div.css(css, className)
  if (style) Object.assign(dom.style, style)
  if (attr) Object.entries(attr).forEach(([k, v]) => dom.setAttribute(k, v))
  return Object.assign(dom, options)
}
div.styles = {}
div.dataName = 'vanilla-ui'
div.css = (css, className, dataName) => {
  if (className && div.styles[className]) return
  div.styles[className] = true
  dataName ||= div.dataName
  const res = div({
    tag: 'style',
    container: document.head,
    selector: `style[data-${dataName}]`,
    attr: { [`data-${dataName}`]: '' }
  })
  res.innerHTML += css.replace(/\n\s+/g, '\n') + '\n'
  return res
}
