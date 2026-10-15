---
tags: [math, roadmap]
---
# Math Roadmap
Back to [[Masters Mind]].

Work through these **in order**. Each note: intuition → rules → worked example → self-test. About 1–2 hours each (≈15 hours total). Do not rush: the later notes build on the earlier ones.

| # | Note | Needed for |
|---|---|---|
| 1 | [[Vectors and Matrices]] | everything |
| 2 | [[Determinant Inverse and Rank]] | EE5101 controllability, LDA, Gaussians |
| 3 | [[Eigenvalues and Eigenvectors]] | EE5101 (core), PCA, LDA |
| 4 | [[Complex Numbers and Poles]] | EE5101 stability, pole placement |
| 5 | [[ODE Basics and the Exponential]] | EE5101 state solution |
| 6 | [[Calculus and Gradients]] | EE5907 learning, backprop, optimization |
| 7 | [[Probability Basics]] | EE5907 (core) |
| 8 | [[Expectation Variance Covariance]] | EE5907 PCA, Gaussians |
| 9 | [[Gaussian Distribution]] | EE5907 Bayes classifiers, GMM |

**Order of attack for your two exams**
- EE5101 is mostly notes 1–5 → then [[State-Space Representation]].
- EE5907 is mostly notes 6–9 plus 1–3 for PCA/LDA → then [[Bayes Rule and Bayesian Decision Theory]].

Tip: use Python/NumPy to check every worked example (`np.linalg.eig`, `np.linalg.inv`). Checking by computer builds trust in your hand calculations.
