---
tags: [ee5907, upcoming]
---
# Boosting (upcoming — Week 9)
Course map: [[EE5907 Course Map]] · Related: [[Decision Trees and kNN]]
**Primer written before the lecture — update after class.**

## 🧠 Mental picture
- **A study group with a smart marking scheme.** After each practice test, the next tutor focuses on the questions the group got wrong. The final answer is a **weighted vote** of all tutors, trusted in proportion to their accuracy.
- **Many mediocre doctors beat one**, if each next doctor pays extra attention to the previous doctors' misdiagnoses.
- *Where it breaks:* boosting chases hard examples — if a few labels are wrong (noise), it can obsess over them.

## AdaBoost
Combine many **weak learners** (e.g. decision stumps) into a strong classifier ($y\in\{-1,+1\}$).
1. Start with equal sample weights $w_i=1/N$.
2. For $t=1..T$: train weak learner $h_t$ on weighted data; weighted error $\varepsilon_t$; learner weight $\alpha_t=\tfrac12\ln\frac{1-\varepsilon_t}{\varepsilon_t}$.
3. Update weights $w_i\leftarrow w_i\,e^{-\alpha_ty_ih_t(x_i)}$ and normalise (misclassified points gain weight).
4. Final: $H(x)=\operatorname{sign}\big(\sum_t\alpha_th_t(x)\big)$.
Example: $\varepsilon=0.2\Rightarrow\alpha=\tfrac12\ln4\approx0.69$.

## Self-test (fill in after lecture)
1. Why must $\varepsilon_t<0.5$?
2. Boosting vs bagging (random forest)?

## Mistakes log
-
