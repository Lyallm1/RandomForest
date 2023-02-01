class Counter {
    constructor(arr: any[]) {
        arr.forEach(val => this[val] = (this[val] || 0) + 1)
    }

    *[Symbol.iterator]() {
        for (const key in this)yield [key, this[key]]
    }
}
