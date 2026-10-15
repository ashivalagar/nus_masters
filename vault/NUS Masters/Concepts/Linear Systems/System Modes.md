---
tags: [ee5101]
---
# System Modes
Course map: [[EE5101 Course Map]] · Source: [[L03 State-Space Dynamics and System Modes.pdf]]
Needs: [[Eigenvalues and Eigenvectors]], [[Complex Numbers and Poles]] · Prev: [[Matrix Exponential and State Solution]] · Next: [[Controllability]]

## 🧠 Mental picture
- **Modes = the pure tones of a chord.** Strike a bell: you hear several pure notes, each decaying at its own rate. A linear system's response is a sum of such notes ($e^{\lambda_it}$).
- **Modal decomposition = a stereo equaliser.** Slide every frequency band separately; the output is the sum of bands.
- **Slow mode wins in the long run.** Bass notes outlast treble. The pole closest to the imaginary axis dominates the tail ("dominant pole").
- **Why starting along an eigenvector matters:** if you pluck only one string, only that string rings — exam Q1c: starting on the $-1$ eigenvector never excites the unstable $+3$ mode.
- 👀 Try it: `01_eigenvectors.py` and `02_pole_map.py`

![[01_eigenvectors.png]]
![[02_pole_map.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Idea
With $A=V\Lambda V^{-1}$ (distinct eigenvalues), the free response is a sum of **modes**:
$$x(t)=\sum_{i=1}^ne^{\lambda_it}\,v_i\,(w_i^\top x(0)),\qquad w_i^\top=\text{row } i \text{ of } V^{-1}$$
Each mode is an eigenvector direction $v_i$ evolving as $e^{\lambda_it}$. Complex pairs give oscillating modes. Changing coordinates $x=Vz$ **decouples** the system into $n$ scalar equations $\dot z_i=\lambda_iz_i$.

## Why it matters
- **Stability** = all modes decay ([[Canonical Forms Realizations Stability]]).
- **Controllability of a mode** fails if $w_i^\top B=0$ (input cannot reach it). **Observability of a mode** fails if $Cv_i=0$ (output cannot see it) — the PBH tests, see [[Controllability]] and [[Observability]].
- Pole placement moves the eigenvalues ([[State Feedback and Pole Placement]]).

## Worked example
$A=\begin{pmatrix}0&1\\-2&-3\end{pmatrix}$: eigenvalues $-1,-2$ with eigenvectors $(1,-1)$ and $(1,-2)$. Starting along $(1,-1)$ the state shrinks like $e^{-t}$ and stays on that line; starting along $(1,-2)$ it shrinks like $e^{-2t}$ (faster).

## Self-test
1. Mode with $\lambda=-2\pm3j$: behaviour? *(decaying oscillation, envelope e^{−2t}, 3 rad/s)*
2. Which mode dominates for large $t$ if the eigenvalues are $-1$ and $-10$? *(the slow one, −1)*

## Mistakes log
-
