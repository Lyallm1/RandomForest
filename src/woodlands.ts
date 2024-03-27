import _ from 'lodash'

const { size, each, filter, find, map, maxBy, shuffle, slice, sortBy, uniq, without } = _,
randomTag = () => `_r${Math.round(Math.random() * 1000000)}`, mostCommon  = (l: any[]) => sortBy(l, a => filter(l, b => b == a).length).reverse()[0], entropy = (vals: any[]) => uniq(vals).map(val => filter(vals, x => x == val).length / vals.length).map(p => -p * Math.log2(p)).reduce((a, b) => a + b, 0),
gain = (_s: any[], target: string, feature: string) => entropy(map(_s, target)) - uniq(map(_s, feature)).map(n => {
    const subset = _s.filter(x => x[feature] == n)
    return subset.length * entropy(map(subset, feature)) / size(_s)
}).reduce((a, b) => a + b, 0), createTree = (_s: any[], target: string, features: string[]): { type: 'result' | 'feature', val?: string, vals?: any[], name: string, alias: string } => {
    const targets = uniq(map(_s, target)), topTarget = mostCommon(targets), bestFeature = maxBy(features, e => gain(_s, target, e)), possibleValues = uniq(map(_s, bestFeature))
    if (targets.length == 1) return { type: 'result', val: targets[0], name: targets[0], alias: targets[0] + randomTag() }
    if (features.length == 0 || possibleValues.length == 0) return { type: 'result', val: topTarget, name: topTarget, alias: topTarget + randomTag() }
    return { name: bestFeature, alias: bestFeature + randomTag(), type: 'feature', vals: map(possibleValues, v => ({ name: v, alias: v + randomTag(), type: 'feature_value', child: createTree(_s.filter(x => x[bestFeature] == v), target, without(features, bestFeature)) })) }
}

export class DecisionTree {
    model = createTree(this.data, this.target, this.features)
    
    constructor(public data: { a: number, b: number, output: number }[], public target: string, public features: string[]) {}

    predict(sample: { a: number, b: number, output?: number }) {
        while (this.model.type != 'result') {
            const childNode = find(this.model.vals, x => x.name == sample[this.model.name])
            this.model = childNode ? childNode.child : this.model.vals[0].child
        }
        return this.model.val
    }

    evaluate(samples: { a: number, b: number, output?: number }[]) {
        let total = 0, correct = 0
        each(samples, s => {
            total++
            this.predict(s) == s[this.target] && correct++
        })
        return correct / total
    }

    featureImportance() {
        const r: {[key: string]: number} = {}
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
    trees: DecisionTree[] = []

    constructor(public data: { a: number, b: number, output: number }[], public target: string, public features: string[], opts: { numTrees: number, percentData: number, percentFeatures: number, verbose?: boolean }) {
        this.numTrees = opts.numTrees || 100
        this.percentData = opts.percentData || 0.2
        this.percentFeatures = opts.percentFeatures || 0.7
        this.verbose = opts.verbose || false
        this.features = features.slice(0)
        for (let i = 0; i < this.numTrees; i++) {
            let d = data.slice(0)
            d = slice(shuffle(d), 0, d.length * this.percentData)
            const f = slice(shuffle(features.slice(0)), 0, Math.round(features.length * this.percentFeatures))
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
        type ||= 'class'
        const results = Array.from(this.trees, dt => dt.predict(sample))
        if (type == 'class') return mostCommon(results)
        else {
            const counts: {[key: string]: number} = {}
            for (const num of results) counts[num] = counts[num] ? counts[num] + 1 : 1
            each(counts, e => e /= results.length)
            return counts
        }
    }

    evaluate(samples: { a: number, b: number, output?: number }[]) {
        const report = { size: 0, correct: 0, incorrect: 0, accuracy: 0, precision: 0, recall: 0, fscore: 0, class: {} as {[key: string]: {[key: string]: number}}, featureImportance: this.featureImportance() }
        each(samples, s => {
            report.size++
            const pred = this.predictClass(s), actual = s[this.target]
            report.class[pred] = report.class[pred] || { size: 0, predicted: 0, predictedCorrect: 0 }
            report.class[pred].predicted++
            report.class[actual] = report.class[actual] || { size: 0, predicted: 0, predictedCorrect: 0 }
            report.class[actual].size++
            if (pred == actual) {
                report.correct++
                report.class[pred].predictedCorrect++
            } else report.incorrect++
        })
        let classLength = 0
        each(report.class, d => {
            d['precision'] = d['predictedCorrect'] / d['predicted'];
            d['recall'] = d['predictedCorrect'] / d['size'];
            d['fscore'] = 2 / (1 / d['precision'] + 1 / d['recall'])
            report.precision += d['precision']
            report.recall += d['recall']
            report.fscore += d['fscore']
            classLength++
        })
        report.accuracy = report.correct / report.size
        report.precision /= classLength
        report.recall /= classLength
        report.fscore /= classLength
        return report
    }

    featureImportance() {
        const r: {[key: string]: number} = {}
        for (const feature of this.features) r[feature] = gain(this.data, this.target, feature)
        return r
    }
}
