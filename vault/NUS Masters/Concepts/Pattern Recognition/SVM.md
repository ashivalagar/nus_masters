---
tags: [ee5907, upcoming, assignment]
---
# SVM — Support Vector Machine (upcoming — Week 10)
Course map: [[EE5907 Course Map]] · Assignment: [[Assignment 2 Notes]] (part 2.3) · Needs: [[Linear Discriminants Perceptron Logistic LSE]], [[Calculus and Gradients]]
**Primer written before the lecture — update after class.**

## 🧠 Mental picture
- **The widest street between two neighbourhoods.** Among all roads that separate the houses, build the **widest** one. Only the houses right on the curb (**support vectors**) decide where the road goes; move any other house and nothing changes.
- **$C$ = how strict the city is about houses encroaching on the road.** Large $C$: no houses may stand on the road (narrow, twisting road, fits every house, may overfit). Small $C$: tolerate some intrusions for a wider, smoother road (more regularised).
- **Kernel = lift the data into higher dimensions.** Two concentric rings on a flat sheet can't be split by a line; push the centre up like a tent and a flat sheet *can* separate them.
- 👀 Try it: `21_svm_margin_C.py`

![[21_svm_margin_C.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Idea
Among all separating hyperplanes, pick the one with the **largest margin** $2/\|w\|$.
- **Hard margin:** $\min\tfrac12\|w\|^2$ s.t. $y_i(w^\top x_i+b)\ge1$.
- **Soft margin:** $\min\tfrac12\|w\|^2+C\sum_i\xi_i$ s.t. $y_i(w^\top x_i+b)\ge1-\xi_i,\ \xi_i\ge0$ (hinge loss). **$C$ large** → penalises mistakes heavily (narrow margin, may overfit); **$C$ small** → wide margin, more regularization (may underfit). The assignment tests $C\in\{0.0001,0.1,1000\}$.
- **Dual:** only **support vectors** (points with $\alpha_i>0$) matter; depends on data through dot products $x_i^\top x_j$ → the **kernel trick** replaces them with $k(x_i,x_j)$ (polynomial, RBF $e^{-\gamma\|x-x'\|^2}$).
- **Multiclass:** one-vs-rest or one-vs-one.

## Self-test (fill in after lecture)
1. What are support vectors?
2. How does $C$ trade bias against variance?
3. Why use a kernel?

## Mistakes log
-
