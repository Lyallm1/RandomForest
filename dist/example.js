import { DecisionTree } from './decisiontree.js';
const model = new DecisionTree('fruit', ['colour', 'diameter'], [
    { colour: 'Green', diameter: 3, fruit: 'Apple' }, { colour: 'Yellow', diameter: 3, fruit: 'Apple' }, { colour: 'Red', diameter: 1, fruit: 'Grape' },
    { colour: 'Red', diameter: 1, fruit: 'Grape' }, { colour: 'Yellow', diameter: 3, fruit: 'Lemon' }
]);
console.log('Generated decision tree:');
model.printTree();
console.log('\nPrediction for {colour: \'Red\', diameter: 2}:');
console.log(model.classify({ colour: 'Red', diameter: 2 }));
//# sourceMappingURL=example.js.map