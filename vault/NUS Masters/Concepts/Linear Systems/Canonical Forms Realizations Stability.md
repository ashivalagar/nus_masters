---
tags: [ee5101, core, exam-likely]
---
# Canonical Forms, Realizations and Stability
Course map: [[EE5101 Course Map]] · Source: [[L05 Canonical Forms Realizations and Stability.pdf]]
Needs: [[Controllability]], [[Observability]], [[Complex Numbers and Poles]]

## 🧠 Mental picture
- **Canonical form = writing the system in a standard "recipe card" layout.** Same dish (same input–output behaviour), but the card format makes the poles readable straight off the last row — that's why pole placement is easy there.
- **Realization = an engineering blueprint for a transfer function.** Many blueprints exist; the **minimal** one has no useless parts. A hidden **tank with no inlet/outlet connected to the rest** (uncontrollable/unobservable mode) adds order but nothing you can see — pole–zero cancellation.
- **Stability = a marble.** In a bowl (all poles in the left half-plane): returns. On a hilltop: rolls away. On a flat table (pole on the imaginary axis): stays wherever it lands.
- **Lyapunov = "generalised energy".** Find an energy-like bowl $V=x^\top Px$ that **always decreases** along trajectories ($\dot V=-x^\top Qx<0$) — if it exists, the system must settle at 0, like a marble losing energy to friction. The Lyapunov equation just *computes* the bowl.
- **Internal vs BIBO stability:** BIBO only looks through the output window; internal stability checks the whole house.
- 👀 Try it: `02_pole_map.py`

![[02_pole_map.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Equivalent representations
$x=Tz$ (invertible $T$) gives $\bar A=T^{-1}AT,\ \bar B=T^{-1}B,\ \bar C=CT$. Eigenvalues, transfer function, controllability and observability are unchanged.

## Canonical forms (SISO)
For $G(s)=\dfrac{b_{n-1}s^{n-1}+\dots+b_0}{s^n+a_{n-1}s^{n-1}+\dots+a_0}$, the **controllable canonical form** is
$$A=\begin{pmatrix}0&1&&\\&\ddots&\ddots&\\&&0&1\\-a_0&-a_1&\cdots&-a_{n-1}\end{pmatrix},\ B=\begin{pmatrix}0\\\vdots\\0\\1\end{pmatrix},\ C=(b_0\ \cdots\ b_{n-1}).$$
The last row of $A$ holds the characteristic polynomial coefficients — which makes **pole placement trivial** ([[State Feedback and Pole Placement]]). The **observable canonical form** is its dual. The **modal/Jordan form** shows the modes directly.

## Realizations
A **realization** is any $(A,B,C,D)$ with $C(sI-A)^{-1}B+D=G(s)$. A **minimal realization** has the smallest possible $n$; it is both controllable **and** observable. Pole–zero cancellations in $G(s)$ correspond to uncontrollable/unobservable modes.

## Stability
- **Asymptotic (internal) stability** of $\dot x=Ax$: all eigenvalues satisfy $\operatorname{Re}\lambda<0$.
- **Marginal:** eigenvalues on the imaginary axis, none repeated (in a Jordan block). Unstable otherwise.
- **BIBO stability:** bounded input → bounded output; poles of $G(s)$ in the left half-plane. Internal stability ⇒ BIBO; the converse can fail when an unstable mode is hidden.
- **Lyapunov:** $A$ is asymptotically stable iff for every $Q\succ0$ the equation $A^\top P+PA=-Q$ has a unique solution $P\succ0$. Then $V(x)=x^\top Px$ decreases along trajectories ($\dot V=-x^\top Qx$).

## Worked example (Lyapunov, scalar)
$\dot x=-x$: $2aP=-Q$ with $a=-1,Q=1$ gives $P=\tfrac12>0$ → stable.
Stability check of $A=\begin{pmatrix}0&1\\-2&-3\end{pmatrix}$: eigenvalues $-1,-2$ → asymptotically stable.

## Self-test
1. Write $G(s)=\dfrac{s+3}{s^2+4s+5}$ in controllable canonical form. *(A=[[0,1],[−5,−4]], B=[0,1]ᵀ, C=[3 1])*
2. Is a realization of order 3 of $G(s)=\frac1{s+1}$ minimal? *(no — minimal order is 1)*
3. Eigenvalues $0$ and $-2$: stable? *(marginally stable at best — not asymptotically)*

## Mistakes log
-
