---
tags: [math, probability, core]
---
# Gaussian Distribution
Prev: [[Expectation Variance Covariance]] · Roadmap: [[00 Math Roadmap]]

## 🧠 Mental picture
- **Gaussian = the shape of "many small independent nudges added up"** — heights, measurement noise, a ball-drop board (Galton board): most balls pile in the middle, few at the edges.
- **In 2-D it is a hill; its contours are ellipses** — slice the hill horizontally and you get nested ovals. Skinny egg ⇒ strong correlation.
- **Mahalanobis distance = distance measured in "natural units of spread".** A 3 kg change in weight is huge for a jockey and a rounding error for a sumo wrestler. The ellipse stretches the ruler to match.
- **Bayes classifier with Gaussians** = two overlapping hills; the boundary is where the hills are equally tall (after weighting by priors). Equal shapes ⇒ straight boundary; different shapes ⇒ curved.
- 👀 Try it: `07_covariance_cloud.py` and `08_bayes_boundary.py`

![[07_covariance_cloud.png]]
![[08_bayes_boundary.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Univariate
$\mathcal N(x|\mu,\sigma^2)=\dfrac1{\sqrt{2\pi\sigma^2}}\exp\!\Big(-\dfrac{(x-\mu)^2}{2\sigma^2}\Big)$.
About 68% of mass within $\mu\pm\sigma$, 95% within $\pm2\sigma$, 99.7% within $\pm3\sigma$.

## Multivariate ($x\in\mathbb R^d$)
$\mathcal N(x|\mu,\Sigma)=\dfrac1{(2\pi)^{d/2}|\Sigma|^{1/2}}\exp\!\Big(-\tfrac12(x-\mu)^\top\Sigma^{-1}(x-\mu)\Big)$
- $(x-\mu)^\top\Sigma^{-1}(x-\mu)$ is the squared **Mahalanobis distance** — distance measured in units of the data's spread.
- Contours are **ellipses**; their axes are the eigenvectors of $\Sigma$ ([[Eigenvalues and Eigenvectors]]), with lengths ∝ $\sqrt{\lambda}$. If $\Sigma=\sigma^2I$ the contours are circles.

## MLE from data (derived in W02 — see [[MLE MAP and Cross-Entropy]])
$\hat\mu=\frac1n\sum x_i,\qquad\hat\Sigma=\frac1n\sum(x_i-\hat\mu)(x_i-\hat\mu)^\top$.

## Why it matters
- Gaussian class-conditionals give the **Gaussian Bayesian classifier** ([[Bayes Rule and Bayesian Decision Theory]]) — linear boundary when covariances are equal, quadratic otherwise.
- [[GMM and EM]] = a weighted sum of Gaussians.
- [[LDA]]'s name comes from the equal-covariance Gaussian case.

## Self-test
1. What is the Gaussian pdf's maximum value for $\sigma=2$? *(1/√(8π) ≈ 0.199)*
2. Equal priors, $\mu_1=0,\mu_2=2,\sigma=1$ in 1D: where is the Bayes boundary? *(x = 1)*
3. What shape are contours when $\Sigma=\operatorname{diag}(4,1)$? *(ellipse, twice as wide along x)*

## Mistakes log
-
