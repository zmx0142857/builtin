const contentTypeEnum = {
  json: 'application/json',
  form: 'application/x-www-form-urlencoded',
  multipart: 'multipart/form-data',
}
const resTypeEnum = {
  json: 'json',
  text: 'text',
  blob: 'blob',
  arrayBuffer: 'arrayBuffer',
}
const methodEnum = {
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  delete: 'DELETE',
}

/**
 * http 请求封装
 * @example
 * ```
 * // api.js
 * import createHttp from '@zmx0142857/builtin/lib/http.js'
 *
 * const http = createHttp({
 *   baseUrl: 'http://localhost:3000',
 *   isSuccess (res) {
 *     return res.statusCode === 0
 *   },
 *   // onSuccess,
 *   // onFail,
 *   // onProgress,
 *   // before,
 *   // after,
 * })
 * http.headers = {
 *   'Accept': http.enum.contentType.json,
 *   'Authorization': 'Bearer mytoken',
 *   'Content-Type': http.enum.contentType.json,
 * }
 * // http.fetch = http.fetchByXhr
 *
 * const api = {
 *   listUsers: http.get('/api/user/list', { cached: true }),
 *   addUser: http.post('/api/user/add'),
 *   updateUser: http.put('/api/user/update'),
 *   deleteUser: http.delete('/api/user/delete'),
 *   oldUserForm: http.form('/api/user/old'),
 *   uploadFile: http.upload('/api/file/upload'),
 *   getUserById: http.get('/api/user/:userId'),
 * }
 *
 * export default api
 * ```
 */
