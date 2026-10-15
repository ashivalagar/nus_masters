---
tags: [math, linear-algebra, core]
---
# Eigenvalues and Eigenvectors
Prev: [[Determinant Inverse and Rank]] · Next: [[Complex Numbers and Poles]]

## 🧠 Mental picture
- **Eigenvectors are the "grain" of a matrix.** Stretch the rubber sheet: almost every line gets twisted, but a few special lines stay on themselves and only get longer or shorter. Those are the eigenvectors; the stretch factors are the eigenvalues.
- **Spinning globe:** the axis stays put — it is the eigenvector of the rotation with $\lambda=1$.
- **Swing / guitar string:** push a swing at its natural frequency and it responds strongly — natural frequencies of a system are its eigenvalues. A struck bell rings at its eigenvalues.
- **Cloud shape (PCA):** a covariance matrix describes an egg-shaped cloud; eigenvectors = the egg's long and short axes, eigenvalues = how stretched along each.
- **Slogan:** *"Find the directions where the matrix is boring — then everything else is a combination of boring things."* (That is diagonalization.)
- *Where it breaks:* non-symmetric matrices can have complex eigenvalues = rotation mixed in (the "grain" spirals).
- 👀 Try it: `01_eigenvectors.py`

![[01_eigenvectors.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Intuition
Most vectors get rotated *and* stretched by a matrix. An **eigenvector** $v\neq0$ only gets **stretched**: $Av=\lambda v$. The stretch factor $\lambda$ is the **eigenvalue**. They reveal the "natural directions" of a matrix.

## How to compute
1. Solve the **characteristic equation** $\det(A-\lambda I)=0$ for $\lambda$.
2. For each $\lambda$, solve $(A-\lambda I)v=0$ for $v$.

Handy facts: $\sum\lambda_i=\operatorname{trace}(A)$, $\prod\lambda_i=\det(A)$.
**Diagonalization:** if $A$ has $n$ independent eigenvectors, $A=V\Lambda V^{-1}$ ($V$ = eigenvectors as columns, $\Lambda$ = diagonal of eigenvalues). Then $A^k=V\Lambda^kV^{-1}$.
**Symmetric matrices** (e.g. covariance matrices) have real eigenvalues and orthogonal eigenvectors.

## Worked example 1
$A=\begin{pmatrix}1&2\\2&1\end{pmatrix}$. $\det(A-\lambda I)=(1-\lambda)^2-4=0\Rightarrow\lambda=3,\,-1$.
- $\lambda=3$: $\begin{pmatrix}-2&2\\2&-2\end{pmatrix}v=0\Rightarrow v=(1,1)$.
- $\lambda=-1$: $\begin{pmatrix}2&2\\2&2\end{pmatrix}v=0\Rightarrow v=(1,-1)$.
Check: sum $=2=$ trace ✓, product $=-3=\det$ ✓. Eigenvectors are orthogonal (symmetric matrix).

## Worked example 2 (a control-system matrix)
$A=\begin{pmatrix}0&1\\-2&-3\end{pmatrix}$: $\det(A-\lambda I)=\lambda^2+3\lambda+2=(\lambda+1)(\lambda+2)\Rightarrow\lambda=-1,-2$.
Both negative → the system $\dot x=Ax$ is **stable** (see [[Complex Numbers and Poles]], [[System Modes]]).

## Where it appears
- **EE5101:** eigenvalues of $A$ = system poles; modes, stability, pole placement.
- **EE5907:** [[PCA]] = eigen-decomposition of the covariance matrix; [[LDA]] = generalized eigenproblem.

## Self-test
1. Eigenvalues of $\begin{pmatrix}4&1\\2&3\end{pmatrix}$? *(λ²−7λ+10=0 → 5, 2)*
2. A matrix has eigenvalues 2 and −3. Its trace and determinant? *(−1 and −6)*
3. Why does a symmetric matrix make PCA well-behaved? *(real eigenvalues, orthogonal directions)*

## Mistakes log
-
