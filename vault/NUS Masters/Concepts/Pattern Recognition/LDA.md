---
tags: [ee5907, core, exam-likely, assignment]
---
# LDA — Linear Discriminant Analysis (Fisher)
Course map: [[EE5907 Course Map]] · Source: [[W07 PCA and LDA (workshop, updated).pdf]] · Assignment: [[Assignment 2 Notes]] (part 1.3)
Needs: [[Eigenvalues and Eigenvectors]], [[Determinant Inverse and Rank]] · Compare: [[PCA]]

## 🧠 Mental picture
- **PCA is a photographer who wants the widest spread; LDA is a referee who wants the teams easiest to tell apart.** The referee looks for the camera angle where the two clusters are **far apart (between-class) and each tight (within-class)**.
- **Two schools of fish** overlapping in the water: the best viewing direction isn't along the long axis of the whole swarm — it is the direction that *pulls the schools apart*.
- **Small-sample trouble:** describing a person with 1024 measurements after meeting only 5 people — you can't estimate the spread reliably ($S_W$ singular). Fix: compress first with PCA, then run LDA (**Fisherfaces**).
- **At most $C-1$ directions:** $C$ class centres sit on a $(C-1)$-dimensional "flat", so no more separation directions exist.
- 👀 Try it: `19_pca_vs_lda.py`

![[19_pca_vs_lda.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Idea
**Supervised** projection that makes classes **far apart** (between-class scatter) yet each class **tight** (within-class scatter).

## Definitions
- Within-class scatter $S_W=\sum_c\sum_{x\in c}(x-\mu_c)(x-\mu_c)^\top$.
- Between-class scatter $S_B=\sum_cn_c(\mu_c-\mu)(\mu_c-\mu)^\top$.
- **Fisher criterion** for a direction $w$: $J(w)=\dfrac{w^\top S_Bw}{w^\top S_Ww}$. Maximiser solves the **generalized eigenproblem** $S_Bw=\lambda S_Ww$ (i.e. eigenvectors of $S_W^{-1}S_B$).
- **Two classes:** $w\propto S_W^{-1}(\mu_1-\mu_2)$.
- **At most $C-1$ useful directions** for $C$ classes (rank of $S_B$). With 26 classes ⇒ ≤ 25 directions — matching the assignment's $p=15$ and $25$.

## Small-sample-size problem
Images have $d=1024$ dimensions but few samples per class ⇒ $S_W$ is **singular**. Standard fix: **PCA first** (reduce to about $n-C$ dims), then LDA ("Fisherfaces"), or regularize $S_W+\epsilon I$.

## Worked example
Classes with means $(0,0)$ and $(4,0)$ and $S_W=I$: $w\propto(4,0)$ → project onto the x-axis; the classes separate by 4 units while each has unit spread.

## PCA vs LDA
| | PCA | LDA |
|---|---|---|
| Uses labels | no | yes |
| Goal | max variance | max class separability |
| Max dims | up to $d$ | $C-1$ |
| Risk | drops discriminative low-variance directions | overfits with few samples |

## Self-test
1. Max LDA dimensions for 10 classes? *(9)*
2. Why can $S_W$ be singular? *(fewer samples than dimensions)*
3. Which is better for classification, usually? *(LDA — if $S_W$ is handled)*

## Mistakes log
-
