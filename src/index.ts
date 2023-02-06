const header = ['Outlook', 'Temperature', 'Humidity', 'Wind', 'PlayTennis']

function classCounts(rows: any[][]) {
    const counts: {[key: string]: number} = {}
    for (const row of rows) {
        const label = row[-1]
        if (!(label in counts)) counts[label] = 0
        counts[label]++
    }
    return counts
}
function isNumeric(value: any) {
    return value instanceof Number
}

class Question {
    constructor(public column: number, public value: any) {}

    match(example: any[]) {
        const val = example[this.column]
        return isNumeric(val) ? val >= this.value : val == this.value
    }

    toString() {
        return `Is ${header[this.column]} ${isNumeric(this.value) ? '>=' : '=='} ${this.value}`
    }
}

function partition(rows: any[][], question: Question): [any[][], any[][]] {
    const trueRows = [], falseRows = []
    for (const row of rows) question.match(row) ? trueRows.push(row) : falseRows.push(row)
    return [trueRows, falseRows]
}
function gini(rows: any[][]) {
    let counts = classCounts(rows), impurity = 1
    for (const label in counts) impurity -= (counts[label] / rows.length)**2
    return impurity
}
function infoGain(left: any[][], right: any[][], currentUncertainty: number) {
    return currentUncertainty + left.length * (gini(right) - gini(left)) / (left.length + right.length) - gini(right)
}
function findBestSplit(rows: any[][]): [number, Question] {
    let bestGain = 0, bestQuestion: Question
    for (let col = 0; col < rows[0].length - 1; col++) for (const row of rows) for (const val of new Set([row[col]])) {
        const question = new Question(col, val), [trueRows, falseRows] = partition(rows, question)
        if (trueRows.length == 0 || falseRows.length == 0) continue
        const gain = infoGain(trueRows, falseRows, gini(rows))
        if (gain >= bestGain) [bestGain, bestQuestion] = [gain, question]
    }
    return [bestGain, bestQuestion]
}

class Leaf {
    predictions: {}

    constructor(rows: any[][]) {
        this.predictions = classCounts(rows)
    }
}
class DecisionNode {
    constructor(public question: Question, public trueBranch: DecisionNode | Leaf, public falseBranch: DecisionNode | Leaf) {}
}

function buildTree(rows: any[][]): DecisionNode | Leaf {
    const [gain, question] = findBestSplit(rows)
    if (gain == 0) return new Leaf(rows)
    const [trueRows, falseRows] = partition(rows, question)
    return new DecisionNode(question, buildTree(trueRows), buildTree(falseRows))
}
function printTree(node: DecisionNode | Leaf, spacing = '') {
    if (node instanceof Leaf) {
        console.log(`${spacing}Predict`, node.predictions)
        return
    }
    console.log(`${spacing}${node.question.toString()}`)
    console.log(`${spacing}--> True:`)
    printTree(node.trueBranch, `${spacing}  `)
    console.log(`${spacing}--> False:`)
    printTree(node.falseBranch, `${spacing}  `)
}

printTree(buildTree([
    ['Sunny', 'Hot', 'High', 'Weak', 'No'], ['Sunny', 'Hot', 'High', 'Strong', 'No'],
    ['Overcast', 'Hot', 'High', 'Weak', 'Yes'], ['Rain', 'Mild', 'High', 'Weak', 'Yes'],
    ['Rain', 'Cool', 'Normal', 'Weak', 'Yes'], ['Rain', 'Cool', 'Normal', 'Strong', 'No'],
    ['Overcast', 'Cool', 'Normal', 'Strong', 'Yes'], ['Sunny', 'Mild', 'High', 'Weak', 'No'],
    ['Sunny', 'Cool', 'Normal', 'Weak', 'Yes'], ['Rain', 'Mild', 'Normal', 'Weak', 'Yes'],
    ['Sunny', 'Mild', 'Normal', 'Strong', 'Yes'], ['Overcast', 'Mild', 'High', 'Strong', 'Yes'],
    ['Overcast', 'Hot', 'Normal', 'Weak', 'Yes'], ['Rain', 'Mild', 'High', 'Strong', 'No']
]))
