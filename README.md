# @hyperswarm/immutable-record

Stateful Immutable record that can reannounce itself and more.

```
npm install immutable-record
```

## Usage

``` js
const ImmutableRecord = require('@hyperswarm/immutable-record')
```

Inserting values in the DHT

``` js
const record = ImmutableRecord.put(dhtNode, Buffer.from('some value'))

// To announce it ~every 15-20 min
// Returns a promise that will resolve when its unannounced
record.announce()

// Call unannounce to stop announcing
// Resolves the promises returned above
record.unannounce()
```

Retrieving them

``` js
const record = ImmutableRecord.get(dhtNode, keyBufferOrHex)

console.log('value is', await record.get())

// Similar to the insertion above you can reinsert this as well
// with the announce/unannounce methods
record.announce()
```

Note that unannounce does not destroy the DHT instance.

## License

MIT
