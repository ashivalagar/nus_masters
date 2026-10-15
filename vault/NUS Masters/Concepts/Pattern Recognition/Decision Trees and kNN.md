---
tags: [ee5907]
---
# Decision Trees and kNN (non-parametric classifiers)
Course map: [[EE5907 Course Map]] · Source: [[Supplementary Non-parametric Classifier with DT.pdf]]
Used in: [[Assignment 2 Notes]] (KNN)

## 🧠 Mental picture
- **Decision tree = the game of Twenty Questions.** Always ask the question that splits the remaining possibilities most evenly (Gini/entropy picks it). Few questions → quick but crude; endless questions → memorises the specific person (overfit).
- **kNN = "you are who your neighbours are."** Ask your $k$ closest neighbours what they like. $k=1$ trusts one possibly weird neighbour; larger $k$ consults the whole street.
- **Curse of dimensionality = in a 1000-dimensional universe, everyone is far from everyone.** Distances lose meaning — which is why we shrink faces with PCA/LDA before applying KNN.
- **Random forest = a jury of slightly different trees voting.**
- 👀 Try it: `18_knn_boundary.py`

![[18_knn_boundary.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## k-Nearest Neighbours
Classify $x$ by majority vote among its $k$ nearest training points (Euclidean or other distance). No training; all work at test time. $k=1$ gives zero training error and jagged boundaries; larger $k$ smooths. Scale features; suffers in high dimension (curse of dimensionality) — which is why PCA/LDA features are used before KNN on faces.

## Decision tree
Hierarchy of yes/no splits on features; each leaf predicts the majority class. Produces **nonlinear, axis-aligned** decision regions. **Non-parametric** (structure grows with the data) vs MLP (fixed parameter count).
- **Impurity:** Gini $=1-\sum_kp_k^2$; entropy $=-\sum_kp_k\ln p_k$.
- **Split choice:** maximise impurity decrease (information gain) at each node, greedily.
- **Pruning / depth limits** control complexity (otherwise it overfits). **Random forest** = many trees on bootstrap samples with random feature subsets, majority vote.

## Worked example (Gini)
Parent: 6 positive, 4 negative → Gini $=1-(0.36+0.16)=0.48$.
Split into left (5+, 0−) Gini 0 and right (1+, 4−) Gini $=1-(0.04+0.64)=0.32$.
Weighted child Gini $=0.5\cdot0+0.5\cdot0.32=0.16$ → gain $=0.48-0.16=0.32$.

## Self-test
1. Gini of a pure node? *(0)*
2. Why does a deep tree overfit? *(memorises noise; high variance)*
3. Training error of 1-NN? *(0, if no duplicate points with different labels)*

## Mistakes log
-
