# grf

"Genetic Random Forest" - Quick hacked together attempt to build an implementation of decision trees and then random forest in python. There's already heaps of implementations out there, this is for my own personal amusement.

Rough idea is to take my vague memories of my AI course at uni to define a Decision Tree structure which can be easily generated, mutated and executed to produce both simple and complex decisions at each node in the decision tree. I've created an extremely simple stack-based VM for this (in `grf/decisionvm.py`) with three instructions:
* PushConstant
* PushAttribute
* BinaryOperator

This is all I'm going to implement for starters - the simplest case (iris data set) doesn't seem to need anything more than a single. I wanted to leave the possibility open to add more complex decisions, and the little stack VM permits this I think.

Next I need to define mutations over each node in the decision tree. I think we can do the following:
* scale constants
* replace operator
* swap argument positions
* replace attribute
* replace classification

After this I need to tie together the decision tree creation and mutation and measure against a set of the training data - define a way we can define specify a simple genetic algorithm (something like "take 100 algorithms, measure their success in classifying some input data, kill off the least successful 50% and replace them with mutated copies of the top 50%"

(NOTE: I've done everything up to this point - except I need to move it from `test.py` into a library in `grf` to make things cleaner, and add slightly more aggressive mutation since we get stuck at atound 90% accuracy and endup in a bit of a local maximum)

THEN need to tie these together in a random forest and expose a simple interface. It would maybe beneficial if I read more about this - roughly understand the principles but I kinda wanted to produce the implementation semi-blind to compare if what I came up with roughly matched how this tends to be written.x