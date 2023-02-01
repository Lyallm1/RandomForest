import { DecisionTree, RandomForest } from "./woodlands.js"

const trainingData = [
    { a: 0, b: 0, output: 0 }, { a: 0, b: 1, output: 1 }, { a: 1, b: 0, output: 1 }, { a: 1, b: 1, output: 0 }
], testingData = [{ a: 0, b: 0, output: 0 }, { a: 0, b: 1, output: 1 }], dt = new DecisionTree(trainingData, 'output', ['a', 'b'])
console.log(`Single training accuracy: ${dt.evaluate(trainingData)}`)
console.log(`Single test accuracy: ${dt.evaluate(testingData)}`)
console.log(dt.predict({ a: 0, b: 1 }))
const rf = new RandomForest(trainingData, 'output', ['a', 'b'], { numTrees: 100, percentData: 1, percentFeatures: 1 })
console.log('Evaluating forest...')
console.log(JSON.stringify(rf.evaluate(testingData), null, '\t'))
console.log(rf.predictProbability({ a: 0, b: 1 }))
console.log(rf.predictClass({ a: 0, b: 1 }))
