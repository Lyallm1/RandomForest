import pkg from 'lodash';
const { each, filter, find, map, maxBy, shuffle, size, slice, sortBy, uniq, without } = pkg;
export class RandomForest {
    constructor(_s, target, features, opts) {
        this.target = target;
        this.trees = [];
        this.numTrees = opts.numTrees || 100;
        this.percentData = opts.percentData || 0.2;
        this.percentFeatures = opts.percentFeatures || 0.7;
        this.verbose = opts.verbose || false;
        this.data = _s;
        this.features = features.slice(0);
        for (let i = 0; i < this.numTrees; i++) {
            let d = _s.slice(0), f = features.slice(0);
            d = slice(shuffle(d), 0, d.length * this.percentData);
            f = slice(shuffle(f), 0, Math.round(features.length * this.percentFeatures));
            if (this.verbose) {
                console.log(`Tree ${i} : ${d.length} data / ${f.length} features`);
                console.log(JSON.stringify(f.sort()));
            }
            this.trees.push(new DecisionTree(d, target, f));
        }
    }
    predictClass(sample) {
        return this.predict(sample, 'class');
    }
    predictProbability(sample) {
        return this.predict(sample, 'probability');
    }
    predict(sample, type) {
        type = type || 'class';
        const results = [];
        each(this.trees, dt => results.push(dt.predict(sample)));
        if (type == 'class')
            return mostCommon(results);
        else if (type == 'probability') {
            const counts = {};
            for (const num of results)
                counts[num] = counts[num] ? counts[num] + 1 : 1;
            each(counts, (e, i) => counts[i] = e / results.length);
            return counts;
        }
    }
    evaluate(samples) {
        const report = { size: 0, correct: 0, incorrect: 0, accuracy: 0, precision: 0, recall: 0, fscore: 0, class: {}, featureImportance: {} };
        each(samples, s => {
            report.size++;
            const pred = this.predictClass(s), actual = s[this.target];
            report.class[pred] = report.class[pred] || { size: 0, predicted: 0, predictedCorrect: 0 };
            report.class[pred].predicted++;
            report.class[actual] = report.class[actual] || { size: 0, predicted: 0, predictedCorrect: 0 };
            report.class[actual].size++;
            if (pred == actual) {
                report.correct++;
                report.class[pred].predictedCorrect++;
            }
            else
                report.incorrect++;
        });
        let classLength = 0;
        each(report.class, d => {
            d['precision'] = d['predictedCorrect'] / d['predicted'];
            d['recall'] = d['predictedCorrect'] / d['size'];
            d['fscore'] = 2 * d['precision'] * d['recall'] / (d['precision'] + d['recall']);
            report.precision += d['precision'];
            report.recall += d['recall'];
            report.fscore += d['fscore'];
            classLength++;
        });
        report.accuracy = report.correct / report.size;
        report.precision /= classLength;
        report.recall /= classLength;
        report.fscore /= classLength;
        report.featureImportance = this.featureImportances();
        return report;
    }
    featureImportances() {
        const r = {};
        for (const feature of this.features)
            r[feature] = gain(this.data, this.target, feature);
        return r;
    }
}
export class DecisionTree {
    constructor(_s, target, features) {
        this.target = target;
        this.features = features;
        this.data = _s;
        this.model = createTree(_s, target, features);
    }
    predict(sample) {
        let root = this.model;
        while (root.type != 'result') {
            const childNode = find(root.vals, x => x.name == sample[root.name]);
            root = childNode ? childNode.child : root.vals[0].child;
        }
        return root.val;
    }
    evaluate(samples) {
        let total = 0, correct = 0;
        each(samples, s => {
            total++;
            if (this.predict(s) == s[this.target])
                correct++;
        });
        return correct / total;
    }
    featureImportances() {
        const r = {};
        for (const feature of this.features)
            r[feature] = gain(this.data, this.target, feature);
        return r;
    }
    toJSON() {
        return this.model;
    }
}
function createTree(_s, target, features) {
    const targets = uniq(map(_s, target));
    if (targets.length == 1)
        return { type: 'result', val: targets[0], name: targets[0], alias: targets[0] + randomTag() };
    if (features.length == 0)
        return { type: 'result', val: mostCommon(targets), name: mostCommon(targets), alias: mostCommon(targets) + randomTag() };
    const bestFeature = maxGain(_s, target, features), possibleValues = uniq(map(_s, bestFeature));
    if (possibleValues.length == 0)
        return { type: 'result', val: mostCommon(targets), name: mostCommon(targets), alias: mostCommon(targets) + randomTag() };
    const node = { type: 'feature', name: bestFeature, alias: bestFeature + randomTag() };
    node['vals'] = map(possibleValues, v => {
        const childNode = { name: v, alias: v + randomTag(), type: 'feature_value' };
        childNode['child'] = createTree(_s.filter(x => x[bestFeature] == v), target, without(features, bestFeature));
        return childNode;
    });
    return node;
}
function entropy(vals) {
    return uniq(vals).map(x => prob(x, vals)).map(p => -p * Math.log2(p)).reduce((a, b) => a + b, 0);
}
function gain(_s, target, feature) {
    return entropy(map(_s, target)) - uniq(map(_s, feature)).map(n => {
        const subset = _s.filter(x => x[feature] == n);
        return subset.length * entropy(map(subset, target)) / size(_s);
    }).reduce((a, b) => a + b, 0);
}
function maxGain(_s, target, features) {
    return maxBy(features, e => gain(_s, target, e));
}
function prob(val, vals) {
    return filter(val, x => x == val).length / vals.length;
}
function mostCommon(l) {
    return sortBy(l, a => count(a, l)).reverse()[0];
}
function count(a, l) {
    return filter(l, b => b == a).length;
}
function randomTag() {
    return `_r${Math.round(Math.random() * 1000000)}`;
}
//# sourceMappingURL=woodlands.js.map