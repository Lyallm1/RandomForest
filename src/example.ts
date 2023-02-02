import { evaluateAlgorithm, loadCSV, randomForest } from './woodlands.js'

for (const nTrees of [1, 10, 50, 100]) {
    const scores = evaluateAlgorithm(loadCSV('data/small_result.csv'), randomForest, 5, 10, 1, 1, nTrees, 27)
    console.log(`Trees: ${nTrees}, Scores: ${scores}`)
    console.log(`Mean accuracy: ${scores.reduce((a, b) => a + b, 0) / scores.length}`)
}
