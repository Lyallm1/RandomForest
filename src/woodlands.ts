function isNumeric(value: any) {
    return typeof value == 'number'
}

class Question {
    constructor(public column: number | string, public value: any) {}

    match(example: { colour: string, diameter: number, fruit?: string }) {
        const exampleValue = example[this.column]
        return isNumeric(exampleValue) ? exampleValue >= this.value : exampleValue == this.value
    }

    toString() {
        return `Is ${this.column} ${isNumeric(this.value) ? '>=' : '=='} ${this.value}`
    }
}
class Leaf {
    constructor(public predictions: {}) {}

    percentageProbabilities() {
        const probabilities = {}
        Object.keys(this.predictions).forEach(key => probabilities[key] = `${this.predictions[key] * 100 / Object.keys(this.predictions).reduce((acc, key) => acc + this.predictions[key], 0)}%`)
        return probabilities
    }
}
class DecisionNode {
    constructor(public question: Question, public trueBranch: DecisionNode | Leaf, public falseBranch: DecisionNode | Leaf) {}
}
export class DecisionTree {
    decisionTree: DecisionNode | Leaf

    constructor(private classPropertyName: string, private featurePropertyNames: string[], trainingData: { colour: string, diameter: number, fruit: string }[]) {
        this.decisionTree = this.buildTree(trainingData)
    }

    private buildTree(rows: any[]): DecisionNode | Leaf {
        const split = this.findBestSplit(rows)
        if (split.bestGain == 0) return new Leaf(this.classCounts(rows))
        const { trueRows, falseRows } = this.partition(rows, split.bestQuestion)
        return new DecisionNode(split.bestQuestion, this.buildTree(trueRows), this.buildTree(falseRows))
    }

    private classCounts(rows: any[]) {
        const classCounts = {}
        rows.forEach(row => {
            const classifier = row[this.classPropertyName]
            if (!classCounts[classifier]) classCounts[classifier] = 0
            classCounts[classifier]++
        })
        return classCounts
    }

    private partition(rows: any[], question: Question) {
        const trueRows = [], falseRows = []
        rows.forEach(row => question.match(row) ? trueRows.push(row) : falseRows.push(row))
        return { trueRows, falseRows }
    }

    private gini(rows: any[]) {
        const classCounts = this.classCounts(rows)
        let impurity = 1
        Object.keys(classCounts).forEach(key => impurity -= (classCounts[key] / rows.length)**2)
        return impurity
    }

    private infoGain(left: any[], right: any[], currentUncertainty: number) {
        return currentUncertainty + left.length * (this.gini(right) - this.gini(left)) / (left.length + right.length) - this.gini(right)
    }

    private findBestSplit(rows: any[]) {
        let bestGain = 0, bestQuestion: Question
        this.featurePropertyNames.forEach(column => {
            const unique = new Set<any>()
            rows.forEach(row => unique.add(row[column]))
            for (const value of unique) {
                const question = new Question(column, value), { trueRows, falseRows } = this.partition(rows, question)
                if (!(trueRows.length && falseRows.length)) continue
                const gain = this.infoGain(trueRows, falseRows, this.gini(rows))
                if (gain >= bestGain) [bestGain, bestQuestion] = [gain, question]
            }
        })
        return { bestGain, bestQuestion }
    }

    private _printTree(node: DecisionNode | Leaf, indent = '') {
        if (node instanceof Leaf) {
            console.log(`${indent}Predict: ${JSON.stringify(node.percentageProbabilities())}`)
            return
        }
        console.log(`${indent}${node.question.toString()}`)
        console.log(`${indent}--> True:`)
        this._printTree(node.trueBranch, `${indent}  `)
        console.log(`${indent}--> False:`)
        this._printTree(node.falseBranch, `${indent}  `)
    }

    private treeToStringArray(node: DecisionNode | Leaf, stringArray: string[], indent = '') {
        if (node instanceof Leaf) {
            stringArray.push(`${indent}Predict: ${JSON.stringify(node.percentageProbabilities())}`)
            return stringArray
        }
        stringArray.push(`${indent}${node.question.toString()}`)
        stringArray.push(`${indent}--> True:`)
        this.treeToStringArray(node.trueBranch, stringArray, `${indent}  `)
        stringArray.push(`${indent}--> False:`)
        this.treeToStringArray(node.falseBranch, stringArray, `${indent}  `)
    }

    private _classify(row: { colour: string, diameter: number, fruit?: string }, node: DecisionNode | Leaf) {
        if (node instanceof Leaf) return node.percentageProbabilities()
        return node.question.match(row) ? this._classify(row, node.trueBranch) : this._classify(row, node.falseBranch)
    }

    classify(row: { colour: string, diameter: number, fruit?: string }) {
        return this._classify(row, this.decisionTree)
    }

    printTree() {
        this._printTree(this.decisionTree)
    }

    toString() {
        const treeStringArray = []
        this.treeToStringArray(this.decisionTree, treeStringArray)
        return treeStringArray.reduce((acc, str) => `${acc} \n ${str}`, '')
    }
}
