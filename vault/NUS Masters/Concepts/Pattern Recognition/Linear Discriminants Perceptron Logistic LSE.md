---
tags: [ee5907, core, exam-likely]
---
# Linear Discriminants: Perceptron, Logistic, Least Squares
Course map: [[EE5907 Course Map]] · Source: [[W04 Linear Discriminant Functions and Classifiers.pdf]], tutorial [[Tutorial 1.pdf]]
Needs: [[Vectors and Matrices]], [[Calculus and Gradients]], [[MLE MAP and Cross-Entropy]] · Next: [[MLP and Backpropagation]]

## 🧠 Mental picture
- **A fence on a map between two towns.** The linear discriminant is the fence ($w^\top x+b=0$); $w$ points from one town toward the other; the signed distance to the fence tells you how deep into a town you are.
- **Perceptron = a bouncer who learns from mistakes.** Every time he lets the wrong person in or out, he drags the rope a little toward the correct side. If a clean fence exists, he finds it in finite time; if not (towns overlap), he flip-flops forever.
- **Logistic = a fuzzy fence.** Far from the fence you're sure (probability near 0 or 1); on the fence it's 50/50. The sigmoid is a **dimmer switch** turning a distance into a confidence.
- **Least squares = fitting a straight ramp through ±1 labels**, then cutting at 0 — works but is dragged around by outliers far from the fence.
- 👀 Try it: `16_perceptron_logistic.py`

![[16_perceptron_logistic.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Linear discriminant
$g(x)=w^\top x+b$; predict class 1 if $g(x)>0$. The boundary $w^\top x+b=0$ is a **hyperplane** with normal $w$; the signed distance of $x$ to it is $g(x)/\|w\|$. Gaussian classifiers with shared covariance give exactly this form ([[Bayes Rule and Bayesian Decision Theory]]). Multiclass: one score per class, take the argmax.

## Perceptron
Labels $y\in\{-1,+1\}$. If $y_i(w^\top x_i+b)\le0$ (mistake): $w\leftarrow w+\eta\,y_ix_i,\ b\leftarrow b+\eta y_i$.
- Minimises the **perceptron loss** $\max(0,-y\,g(x))$ by (sub)gradient descent.
- **Converges** in finitely many steps **iff the data are linearly separable**. Variants for non-separable data: *pocket*, *averaged* perceptron. Cannot solve XOR.
- Example: $w=0,b=0$, $x=(1,2)$, $y=+1$, $\eta=1$ → mistake → $w=(1,2)$, $b=1$.

## Logistic classification
$p=\sigma(z)=\frac1{1+e^{-z}}$ with $z=w^\top x+b$; the **log-odds are linear**. Train by minimising **binary cross-entropy** $-\sum[y\ln p+(1-y)\ln(1-p)]$ ($y\in\{0,1\}$). Gradient: $\nabla_w=\sum_i(p_i-y_i)x_i$. Still a *linear boundary* ($z=0$ ⇔ $p=0.5$) — sigmoid only changes the interpretation of the score.

## Least squares (LSE) classifier
Treat labels as numeric targets: $w=(X^\top X)^{-1}X^\top y$. Unstable if $X^\top X$ is near-singular → **ridge:** $w=(X^\top X+\lambda I)^{-1}X^\top y$ ([[Determinant Inverse and Rank]]).

## Comparison
| | Loss | Output | Needs separable? |
|---|---|---|---|
| Perceptron | perceptron loss | hard class | yes, to converge |
| Logistic | cross-entropy | probability | no |
| LSE | squared error | score | no (closed form) |

## Self-test
1. Distance from $(2,1)$ to the plane $x_1+x_2-1=0$? *(2/√2 = √2)*
2. Why is a perceptron unable to learn XOR? *(not linearly separable → [[MLP and Backpropagation]])*
3. Gradient of BCE w.r.t. $w$ for one sample? *((p−y)x)*

## Mistakes log
-
