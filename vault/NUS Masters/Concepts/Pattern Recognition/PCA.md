---
tags: [ee5907, core, exam-likely, assignment]
---
# PCA — Principal Component Analysis
Course map: [[EE5907 Course Map]] · Source: [[W07 PCA and LDA (workshop, updated).pdf]] · Assignment: [[Assignment 2 Notes]] (part 1.2)
Needs: [[Eigenvalues and Eigenvectors]], [[Expectation Variance Covariance]] · Compare: [[LDA]]

## 🧠 Mental picture
- **Best camera angle for a shadow.** Shine a light on a 3-D cloud and look at its shadow on the wall. Rotate the cloud until the **shadow is as spread out as possible** — that direction is PC1. A pencil seen end-on casts a dot (useless); seen from the side it casts a long line (informative).
- **Eigenfaces = the "ingredients" of faces.** Every face ≈ the **average face** + a recipe of ghost-like face templates (eigenfaces). Fewer ingredients = lossy compression (like a JPEG), but the first few already capture lighting and pose.
- **Cloud-shape view:** PCA fits an egg to the data cloud and returns its axes.
- **Warning:** PCA keeps what *varies most*, not what *separates classes* — the bright-vs-dim lighting variation in faces may outrank the person-to-person variation.
- 👀 Try it: `19_pca_vs_lda.py`

![[19_pca_vs_lda.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Idea
Find orthogonal directions along which the data vary **most** (unsupervised). Project onto the top $p$ of them to reduce dimension while keeping as much variance as possible.

## Algorithm
1. Centre the data: $\tilde x_i=x_i-\bar x$.
2. Covariance $S=\frac1{n-1}\tilde X^\top\tilde X$ ($\tilde X$ is $n\times d$).
3. Eigen-decompose $S=U\Lambda U^\top$; sort eigenvalues $\lambda_1\ge\lambda_2\ge\cdots$.
4. Keep the first $p$ eigenvectors $U_p$ (the **principal components**). Projection $y=U_p^\top(x-\bar x)$.
5. **Variance retained** $=\sum_{i\le p}\lambda_i/\sum_i\lambda_i$. **Reconstruction** $\hat x=\bar x+U_py$.
Equivalent: SVD of $\tilde X$ — right singular vectors are the PCs, $\lambda_i=s_i^2/(n-1)$.

**Practical trick for images ($d\gg n$):** eigen-decompose the small $n\times n$ matrix $\tilde X\tilde X^\top$ and map back, instead of the huge $d\times d$ covariance (1024×1024 is fine, but this matters for larger images). The PC "images" are **eigenfaces**.

## Worked example
Points $(1,1),(2,2),(3,3)$ → centred $(-1,-1),(0,0),(1,1)$; $S=\begin{pmatrix}1&1\\1&1\end{pmatrix}$ with eigenvalues $2,0$; PC1 $=(1,1)/\sqrt2$; projections $-\sqrt2,0,\sqrt2$; 100% variance in one component.

## Strengths / limits
Linear only; unsupervised (may discard class-discriminative directions); sensitive to feature scaling; assumes variance = importance.

## Self-test
1. Why centre the data first? *(otherwise PC1 chases the mean, not the spread)*
2. PCA eigenvalues 5, 3, 2: variance kept by the first two? *(80%)*
3. When might PCA hurt classification? *(discriminative direction has low variance)*

## Mistakes log
-
