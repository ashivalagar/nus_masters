---
tags: [ee5101, core, exam-likely]
---
# State Feedback and Pole Placement
Course map: [[EE5101 Course Map]] · Source: [[L06 Linear State Feedback and Pole Placement.pdf]] ([[L06 Linear State Feedback and Pole Placement (annotated).pdf|annotated]]), problems [[P06 Problems.pdf]], solutions [[P06 Solutions.pdf]]
Needs: [[Controllability]], [[Canonical Forms Realizations Stability]], [[Eigenvalues and Eigenvectors]] · Next: [[LQR Quadratic Optimal Control]]

## 🧠 Mental picture — **virtual springs and dampers**
- For the double integrator (a mass), $u=-k_1x-k_2\dot x$ **is literally a spring ($k_1$) plus a damper ($k_2$) you added in software.** Pole placement = *tuning the spring stiffness and damper* so the mass settles as fast and smoothly as you like.
- Characteristic polynomial $s^2+k_2s+k_1$ ↔ the familiar $s^2+2\zeta\omega_ns+\omega_n^2$: $k_1=\omega_n^2$ (stiffness), $k_2=2\zeta\omega_n$ (damping).
- **Retuning a piano:** you can't change the piano's physics, but you can retune every string (move every pole) *provided you can reach every string* (controllability).
- **Price of fast poles = big forces.** A stiffer virtual spring needs a harder push; sensor noise gets amplified. That's the tension LQR formalises.
- **Multi-input = several hands on the controls:** many ways to achieve the same poles, so $K$ isn't unique.
- 👀 Try it: `10_pole_placement_effect.py`

![[10_pole_placement_effect.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Idea
Feed the state back: $u=-Kx+Fr$. Closed loop: $\dot x=(A-BK)x+BFr$. The poles of the closed loop are the eigenvalues of $A-BK$.
**Theorem:** if $(A,B)$ is controllable, $K$ can place the closed-loop eigenvalues anywhere (complex ones in conjugate pairs).

## Recipe (single input)
1. Check controllability.
2. Pick desired poles $\Rightarrow$ desired characteristic polynomial $\phi_d(s)=s^n+\alpha_{n-1}s^{n-1}+\dots+\alpha_0$.
3. Either (a) **match coefficients** of $\det(sI-A+BK)$ with $\phi_d(s)$, or (b) **Ackermann's formula** $K=(0\ \cdots\ 0\ \ 1)\,\mathcal C^{-1}\phi_d(A)$.
In controllable canonical form, $K=(\alpha_0-a_0,\ \alpha_1-a_1,\ \dots,\ \alpha_{n-1}-a_{n-1})$.

Multi-input: $K$ is **not unique** (extra freedom is used in the lecture's multi-input method).

## Worked example
Double integrator $A=\begin{pmatrix}0&1\\0&0\end{pmatrix},B=\begin{pmatrix}0\\1\end{pmatrix}$, want poles $-1,-2$, i.e. $\phi_d=s^2+3s+2$.
$A-BK=\begin{pmatrix}0&1\\-k_1&-k_2\end{pmatrix}$ has characteristic polynomial $s^2+k_2s+k_1$ → $K=(2,\ 3)$ ✓.

## Practical trade-offs
Faster poles ⇒ bigger gains $K$ ⇒ larger control effort and noise sensitivity. This tension is formalised in [[LQR Quadratic Optimal Control]].

## Self-test
1. Place poles at $-2\pm j$ for the double integrator. *(φ_d = s²+4s+5 → K = (5, 4))*
2. Why can't you place the pole of an uncontrollable mode? *(input has no influence on it)*
3. What does the feedforward gain $F$ do? *(sets the steady-state tracking — see [[Servo Control]])*

## Mistakes log
-
