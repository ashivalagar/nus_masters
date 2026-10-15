---
tags: [ee5101, core, exam-likely]
---
# Observability
Course map: [[EE5101 Course Map]] · Source: [[L04 Controllability and Observability.pdf]]
Dual of: [[Controllability]] · Used by: [[Observers and State Estimation]]

## 🧠 Mental picture
- **Same two rooms, but now with one thermometer** in room 1. If the rooms are walled off, room 2's temperature is **invisible** — unobservable. With a door open, room 2's temperature leaks into room 1's reading, so you can reconstruct it.
- **Detective with a keyhole:** you only see part of the scene (outputs $y$); observability asks whether the watched part, over time, reveals the whole story.
- **Duality = the same road map with all one-way streets reversed.** Controllability: can the input *reach* every state? Observability: can every state *reach* the output? Reverse the arrows ⇒ swap $(A,B)\leftrightarrow(A^\top,C^\top)$.
- **Why hidden unstable modes are dangerous:** a smouldering fire in an unmonitored room.
- 👀 Try it: `09_controllability_rooms.py`

![[09_controllability_rooms.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Definition
$(A,C)$ is **observable** if the initial state can be recovered from the output $y(t)$ (and input) over a finite time.

## Tests
- **Rank test:** $\mathcal O=\begin{pmatrix}C\\CA\\\vdots\\CA^{n-1}\end{pmatrix}$ has rank $n$.
- **PBH:** $\operatorname{rank}\begin{pmatrix}\lambda I-A\\C\end{pmatrix}=n$ for all eigenvalues $\lambda$.

## Duality
$(A,C)$ observable $\iff(A^\top,C^\top)$ controllable. Every controllability result has an observability twin — study one, get the other free.

## Worked example
$A=\begin{pmatrix}0&1\\-2&-3\end{pmatrix}$, $C=(1\ \ 0)$: $CA=(0\ \ 1)$, $\mathcal O=I$ → rank 2 → **observable** (measuring position lets you reconstruct velocity).
With $C=(0\ \ 0)$ nothing is observable. With $A=\operatorname{diag}(-1,-2)$, $C=(1\ \ 0)$: $\mathcal O=\begin{pmatrix}1&0\\-1&0\end{pmatrix}$ rank 1 → second mode hidden.

## Physical meaning
Can you *see* every internal mode through the sensors? Unobservable modes can hide instability.

## Self-test
1. State the dual of "the PBH test for controllability". *(rank [λI−Aᵀ, Cᵀ] = n)*
2. Is observability affected by $B$? *(no)*

## Mistakes log
-
