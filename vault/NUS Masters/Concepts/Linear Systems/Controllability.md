---
tags: [ee5101, core, exam-likely]
---
# Controllability
Course map: [[EE5101 Course Map]] · Source: [[L04 Controllability and Observability.pdf]]
Needs: [[Determinant Inverse and Rank]], [[System Modes]] · Dual: [[Observability]] · Used by: [[State Feedback and Pole Placement]]

## 🧠 Mental picture
- **Two-room house, one heater in room 1.** If the rooms are completely walled off from each other, you can never warm room 2 — **uncontrollable**. Open a door between them (coupling in $A$) and heat flows → **controllable**.
- **The rank test = "does each delayed push add a new direction?"** Column $B$ = pushing now; $AB$ = what that push becomes after the system evolves one beat; $A^2B$ = after two beats… If these directions together fill the whole state space, you can steer anywhere.
- **PBH test per mode:** "is there a lever connected to *this particular tone*?" Test each eigenvalue.
- **Car analogy:** a steering wheel only helps if wheel motion reaches the tyres. A broken link means that mode can't be steered.
- *Where it breaks:* "controllable" says it's *possible*, not that it's *cheap* — nearly-uncontrollable modes need huge inputs.
- 👀 Try it: `09_controllability_rooms.py`

![[09_controllability_rooms.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Definition
$(A,B)$ is **controllable** if for any initial state and any target state there is an input $u(t)$ that moves the system there in finite time.

## Tests
- **Kalman rank test:** $\mathcal C=[\,B\ \ AB\ \ A^2B\ \cdots\ A^{n-1}B\,]$ has rank $n$.
- **PBH test:** $\operatorname{rank}[\,\lambda I-A\ \ B\,]=n$ for every eigenvalue $\lambda$ of $A$ (also tells *which mode* is uncontrollable).
- **Gramian:** $W_c(t)=\int_0^te^{A\tau}BB^\top e^{A^\top\tau}d\tau$ is non-singular.

## Worked examples
1. $A=\begin{pmatrix}0&1\\-2&-3\end{pmatrix},B=\begin{pmatrix}0\\1\end{pmatrix}$: $AB=\begin{pmatrix}1\\-3\end{pmatrix}$, $\mathcal C=\begin{pmatrix}0&1\\1&-3\end{pmatrix}$, $\det=-1\ne0$ → rank 2 → **controllable**.
2. $A=\begin{pmatrix}-1&0\\0&-2\end{pmatrix},B=\begin{pmatrix}1\\0\end{pmatrix}$: $AB=\begin{pmatrix}-1\\0\end{pmatrix}$, $\mathcal C=\begin{pmatrix}1&-1\\0&0\end{pmatrix}$ rank 1 → **not controllable**: the second state never sees the input.

## Physical meaning
Is there a lever connected to every internal mode? If a mode is uncontrollable, **no** feedback can move its pole — so pole placement is impossible for it.

## Self-test
1. Why does the test stop at $A^{n-1}B$? *(Cayley–Hamilton: higher powers are combinations of lower ones)*
2. Controllable with $B=(1,1)^\top$ and $A=\operatorname{diag}(1,1)$? *(AB=B → rank 1 → no; repeated eigenvalue, single input)*

## Mistakes log
-
