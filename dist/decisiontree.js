class Question {
    constructor(column, value) {
        this.column = column;
        this.value = value;
    }
    match(example) {
        const exampleValue = example[this.column];
        return isNumeric(exampleValue) ? exampleValue >= this.value : exampleValue === this.value;
    }
    toString() {
        return `Is ${this.column} ${isNumeric(this.value) ? '>=' : '=='} ${this.value}`;
    }
}
class Leaf {
    constructor(classCounts) {
        this.predictions = classCounts;
    }
    percentageProbabilities() {
        const probabilities = {};
        Object.keys(this.predictions).forEach(key => probabilities[key] = `${(this.predictions[key] / Object.keys(this.predictions).reduce((acc, key) => acc + this.predictions[key], 0)) * 100}%`);
        return probabilities;
    }
}
class DecisionNode {
    constructor(question, trueBranch, falseBranch) {
        this.question = question;
        this.trueBranch = trueBranch;
        this.falseBranch = falseBranch;
    }
}
export class DecisionTree {
    constructor(classPropertyName, featurePropertyNames, trainingData) {
        this._classPropertyName = classPropertyName;
        this._featurePropertyNames = featurePropertyNames;
        this.decisionTree = this._buildTree(trainingData);
    }
    _buildTree(rows) {
        const split = this._findBestSplit(rows);
        if (split.bestGain == 0)
            return new Leaf(this._classCounts(rows));
        const partition = this._partition(rows, split.bestQuestion);
        return new DecisionNode(split.bestQuestion, this._buildTree(partition.trueRows), this._buildTree(partition.falseRows));
    }
    _classCounts(rows) {
        const classCounts = {};
        rows.forEach(row => {
            const classifier = row[this._classPropertyName];
            classCounts[classifier] = !classCounts[classifier] ? 0 : classCounts[classifier] + 1;
        });
        return classCounts;
    }
    _partition(rows, question) {
        const trueRows = [], falseRows = [];
        rows.forEach(row => question.match(row) ? trueRows.push(row) : falseRows.push(row));
        return { trueRows, falseRows };
    }
    _gini(rows) {
        const classCounts = this._classCounts(rows);
        let impurity = 1;
        Object.keys(classCounts).forEach((key, i) => impurity -= (classCounts[key] / parseFloat(rows[i].left)) ** 2);
        return impurity;
    }
    _infoGain(left, right, currentUncertainty) {
        return currentUncertainty + left.length * (this._gini(right) - this._gini(left)) / (left.length + right.length) - this._gini(right);
    }
    _findBestSplit(rows) {
        let bestGain = 0, bestQuestion = null;
        const currentUncertainty = this._gini(rows);
        this._featurePropertyNames.forEach(column => {
            const uniqueValues = new Set();
            rows.forEach(row => uniqueValues.add(row[column]));
            for (const i in uniqueValues) {
                const question = new Question(column, uniqueValues[i]), partition = this._partition(rows, question);
                if (!(partition.trueRows.length && partition.falseRows.length))
                    continue;
                const gain = this._infoGain(partition.trueRows, partition.falseRows, currentUncertainty);
                if (gain >= bestGain)
                    [bestGain, bestQuestion] = [gain, question];
            }
        });
        return { bestGain, bestQuestion };
    }
    _printTree(node, indent = '') {
        if (node instanceof Leaf) {
            console.log(`${indent}Predict: ${node.percentageProbabilities()}`);
            return;
        }
        console.log(`${indent}${node.question}`);
        console.log(`${indent}--> True`);
        this._printTree(node.trueBranch, indent + '  ');
        console.log(`${indent}--> False`);
        this._printTree(node.falseBranch, indent + '  ');
    }
    _treeToStringArray(node, stringArray, indent = '') {
        if (node instanceof Leaf) {
            stringArray.push(`${indent}Predict: ${node.percentageProbabilities()}`);
            return;
        }
        stringArray.push(`${indent}${node.question.toString()}`);
        stringArray.push(`${indent}--> True`);
        this._treeToStringArray(node.trueBranch, stringArray, indent + '    ');
        stringArray.push(`${indent}--> False`);
        this._treeToStringArray(node.falseBranch, stringArray, indent + '    ');
    }
    _classify(row, node) {
        if (node instanceof Leaf)
            return node.percentageProbabilities();
        return node.question.match(row) ? this._classify(row, node.trueBranch) : this._classify(row, node.falseBranch);
    }
    classify(row) {
        return this._classify(row, this.decisionTree);
    }
    printTree() {
        this._printTree(this.decisionTree);
    }
    toString() {
        const treeStringArray = [];
        this._treeToStringArray(this.decisionTree, treeStringArray);
        return treeStringArray.reduce((acc, string) => `${acc} \n ${string}`, '');
    }
}
function isNumeric(value) {
    return typeof value == 'number';
}
//# sourceMappingURL=decisiontree.js.map