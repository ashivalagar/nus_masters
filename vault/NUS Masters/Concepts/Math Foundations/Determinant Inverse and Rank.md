---
tags: [math, linear-algebra]
---
# Determinant, Inverse and Rank
Prev: [[Vectors and Matrices]] · Next: [[Eigenvalues and Eigenvectors]]

## 🧠 Mental picture
- **Determinant = area scale factor.** Press the unit square through the machine: if it comes out with area 3, then $\det=3$. If it comes out **flattened to a line**, area 0 → $\det=0$: *singular*.
- **Inverse = the undo button.** Possible only if nothing got squashed. A machine that flattens a 3-D object into a shadow can't be undone — you cannot recover depth from a shadow.
- **Rank = how many independent "directions of information" survive.** A 3-D object's shadow on a wall has rank 2. A shadow cast as a single line has rank 1.
- **Controllability / observability tests are rank tests** — they ask "did *all* the dimensions survive?" Keep this picture for [[Controllability]].
- 👀 Try it: `03_matrix_as_machine.py` (watch the unit square squash when $\det\to0$)

![[03_matrix_as_machine.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Ideas
- **Inverse** $A^{-1}$ undoes $A$: $A^{-1}A=AA^{-1}=I$. It exists only for square, non-singular matrices.
- **Determinant** $\det A$ is a number; $A$ is invertible iff $\det A\neq0$. For $2\times2$: $\det\begin{pmatrix}a&b\\c&d\end{pmatrix}=ad-bc$ and
  $A^{-1}=\frac1{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$.
- **Rank** = number of linearly independent rows (equivalently columns). A square $n\times n$ matrix is invertible iff rank $=n$ ("full rank").
- Solving $Ax=b$: $x=A^{-1}b$ if invertible. Never form the inverse in code if you can solve the system.

## Worked example
$A=\begin{pmatrix}2&1\\1&1\end{pmatrix}$: $\det=2\cdot1-1\cdot1=1$, so
$A^{-1}=\begin{pmatrix}1&-1\\-1&2\end{pmatrix}$. Check: $A A^{-1}=\begin{pmatrix}2-1&-2+2\\1-1&-1+2\end{pmatrix}=I$ ✓.

Rank example: $\begin{pmatrix}1&2\\2&4\end{pmatrix}$ — row 2 = 2 × row 1, so rank 1, $\det=0$, **singular**.

## Where it appears
- [[Controllability]] / [[Observability]] are *rank tests* on big matrices.
- [[LDA]]: $S_W^{-1}$ must exist (small-sample problem when it doesn't).
- [[Gaussian Distribution]]: $\Sigma^{-1}$ and $|\Sigma|$.
- Least squares: $(X^\top X)^{-1}X^\top y$ ([[Linear Discriminants Perceptron Logistic LSE]]).

## Self-test
1. Invert $\begin{pmatrix}1&2\\3&4\end{pmatrix}$. *(det=−2 → ½·[[4,−2],[−3,1]] = [[−2,1],[1.5,−0.5]])*
2. Rank of $\begin{pmatrix}1&0&1\\0&1&1\\1&1&2\end{pmatrix}$? *(row3 = row1+row2 → rank 2)*

## Mistakes log
-
