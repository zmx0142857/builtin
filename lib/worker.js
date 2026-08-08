export const importWorker = (worker) => {
  const callbacks = {}
  let id = 0
  worker.addEventListener('message', e => {
    // console.log('[main]', e.data)
    const { res, err, id } = e.data
    const fn = callbacks[id]
    if (fn) {
      if (err) fn.reject(err)
      else fn.resolve(res)
    }
  })
  worker.addEventListener('error', console.error)
  return new Proxy({}, {
    get(obj, key) {
      return (...args) => new Promise((resolve, reject) => {
        callbacks[id] = { resolve, reject }
        worker.postMessage({ key, args, id: id++ })
      })
    },
  })
}

export const exportWorker = (obj) => {
  self.addEventListener('message', async e => {
    // console.log('[worker]', e.data)
    const { key, args, id } = e.data
    if (obj[key]) {
      // console.time('[worker] ' + key)
      try {
        const res = await obj[key](...args)
        self.postMessage({ key, res, id })
      } catch (err) {
        self.postMessage({ key, err, id })
      }
      // console.timeEnd('[worker] ' + key)
    }
  })
}

const header = `const exports = (obj) => {
  self.addEventListener('message', async e => {
    console.log('[worker]', e.data)
    const { key, args, id } = e.data
    if (typeof obj[key] === 'function') {
      const res = await obj[key](...args)
      self.postMessage({ key, res, id })
    }
  })
}
`

/**
 * 创建 worker 线程
 * @param {string} src 源码
 * @param {object} options
 * @param {'classic' | 'module'} options.type
 * @param {'omit' | 'same-origin' | 'include'} options.credentials
 * @param {string} options.name
 */
const createWorker = (src, options) => {
  const worker = new Worker(
    window.URL.createObjectURL(
      new Blob([header + src])
    ),
    options
  )
  worker.proxy = proxyWorker(worker)
  return worker
}

export default createWorker
