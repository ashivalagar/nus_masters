---
tags: [math, linear-algebra]
---
# Vectors and Matrices
Next: [[Determinant Inverse and Rank]] · Roadmap: [[00 Math Roadmap]]

## 🧠 Mental picture
- **A vector is a GPS coordinate; a matrix is a machine that moves every coordinate.** Picture a grid drawn on a rubber sheet. A matrix stretches, squeezes, rotates or shears the sheet — and every point rides along.
- **Multiplying matrices = running machines one after another.** Socks-then-shoes ≠ shoes-then-socks, which is exactly why $AB\ne BA$.
- **Dot product = "how much do these two arrows agree?"** Same direction → big positive, perpendicular → 0 (they ignore each other), opposite → negative. A dot product is just a *shadow*: how long is the shadow of $x$ on $y$?
- *Where it breaks:* a matrix can also change dimension (3-D in, 2-D out) — think "projector", not just "rubber sheet".
- 👀 Try it: [[Visual Labs]] → `03_matrix_as_machine.py`

![[03_matrix_as_machine.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Intuition
- A **vector** $x\in\mathbb R^n$ is a list of $n$ numbers (a point or arrow). A **matrix** $A$ ($m\times n$) is a table of numbers that **transforms** vectors: $y = Ax$ turns an $n$-vector into an $m$-vector.
- In control, a vector holds the *state* of a system. In pattern recognition, a vector is one *data point* (e.g. a face image flattened into 1024 numbers).

## Rules to know cold
- Dot product: $x^\top y=\sum_i x_iy_i$. Length: $\|x\|=\sqrt{x^\top x}$. Orthogonal if $x^\top y=0$.
- Matrix–vector product: each output entry is a row of $A$ dotted with $x$.
- Matrix product $AB$: entry $(i,j)$ = row $i$ of $A$ · column $j$ of $B$. Sizes must match: $(m\times n)(n\times p)=(m\times p)$.
- **Not commutative:** $AB\neq BA$ in general. But $(AB)C=A(BC)$ and $(AB)^\top=B^\top A^\top$.
- Identity $I$: $AI=IA=A$. Transpose $A^\top$ swaps rows and columns. Symmetric: $A=A^\top$.
- Trace: sum of diagonal entries.

## Worked example
$A=\begin{pmatrix}1&2\\3&4\end{pmatrix},\ B=\begin{pmatrix}0&1\\1&0\end{pmatrix}$

$AB=\begin{pmatrix}1\cdot0+2\cdot1 & 1\cdot1+2\cdot0\\ 3\cdot0+4\cdot1 & 3\cdot1+4\cdot0\end{pmatrix}=\begin{pmatrix}2&1\\4&3\end{pmatrix}$ (columns of $A$ swapped)

$BA=\begin{pmatrix}3&4\\1&2\end{pmatrix}$ (rows of $A$ swapped) — so $AB\ne BA$.

## Where it appears
State equation $\dot x=Ax+Bu$ ([[State-Space Representation]]); data matrix $X$ in [[PCA]]; weights in [[MLP and Backpropagation]].

## Self-test
1. Compute $\begin{pmatrix}2&0\\1&3\end{pmatrix}\begin{pmatrix}1\\2\end{pmatrix}$. *(Answer: (2, 7))*
2. If $A$ is $3\times2$ and $B$ is $2\times4$, what size is $AB$? Is $BA$ defined? *(3×4; no)*
3. Are $(1,2,2)$ and $(2,-1,0)$ orthogonal? *(2−2+0=0 → yes)*

## Mistakes log
-
