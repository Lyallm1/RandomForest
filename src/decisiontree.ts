class Question {
    constructor(public column, public value) {}

    match(example) {}

    toString() {}
}
class Leaf {}
class DecisionNode {
    constructor(public question: Question, public trueBranch, public falseBranch) {}
}
export class DecisionTree {
    _classPropertyName: string
    _featurePropertyNames: string[]
    decisionTree

    constructor(classPropertyName: string, featurePropertyNames: string[], trainingData) {}
}

function isNumeric(value: any) {
    return typeof value == 'number'
}
