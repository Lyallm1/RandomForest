import _ from 'lodash'
import fs from 'fs'

export function loadCSV(filename: string) {
    const dataset = []
    for (const row in fs.createReadStream(filename)) {
        if (!row) continue
        dataset.push(row)
    }
    return dataset
}
function crossValidationSplit(dataset: any[][], nFolds: number) {
    const datasetSplit = [], datasetCopy = new Array(dataset)
    for (let i = 0; i < nFolds; i++) {
        const fold = []
        while (fold.length < dataset.length / nFolds) fold.push(datasetCopy[Number(_.range(datasetCopy.length))])
        datasetSplit.push(fold)
    }
    return datasetSplit
}
function accuracyMetric(actual: any[][], predicted: any[][]) {
    let correct = 0
    for (const [i, value] of actual.entries()) if (value == predicted[i]) correct++
    return correct * 100 / actual.length
}
function testSplit(index: number, value: number, dataset: any[][]): [any[][], any[][]] {
    const left: any[][] = [], right: any[][] = []
    for (const row of dataset) row[index] < value ? left.push(row) : right.push(row)
    return [left, right]
}
function giniIndex(groups: any[][][], classValues: any[]) {
    let gini = 0
    for (const classValue of classValues) for (const group of groups) {
        const size = group.length
        if (size == 0) continue
        let prop = 0
        for (const row of group) prop += [row[-1]].indexOf(classValue) / size
        gini += prop * (1 - prop)
    }
    return gini
}
function getSplit(dataset: any[][], nFeatures: number) {
    let bIndex = Infinity, bValue = Infinity, bScore = Infinity, bGroups = null
    const features = []
    while (features.length < nFeatures) {
        const index = Number(_.range(dataset[0].length - 1))
        if (!(index in features)) features.push(index)
    }
    for (const index of features) for (const row of dataset) {
        const groups = testSplit(index, row[index], dataset), gini = giniIndex(groups, new Array(new Set(row[-1])))
        if (gini < bScore) [bIndex, bValue, bScore, bGroups] = [index, row[index], gini, groups]
    }
    return new Map([['index', bIndex], ['value', bValue], ['groups', bGroups]])
}
function toTerminal(group: any[][]) {
    const outcomes = []
    for (const row of group) outcomes.push(row[-1])
    return _.maxBy(outcomes, outcomes.indexOf)
}
function split(node: Map<string, any>, maxDepth: number, minSize: number, nFeatures: number, depth: number) {
    const [left, right] = node['groups'] as [any[][], any[][]]
    delete node['groups']
    if (!(left && right)) {
        node['left'] = node['right'] = toTerminal(left.concat(right))
        return
    }
    if (depth >= maxDepth) {
        [node['left'], node['right']] = [toTerminal(left), toTerminal(right)]
        return
    }
    node['left'] = left.length <= minSize ? toTerminal(left) : getSplit(left, nFeatures)
    split(node['left'], maxDepth, minSize, nFeatures, depth + 1)
    node['right'] = right.length <= minSize ? toTerminal(right) : getSplit(right, nFeatures)
    split(node['right'], maxDepth, minSize, nFeatures, depth + 1)
}
function buildTree(train: any[][], maxDepth: number, minSize: number, nFeatures: number) {
    const root = getSplit(train, nFeatures)
    split(root, maxDepth, minSize, nFeatures, 1)
    return root
}
function predict(node: Map<string, any>, row: any[]) {
    return row[node['index']] < node['value'] ? (node['left'] instanceof Map ? predict(node['left'], row) : node['left']) : (node['right'] instanceof Map ? predict(node['right'], row) : node['right'])
}
function baggingPredict(trees: Map<string, any>[], row: any[]) {
    const predictions = []
    for (const tree of trees) predictions.push(predict(tree, row))
    return _.maxBy(predictions, predictions.indexOf)
}
function subsample(dataset: any[][], ratio: number) {
    const sample = []
    while (sample.length < Math.round(dataset.length * ratio)) sample.push(dataset[Number(_.range(dataset.length))])
    return sample
}
export function randomForest(train: any[][], test: any[][], maxDepth: number, minSize: number, sampleSize: number, nTrees: number, nFeatures: number) {
    const forest = []
    for (let i = 0; i < nTrees; i++) for (const row of test) forest.push(baggingPredict([buildTree(subsample(train, sampleSize), maxDepth, minSize, nFeatures)], row))
    return forest
}
export function evaluateAlgorithm(dataset: any[][], algorithm: (trainSet: any[], testSet: any[], ...args: any[]) => any, nFolds: number, ...args: any[]) {
    const folds = crossValidationSplit(dataset, nFolds), scores = []
    for (const fold of folds) {
        const trainSet = new Array(folds), testSet = []
        for (const row of fold) {
            const rowCopy = new Array(row)
            testSet.push(rowCopy)
            rowCopy[-1] = null
            scores.push(accuracyMetric([row[-1]], algorithm(trainSet, testSet, ...args)))
        }
    }
    return scores
}
