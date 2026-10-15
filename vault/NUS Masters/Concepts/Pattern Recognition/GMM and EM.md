---
tags: [ee5907, upcoming, assignment]
---
# GMM and EM (upcoming — Week 9)
Course map: [[EE5907 Course Map]] · Assignment: [[Assignment 2 Notes]] (part 2.2) · Needs: [[Gaussian Distribution]], [[MLE MAP and Cross-Entropy]], [[K-means and Hierarchical Clustering]]
**Primer written before the lecture — update after class.**

## 🧠 Mental picture
- **Overlapping fog banks.** Each fog bank (Gaussian) is a fuzzy cluster; a point in the overlap belongs **70% to one and 30% to the other** (the responsibility $\gamma$). K-means forces a yes/no; GMM allows "partly".
- **EM = a chicken-and-egg dance.** *E-step:* assuming the fog banks are where I think they are, how responsible is each for each point? *M-step:* assuming those responsibilities, redraw each fog bank to fit its share of points. Repeat — the likelihood only goes up.
- **K-means is EM with hard assignments and round equal fog banks.**
- *Where it breaks:* with 1000-dimensional faces, covariance matrices are huge and need far more data — reduce dimension first.

## Model
$p(x)=\sum_{k=1}^K\pi_k\,\mathcal N(x|\mu_k,\Sigma_k)$ with mixing weights $\pi_k\ge0,\ \sum\pi_k=1$. Soft clustering: each point has a **responsibility** for each component.

## EM algorithm (maximises the likelihood)
- **E-step:** $\gamma_{nk}=\dfrac{\pi_k\mathcal N(x_n|\mu_k,\Sigma_k)}{\sum_j\pi_j\mathcal N(x_n|\mu_j,\Sigma_j)}$.
- **M-step:** $N_k=\sum_n\gamma_{nk}$, $\mu_k=\frac1{N_k}\sum_n\gamma_{nk}x_n$, $\Sigma_k=\frac1{N_k}\sum_n\gamma_{nk}(x_n-\mu_k)(x_n-\mu_k)^\top$, $\pi_k=N_k/N$.
- Repeat; the log-likelihood never decreases; converges to a local maximum (initialise with K-means).
- K-means is the limit of EM with equal spherical covariances and hard assignments.

## Self-test (fill in after lecture)
1. What does $\gamma_{nk}$ mean?
2. Why is the likelihood non-convex?
3. Problems with high-dimensional $\Sigma_k$ on faces (1024-dim)? *(singular covariances → use PCA first or diagonal covariance)*

## Mistakes log
-
