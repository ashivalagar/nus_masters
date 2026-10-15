---
tags: [ee5101, upcoming]
---
# Observers and State Estimation (upcoming — Lecture 10)
Course map: [[EE5101 Course Map]] · Needs: [[Observability]], [[State Feedback and Pole Placement]]
**Primer written before the lecture — update after class.**

## 🧠 Mental picture
- **A ship's navigator.** *Predict:* from speed and heading, estimate where the ship should be (your model $A\hat x+Bu$). *Correct:* whenever you get a landmark fix (measurement $y$), nudge the estimate by a fraction $L$ of the mismatch. A large $L$ = trust the instruments; a small $L$ = trust the model.
- **Observer error dynamics** $\dot e=(A-LC)e$ — the navigator's mistake dies out at a rate you choose by picking $L$.
- **Separation principle = pilot and navigator work independently.** The pilot (state feedback $K$) acts on the navigator's estimate; designing them separately still gives a stable team.
- **Why make the observer faster:** the navigator should update faster than the helm moves, otherwise the pilot steers by stale information.
- 👀 Try it: `13_observer_predict_correct.py`

![[13_observer_predict_correct.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Idea
You rarely measure the whole state. Build an **observer** that estimates it from $u$ and $y$ (Luenberger):
$$\dot{\hat x}=A\hat x+Bu+L(y-C\hat x)$$
Estimation error $e=x-\hat x$ obeys $\dot e=(A-LC)e$. If $(A,C)$ is observable, choose $L$ to put the eigenvalues of $A-LC$ wherever you like (it is pole placement on the dual pair $(A^\top,C^\top)$).

## Separation principle
Controller $u=-K\hat x$ with observer: closed-loop eigenvalues = eigenvalues of $(A-BK)$ ∪ eigenvalues of $(A-LC)$. Design $K$ and $L$ **independently**. Rule of thumb: make the observer 2–5× faster than the controller.

## Self-test
1. Why is observability required for arbitrary observer poles? *(duality with controllability)*
2. Where do the eigenvalues of the combined controller+observer system come from? *(union of A−BK and A−LC)*

## Mistakes log
-
