---
tags: [math, probability, core]
---
# Expectation, Variance, Covariance
Prev: [[Probability Basics]] · Next: [[Gaussian Distribution]]

## 🧠 Mental picture
- **Mean = balance point of a seesaw** with the data as kids sitting on it.
- **Variance = how spread-out the kids sit** (physically: moment of inertia — far-out kids are hard to spin).
- **Covariance = two dancers.** Positive: they move together; negative: one steps forward when the other steps back; zero: they ignore each other.
- **Covariance matrix = the shape of the cloud.** Round blob ⇒ diagonal, equal. Slanted egg ⇒ off-diagonals non-zero. Its eigenvectors are the egg's axes (that's [[PCA]]).
- 👀 Try it: `07_covariance_cloud.py` (changes the correlation and shows the egg + its eigen-axes)

![[07_covariance_cloud.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Definitions
- **Mean / expectation:** $\mathbb E[X]=\sum_xx\,p(x)$ (or $\int x\,p(x)dx$). Sample mean $\hat\mu=\frac1n\sum x_i$.
- **Variance:** $\operatorname{Var}(X)=\mathbb E[(X-\mu)^2]=\mathbb E[X^2]-\mu^2$. Standard deviation $\sigma=\sqrt{\operatorname{Var}}$. Sample variance divides by $n-1$ (unbiased) or $n$ (MLE); check which the lecture uses.
- **Covariance:** $\operatorname{Cov}(X,Y)=\mathbb E[(X-\mu_X)(Y-\mu_Y)]$. Positive: move together.
- **Covariance matrix** of a vector $x$: $\Sigma=\mathbb E[(x-\mu)(x-\mu)^\top]$ — symmetric, positive semi-definite; diagonal = variances, off-diagonal = covariances.
- Linear rules: $\mathbb E[aX+b]=a\mathbb E[X]+b$, $\operatorname{Var}(aX+b)=a^2\operatorname{Var}(X)$.

## Worked examples
Data $\{2,4,6\}$: mean 4; sum of squares $4+0+4=8$ → variance $8/3$ (divide by $n$) or $4$ (divide by $n-1$).

Points $(1,1),(2,2),(3,3)$: means $(2,2)$; with $n-1$: $\operatorname{Var}(x)=\operatorname{Var}(y)=\operatorname{Cov}=1$, so $\Sigma=\begin{pmatrix}1&1\\1&1\end{pmatrix}$ with eigenvalues $2$ and $0$ — all the spread lies along $(1,1)$. This is exactly [[PCA]].

## Self-test
1. $\operatorname{Var}(3X+1)$ if $\operatorname{Var}(X)=2$? *(18)*
2. Can covariance be negative? Can variance? *(yes; no)*
3. What do the eigenvectors of $\Sigma$ represent? *(directions of variation; eigenvalue = variance along it)*

## Mistakes log
-
