const sodium = require('sodium-universal')
const { EventEmitter } = require('events')

const REANNOUNCE = 15 * 60000
const SLACK = 2 * 60000
const MIN_ACKS = 5

module.exports = class ImmutableRecord extends EventEmitter {
  constructor (dht, key = null, val = null) {
    super()

    this.dht = dht
    this.key = key
    this.value = val
    this.announcing = false
    this.announced = false

    this._announceRunning = null
    this._announceStream = null
    this._timeout = null

    if (!this.key) {
      this.key = Buffer.alloc(32)
      sodium.crypto_generichash(this.key, this.value)
    }
  }

  async announce () {
    const wasAnnouncing = this.announcing
    this.announcing = true
    await this._announceRunning
    if (!wasAnnouncing && this.announcing && !this._announceRunning) {
      this._announceRunning = this._announce()
    }
    return this._announceRunning
  }

  unannounce (force = true) {
    if (!this.announcing) return
    this.announcing = false
    if (this._timeout) clearTimeout(this._timeout)
    if (this._timeoutResolve) this._timeoutResolve()
    if (force && this._announceStream) this._announceStream.destroy()
  }

  async _announce () {
    while (this.announcing) {
      await this._announceOnce()
      await this._wait(REANNOUNCE)
      await this._wait((SLACK * Math.random()) | 0)
    }
  }

  async _announceOnce () {
    if (this.value === null) await this.get()

    return new Promise((resolve) => {
      const self = this
      let acks = 0

      this._announceStream = this.dht.immutable.put(this.value, done)

      this._announceStream.on('data', () => {
        if (!this.announced && ++acks >= MIN_ACKS) {
          this.announced = true
          this.emit('announced')
        }
      })

      function done (err) {
        self._announceStream = null
        resolve(!err)
      }
    })
  }

  _wait (n) {
    if (!this.announcing) return

    return new Promise(resolve => {
      const done = () => {
        this._timeout = null
        this._timeoutResolve = null
        resolve()
      }

      this._timeout = setTimeout(done, n)
      this._timeoutResolve = done
    })
  }

  static put (node, val) {
    if (typeof val === 'string') val = Buffer.from(val)
    return new ImmutableRecord(node, null, val)
  }

  static get (node, key) {
    if (typeof key === 'string') key = Buffer.from(key, 'hex')
    return new ImmutableRecord(node, key, null)
  }

  async get () {
    if (this.value) return this.value

    return new Promise((resolve, reject) => {
      this.dht.immutable.get(this.key, (err, val) => {
        if (this.value) return resolve(this.value)
        if (err) return reject(err)
        this.value = val
        resolve(val)
      })
    })
  }
}
