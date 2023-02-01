import _ from 'lodash'

function randomTag() {
    return `_r${Math.round(Math.random() * 1000000)}`
}
function mostCommon(l: any[]) {
    return _.sortBy(l, a => _.filter(l, b => b == a)).reverse()[0]
}
function entropy(vals: any[]) {
    return _.uniq(vals).map(x => _.filter(vals, val => val == x).length / vals.length).map(p => -p * Math.log2(p)).reduce((a, b) => a + b, 0)
}
function gain(_s: any[], target: string, feature: string) {
    return entropy(_.map(_s, target)) - _.uniq(_.map(_s, feature)).map(n => {
        const subset = _s.filter(x => x[feature] == n)
        return subset.length * entropy(_.map(subset, target)) / _.size(_s)
    }).reduce((a, b) => a + b, 0)
}
function createTree(_s: any[], target: string, features: string[]): { type: 'result' | 'feature', val?: any, vals?: any[], name: string, alias: string } {
    const targets = _.uniq(_.map(_s, target)), topTarget = mostCommon(targets), bestFeature = _.maxBy(features, e => gain(_s, target, e)), possibleValues = _.uniq(_.map(_s, bestFeature))
    if (targets.length == 1) return { type: 'result', val: targets[0], name: targets[0], alias: targets[0] + randomTag() }
    if (features.length == 0 || possibleValues.length == 1) return { type: 'result', val: topTarget, name: topTarget, alias: topTarget + randomTag() }
    return { name: bestFeature, alias: bestFeature + randomTag(), type: 'feature', vals: _.map(possibleValues, v => ({
        name: v, alias: v + randomTag(), type: 'feature_value', child: createTree(_s.filter(x => x[bestFeature] == v), target, _.without(features, bestFeature))
    })) }
}

export class DecisionTree {
    data: any[]
    model = createTree([], '', [])

    constructor(_s: any[], public target: string, public features: string[]) {
        this.data = _s
        this.model = createTree(_s, target, features)
    }

    predict(sample: { a: number, b: number, output?: number }) {
        let root = this.model
        while (root.type != 'result') {
            const childNode = _.find(root.vals, x => x.name == sample[root.name])
            root = childNode ? childNode.child : root.vals[0].child
        }
        return root.val
    }

    evaluate(samples: { a: number, b: number, output: number }[]) {
        let total = 0, correct = 0
        _.each(samples, s => {
            total++
            if (this.predict(s) == s[this.target]) correct++
        })
        return correct / total
    }

    featureImportance() {
        const r = {}
        for (const feature of this.features) r[feature] = gain(this.data, this.target, feature)
        return r
    }

    toJSON() {
        return this.model
    }
}
export class RandomForest {
    numTrees: number
    percentData: number
    percentFeatures: number
    verbose: boolean
    data: { a: number, b: number, output: number }[]
    features: string[]
    trees: DecisionTree[] = []

    constructor(_s: { a: number, b: number, output: number }[], public target: string, features: string[], opts: { numTrees: number, percentData: number, percentFeatures: number, verbose?: boolean }) {
        this.numTrees = opts.numTrees || 100
        this.percentData = opts.percentData || 0.2
        this.percentFeatures = opts.percentFeatures || 0.7
        this.verbose = opts.verbose || false
        this.data = _s
        this.features = features.slice(0)
        for (let i = 0; i < this.numTrees; i++) {
            let d = _s.slice(0)
            d = _.slice(_.shuffle(d), 0, d.length * this.percentData)
            const f = _.slice(_.shuffle(features.slice(0)), 0, Math.round(features.length * this.percentFeatures))
            if (this.verbose) {
                console.log(`Tree ${i} : ${d.length} data / ${f.length} features`)
                console.log(JSON.stringify(f.sort()))
            }
            this.trees.push(new DecisionTree(d, target, f))
        }
    }

    predictClass(sample: { a: number, b: number, output?: number }) {
        return this.predict(sample, 'class')
    }

    predictProbability(sample: { a: number, b: number, output?: number }) {
        return this.predict(sample, 'probability')
    }

    predict(sample: { a: number, b: number, output?: number }, type: 'class' | 'probability') {
        type = type || 'class'
        const results = []
        _.each(this.trees, dt => results.push(dt.predict(sample)))
        if (type == 'class') return mostCommon(results)
        else {
            const counts: {[key: number]: number} = {}
            for (const num of results) counts[num] = counts[num] ? counts[num] + 1 : 1
            _.each(counts, e => e /= results.length)
            return counts
        }
    }

    evaluate(samples: { a: number, b: number, output: number }[]) {
        const report = { size: 0, correct: 0, incorrect: 0, accuracy: 0, precision: 0, recall: 0, fscore: 0, class: {}, featureImportance: null }
        _.each(samples, s => {
            report.size++
            const pred = this.predictClass(s), actual = s[this.target]
            report.class[pred] = report.class[pred] || { size: 0, predicted: 0, predictedCorrect: 0 }
            report.class[pred]['predicted']++
            report.class[actual] = report.class[actual] || { size: 0, predicted: 0, predictedCorrect: 0 }
            report.class[pred]['size']++
            if (pred == actual) {
                report.correct++
                report.class[pred]['predictedCorrect']++
            } else report.incorrect++
        })
        let classLength = 0
        _.each(report.class, d => {
            (d['precision'] as number) = d['predictedCorrect'] / d['predicted'];
            (d['recall'] as number) = d['predictedCorrect'] / d['size'];
            (d['fscore'] as number) = 2 / (1 / d['precision'] + 1 / d['recall'])
            report.precision += d['precision']
            report.recall += d['recall']
            report.fscore += d['fscore']
            classLength++
        })
        report.accuracy = report.correct / report.size
        report.precision /= classLength
        report.recall /= classLength
        report.fscore /= classLength
        report.featureImportance = this.featureImportance()
        return report
    }

    featureImportance() {
        const r = {}
        for (const feature of this.features) r[feature] = gain(this.data, this.target, feature)
        return r
    }
}
