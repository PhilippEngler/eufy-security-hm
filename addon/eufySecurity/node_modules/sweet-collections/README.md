# Sweet Collections

![Build](https://github.com/bacali95/sweet-collections/workflows/Build/badge.svg)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
![Coverage](coverage/badge.svg)
[![npm version](https://badge.fury.io/js/sweet-collections.svg)](https://badge.fury.io/js/sweet-collections)

Typescript implementations of in-memory cache data-structures for Node and Browser. These data-structures are:

-   **LruMap**: A fixed size `Map` which removes the least recently used entry.
-   **LruSet**: A fixed size `Set` which removes the least recently used entry. (Backed by a `LruMap`)
-   **LfuMap**: A fixed size `Map` which removes the least frequently used entry.
-   **LfuSet**: A fixed size `Set` which removes the least frequently used entry. (Backed by a `LfuMap`)
-   **SortedArray**: An `Array` that stays sorted after any modification.
-   **SortedMap**: A `Map` with entries stays sorted by key after any modification. (Backed by a `SortedArray`)
-   **SortedSet**: A `Set` with entries stays sorted after any modification. (Backed by a `SortedArray`)
-   **Heap**: A collection that have always the largest, smallest or most relevent value
    on top.

## Install

```sh
npm install --save sweet-collections
```

or

```sh
yarn add sweet-collections
```

## Documentation

### LruMap

```Typescript
import { LruMap } from 'sweet-collections';

const map = new LruMap<number, number>(3);
map.set(1, 1);
map.set(2, 2);
map.set(3, 3);              // least recent used: 1
console.log(map.has(1))     // true, least recent used: 2
console.log(map.get(2))     // 1, least recent used: 3

map.set(4, 4);
console.log(map.has(3))     // false
console.log(map.get(3))     // undefined

console.log(map.isFull())   // true
map.delete(1);
console.log(map.size)       // 2

map.clear();
console.log(map.size)       // 0
```

### LruSet

```Typescript
import { LruSet } from 'sweet-collections';

const set = new LruSet<number>(3);
set.add(1);
set.add(2);
set.add(3);                 // least recent used: 1
console.log(set.has(1))     // true, least recent used: 2

set.add(4);
console.log(set.has(2))     // false

console.log(set.isFull())   // true
set.delete(1);
console.log(set.size)       // 2

set.clear();
console.log(set.size)       // 0
```

### LfuMap

```Typescript
import { LfuMap } from 'sweet-collections';

const map = new LfuMap<number, number>(3);
map.set(1, 1);
map.set(2, 2);
map.set(3, 3);              // least frequently used: 1
console.log(map.has(1))     // true, least frequently used: 2
console.log(map.get(2))     // 1, least frequently used: 3

map.set(4, 4);
console.log(map.has(3))     // false
console.log(map.get(3))     // undefined

console.log(map.isFull())   // true
map.delete(1);
console.log(map.size)       // 2

map.clear();
console.log(map.size)       // 0
```

### LruSet

```Typescript
import { LruSet } from 'sweet-collections';

const set = new LruSet<number>(3);
set.add(1);
set.add(2);
set.add(3);                 // least frequently used: 1
console.log(set.has(1))     // true, least frequently used: 2
console.log(set.has(2))     // true, least frequently used: 3

set.add(4);
console.log(set.has(3))     // false

console.log(set.isFull())   // true
set.delete(1);
console.log(set.size)       // 2

set.clear();
console.log(set.size)       // 0
```

### SortedArray

```Typescript
import { SortedArray } from 'sweet-collections';

// Increasing order sorted array
const array = new SortedArray<number>((a: number, b: number) => a - b);
array.push(4);
array.push(1);
array.push(2);
array.push(3);
array.push(5);
console.log(array.toArray());       // [1, 2, 3, 4, 5]
console.log(array.get(2));          // 3
console.log(array.get(4));          // 5
console.log(array.length);          // 5

array.delete(4);
console.log(array.toArray());       // [1, 2, 3, 5]
console.log(array.includes(4));     // false

array.push(1);
console.log(array.toArray());       // [1, 1, 2, 3, 5]
console.log(array.count(1));        // 2
console.log(array.firstIndexOf(1)); // 0
console.log(array.lastIndexOf(1));  // 1

console.log(array.shift());         // 1
console.log(array.pop());           // 1
console.log(array.min());           // 1
console.log(array.max());           // 3
console.log(array.toArray());       // [1, 2, 3]
```

### SortedMap

```Typescript
import { SortedMap } from 'sweet-collections';

// Increasing order sorted map
const map = new SortedMap<number, string>((a: number, b: number) => a - b);
map.set(3, 'c');
map.set(2, 'd');
map.set(5, 'a');
map.set(4, 'b');
map.set(1, 'e');
console.log([...map.keys()]);       // [1, 2, 3, 4, 5]
console.log([...map.values()]);     // ["e", "d", "c", "b", "a"]
console.log(map.get(2));            // "d"
console.log(map.get(4));            // "b"
console.log(map.size);              // 5

map.delete(4);
console.log([...map.keys()]);       // [1, 2, 3, 5]
console.log([...map.values()]);     // ["e", "d", "c", "a"]
console.log(map.has(4));            // false
```

### SortedSet

```Typescript
import { SortedSet } from 'sweet-collections';

// Increasing order sorted set
const set = new SortedSet<number>((a: number, b: number) => a - b);
set.add(3);
set.add(2);
set.add(5);
set.add(4);
set.add(1);
console.log([...set.keys()]);       // [1, 2, 3, 4, 5]
console.log(set.has(2));            // true
console.log(set.has(4));            // true
console.log(set.size);              // 5

set.delete(4);
console.log([...set.keys()]);       // [1, 2, 3, 5]
console.log(set.has(4));            // false
```

### Heap

```Typescript
import { Heap } from 'sweet-collections';

// Heap with the maximum value on top
const set = new Heap<number>((a: number, b: number) => a > b);
set.push(3);
set.push(2);
set.push(5);
set.push(4);
set.push(1);
console.log(set.peek());        // 5
console.log(set.pop());         // 5
console.log(set.peek());        // 4
console.log(set.replace(0));    // 4
console.log(set.peek());        // 3
```

## Author

👤 **Nasreddine Bac Ali**

-   Website: [nasreddinebacali.info](https://nasreddinebacali.info)
-   Github: [@bacali95](https://github.com/bacali95)
-   LinkedIn: [@bacali](https://linkedin.com/in/bacali)

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2020 [Nasreddine Bac Ali](https://github.com/bacali95).
This project is [ISC](https://github.com/bacali95/sweet-collections/blob/master/LICENSE) licensed.
