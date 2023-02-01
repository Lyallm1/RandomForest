import fs from "fs"

class DecisionNode {
    constructor(public left: DecisionNode, public right: DecisionNode, public decisionFunction: (feature) => boolean, public classLabel = null) {}

    decide(feature) {
        return this.classLabel ? this.classLabel : this.decisionFunction(feature) ? this.left.decide(feature) : this.right.decide(feature)
    }
}

function loadCSV(dataFilePath: string, classIndex = -1): [number[][], number[][]] | [number[][], number[]] | number[][] {
    const out: number[][] = []
    for (const r in fs.createReadStream(dataFilePath)) if (r) for (const i of r.split(',')) out.push([Number(i)])
    return classIndex == -1 ? [out.slice().slice(0, classIndex), out.slice().slice(classIndex)] : classIndex == 0 ? [out.slice().slice(1), out.slice()[classIndex]] : out
}
function giniImpurity(classVector: any[]) {
    
}