const createHttp = (props) => ({
  tag: '[http]',
  baseUrl: '/',
  headers: {
    'Accept': contentTypeEnum.json,
    'Authorization': 'Bearer token',
    'Content-Type': contentTypeEnum.json,
  },
  enum: {
    contentType: contentTypeEnum,
    resType: resTypeEnum,
    method: methodEnum,
  },
  cache: {},
  // 初始化 http 实例时调用
  onLoad () {

  },
  // 销毁 http 实例时调用
  onUnLoad () {
    this.cache = {}
  },
  // 判断请求是否成功
  isSuccess (res) {
    return res.status === 0
  },
  // 请求成功的回调
  onSuccess () {

  },
  // 请求失败的回调
  onFail ({ url, params, res }) {
    console.log(this.tag, url, params)
    console.error(res)
  },
  // 请求进度回调
  onProgress (e) {
    // console.log(e.loaded + '/' + e.total)
  },
  /**
   * 处理请求参数/请求头. 你可以一开始就把 token 放在 http.headers 里面, 也可以每次请求时在此带上 token:
   * @example
   * ```
   * req.headers.Authorization = 'Bearer token'
   * return req
   * ```
   */
  async before (req) {
    return req
  },
  /**
   * 默认实现是基于 fetch api 的, 也可以改为 fetchByWx 或者 fetchByXhr
   */
  async fetch (url, req) {
    return window.fetch(url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    })
  },
  async fetchByWx (url, req) {
    return new Promise((success, fail) => window.wx.request({
      url,
      method: req.method,
      header: req.headers,
      data: req.body,
      success,
      fail,
    }))
  },
  async fetchByXhr (url, req = {}) {
    const { method = 'GET', body, headers = {}, onProgress, resType = '' } = req
    return new Promise((resolve, reject) => {
      const xhr = new window.XMLHttpRequest()
      xhr.responseType = resType.toLowerCase()
      xhr.open(method, url)
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))
      xhr.onprogress = onProgress // xhr.readyState === 3
      xhr.onload = () => { // xhr.readyState === 4
        xhr.text = async () => xhr.responseText
        xhr.json = async () => JSON.parse(xhr.responseText)
        xhr.blob = async () => xhr.response
        xhr.arrayBuffer = async () => xhr.response
        resolve(xhr)
      }
      xhr.send(body)
      xhr.onerror = reject
    })
  },
  // 处理响应数据
  async after (raw, type) {
    return this.toRes(raw, type)
  },
  // 将对象转为字符串参数
  toQueryString (params) {
    return new window.URLSearchParams(params).toString()
  },
  // 将对象转为 formdata
  toFormData (params) {
    const buffer = new window.FormData()
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => {
          if (v !== undefined && v !== null) buffer.append(key, v)
        })
      } else {
        buffer.append(key, value)
      }
    })
    return {
      // web 端无需设置 contentType, 浏览器会自动生成 boundary;
      // 小程序端需要一个 formData 的库如 wx-form-data
      // 这个库会为我们生成 contentType = 'multipart/form-data; boundary=wxmpFormBoundary' + randString()
      contentType: undefined,
      buffer,
    }
  },
  // 拼接 url
  join (base, url) {
    if (base.endsWith('/') && url.startsWith('/')) return base + url.slice(1)
    return base + url
  },
  // 清理请求参数
  clean (params) {
    const res = Object.create(null)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) res[key] = value
    })
    return res
  },
  // 处理响应数据 (由 http.after 调用)
  async toRes (raw, type) {
    if (type === resTypeEnum.json) {
      const json = await raw.json()
      return Object.assign(Object.create(null), json)
    }
    if (type === resTypeEnum.text) return raw.text()
    if (type === resTypeEnum.blob) return raw.blob()
    if (type === resTypeEnum.arrayBuffer) return raw.arrayBuffer()
    return raw
  },
  /**
   * 发起请求
   * @param {string} url 请求地址
   * @param {object} params 请求参数
   * @param {object} options 选项
   * @param {'GET' | 'POST' | 'PUT' | 'DELETE'} options.method 请求方法
   * @param {string} options.baseUrl 基地址
   * @param {object} options.headers 请求头
   * @param {function} options.isSuccess 判断请求是否成功
   * @param {function} options.onSuccess 请求成功回调
   * @param {function} options.onFail 请求失败回调
   * @param {function} options.onProgress 进度回调 (仅支持 xhr)
   * @param {function} options.before 处理请求参数和请求头
   * @param {function} options.after 处理响应数据
   * @param {'json' | 'text' | 'blob'} options.resType 响应数据类型
   * @param {boolean} options.cached 是否缓存 (仅支持 GET 请求) true: 读取缓存, false: 强制更新缓存, undefined: 不缓存
   * @param {object} options.cancel 是否忽略请求的响应, 注意: 并不能收回 http 请求
   * @returns {Promise<object>} res
   */
  async request (url = '', params = {}, {
    method = methodEnum.get,
    baseUrl,
    headers,
    isSuccess,
    onSuccess,
    onFail,
    onProgress,
    before,
    after,
    resType = resTypeEnum.json,
    cached,
    cancel = { value: false },
  } = {}) {
    const cancelRequest = () => throw new Error(this.tag + ' request canceled')
    if (cancel.value) cancelRequest()

    before ||= this.before
    after ||= this.after
    isSuccess ||= this.isSuccess
    onSuccess ||= this.onSuccess
    onProgress ||= this.onProgress
    onFail ||= this.onFail
    headers = { ...this.headers, ...headers }
    params = this.clean(params)

    // base url
    url = this.join(baseUrl || this.baseUrl, url)
    // url params
    url = url.replace(/:([a-zA-Z]+)/g, (_, key) => {
      const res = params[key]
      delete params[key]
      return res
    })

    // query/body params
    let body
    if (method === methodEnum.get) {
      const str = this.toQueryString(params)
      const seperator = !str ? '' : url.includes('?') ? '&' : '?'
      url += seperator + str
      // 读写缓存
      if (cached) {
        const cache = this.cache[url]
        if (cache) {
          const data = { url, params, res: cache }
          onSuccess.call(this, data)
          return cache
        }
      } else if (cached === false) {
        delete this.cache[url]
      }
    } else {
      const contentType = headers['Content-Type']
      if (contentType === contentTypeEnum.json) {
        body = JSON.stringify(params)
      } else if (contentType === contentTypeEnum.multipart) {
        const { contentType, buffer } = this.toFormData(params)
        if (contentType) {
          headers['Content-Type'] = contentType
        } else {
          delete headers['Content-Type']
        }
        body = buffer
      } else if (contentType === contentTypeEnum.form) {
        body = this.toQueryString(params)
      } else {
        body = params
      }
    }

    const data = { url, params }
    try {
      const req = await before.call(this, { url, params, method, headers, body })
      if (cancel.value) cancelRequest()
      req.onProgress = onProgress
      req.resType = resType
      const raw = await this.fetch(url, req)
      if (cancel.value) cancelRequest()
      data.res = raw
      data.res = await after.call(this, raw, resType)
      if (cancel.value) cancelRequest()
      if (raw.status >= 400 || !isSuccess.call(this, data.res)) {
        return onFail.call(this, data)
      }
    } catch (err) {
      data.res = err
      return onFail.call(this, data)
    }

    onSuccess.call(this, data)
    if (cached !== undefined && method === methodEnum.get) {
      this.cache[url] = data.res
    }
    return data.res
  },
  /**
   * request 语法糖
   * 优先级 options > config > global (例如 http.baseUrl, http.headers 就是 global 配置)
   */
  sugar (url, config) {
    return (params, options) => this.request(url, params, { ...config, ...options })
  },
  get (url, config) {
    return this.sugar(url, { ...config, method: methodEnum.get })
  },
  post (url, config) {
    return this.sugar(url, { ...config, method: methodEnum.post })
  },
  put (url, config) {
    return this.sugar(url, { ...config, method: methodEnum.put })
  },
  delete (url, config) {
    return this.sugar(url, { ...config, method: methodEnum.delete })
  },
  form (url, config) {
    const headers = { 'Content-Type': contentTypeEnum.form }
    return this.sugar(url, { ...config, method: methodEnum.post, headers })
  },
  upload (url, config) {
    const headers = { 'Content-Type': contentTypeEnum.multipart }
    return this.sugar(url, { ...config, method: methodEnum.post, headers })
  },
  ...props,
})

export default createHttp
