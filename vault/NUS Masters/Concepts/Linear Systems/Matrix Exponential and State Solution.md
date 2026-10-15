---
tags: [ee5101, core]
---
# Matrix Exponential and State Solution
Course map: [[EE5101 Course Map]] · Source: [[L03 State-Space Dynamics and System Modes.pdf]]
Needs: [[ODE Basics and the Exponential]], [[Eigenvalues and Eigenvectors]] · Prev: [[State-Space Representation]] · Next: [[System Modes]]

## 🧠 Mental picture
- **$e^{At}$ = the fast-forward button.** Give it the state now, and it returns the state $t$ seconds later (if you leave the system alone).
- **Free + forced response = a pond with pebbles.** The free response is the ripple from the initial splash; every push $u(\tau)$ you apply is a new pebble whose ripple has aged by $t-\tau$ seconds. The state is the sum of all ripples (that's the convolution integral).
- **Cayley–Hamilton = "a matrix obeys its own characteristic equation"** — so any power $A^k$ can be reduced to a combination of $I,A,\dots,A^{n-1}$. That's why $e^{At}=\alpha_0I+\alpha_1A$ works for 2×2 (exam Q1a!).
- **Repeated eigenvalue → $te^{\lambda t}$:** two bells tuned to the exact same pitch: the energy swaps between them and you get an extra "×t" growth envelope.
- 👀 Try it: `04_state_trajectories.py`

![[04_state_trajectories.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Solution of $\dot x=Ax+Bu$
$$x(t)=\underbrace{e^{At}x(0)}_{\text{free (zero-input)}}+\underbrace{\int_0^te^{A(t-\tau)}Bu(\tau)\,d\tau}_{\text{forced (zero-state)}}$$
$\Phi(t)=e^{At}$ is the **state-transition matrix**. Properties: $\Phi(0)=I$, $\dot\Phi=A\Phi$, $\Phi(t_1+t_2)=\Phi(t_1)\Phi(t_2)$, $\Phi(t)^{-1}=\Phi(-t)$.

## Three ways to compute $e^{At}$
1. **Diagonalization:** $e^{At}=Ve^{\Lambda t}V^{-1}$ (distinct eigenvalues).
2. **Laplace:** $e^{At}=\mathcal L^{-1}\{(sI-A)^{-1}\}$.
3. **Jordan form / Cayley–Hamilton** for repeated eigenvalues. A Jordan block of size 2 produces terms like $te^{\lambda t}$.

## Worked example
$A=\begin{pmatrix}0&1\\-2&-3\end{pmatrix}$ (eigenvalues $-1,-2$).
$(sI-A)^{-1}=\dfrac1{(s+1)(s+2)}\begin{pmatrix}s+3&1\\-2&s\end{pmatrix}$. Partial fractions, e.g. entry (1,1): $\frac{s+3}{(s+1)(s+2)}=\frac2{s+1}-\frac1{s+2}$. Result:
$$e^{At}=\begin{pmatrix}2e^{-t}-e^{-2t}&e^{-t}-e^{-2t}\\-2e^{-t}+2e^{-2t}&-e^{-t}+2e^{-2t}\end{pmatrix}$$
Checks: at $t=0$ it is $I$ ✓; derivative at $0$ equals $A$ ✓.

## Self-test
1. What is $e^{At}$ for $A=\begin{pmatrix}0&1\\0&0\end{pmatrix}$? *(series stops: [[1,t],[0,1]])*
2. What does $\Phi(t)^{-1}=\Phi(-t)$ mean physically? *(you can run the system backwards in time)*
3. Why does a repeated eigenvalue add $te^{\lambda t}$? *(non-trivial Jordan block)*

## Mistakes log
-
