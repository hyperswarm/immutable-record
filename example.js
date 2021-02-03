const dht = require('@hyperswarm/dht')
const ImmutableRecord = require('./')

if (process.argv[2] === 'put') {
  put()
} else if (process.argv[2] === 'get-and-put') {
  getAndPut()
} else {
  get()
}

async function put () {
  const record = ImmutableRecord.put(dht(), Buffer.from('ImmutableRecord example...'))

  record.on('announced', function () {
    console.log(record.key.toString('hex'), 'is announced')
  })

  // will keep announcing...
  await record.announce()
}

async function get () {
  const record = ImmutableRecord.get(dht(), '6d6fa568a45cba0865ad68b33f8e9dcd189fd88b39e78b6617207bcb91a9697d')

  console.log((await record.get()).toString())
}

async function getAndPut () {
  const record = ImmutableRecord.get(dht(), '6d6fa568a45cba0865ad68b33f8e9dcd189fd88b39e78b6617207bcb91a9697d')

  console.log((await record.get()).toString())

  await record.announce()
}
