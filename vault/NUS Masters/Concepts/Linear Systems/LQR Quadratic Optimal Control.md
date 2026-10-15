---
tags: [ee5101, core, exam-likely]
---
# LQR — Quadratic Optimal Control
Course map: [[EE5101 Course Map]] · Source: [[L07 Quadratic Optimal Control.pdf]] ([[L07 Quadratic Optimal Control (annotated).pdf|annotated]]), problems [[P07 Problems.pdf]], solutions [[P07 Solutions.pdf]], code [[satellite_sim.zip]]
Needs: [[State Feedback and Pole Placement]], [[Calculus and Gradients]]

## 🧠 Mental picture
- **A taxi driver balancing time vs petrol.** $Q$ = how much you hate being late (state error); $R$ = how much you hate burning fuel (control effort). LQR finds the cheapest overall journey. Big $Q$ → drive aggressively; big $R$ → coast gently.
- **Bank-account view:** every second you pay "error tax" $x^\top Qx$ plus "effort tax" $u^\top Ru$. LQR minimises the total tax bill forever.
- **Riccati equation = "price of being in state $x$".** $x^\top Px$ is the minimum future tax you will pay starting from $x$. A valuable result: the best strategy is just a gain, $u=-Kx$.
- **Guaranteed stable** (under the assumptions) — an optimal driver never drives off the cliff.
- **Pole placement vs LQR:** pole placement = "I choose the destination of the poles"; LQR = "I choose the *priorities* and the maths chooses the poles".
- 👀 Try it: `11_lqr_tradeoff.py`

![[11_lqr_tradeoff.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Problem
Minimize $J=\int_0^\infty(x^\top Qx+u^\top Ru)\,dt$ with $Q\succeq0,\ R\succ0$ for $\dot x=Ax+Bu$.
- $Q$ penalises state error, $R$ penalises control effort. **Big $Q$/small $R$ → aggressive; small $Q$/big $R$ → gentle.**

## Solution
$u=-Kx,\quad K=R^{-1}B^\top P$, where $P\succeq0$ solves the **algebraic Riccati equation (ARE)**
$$A^\top P+PA-PBR^{-1}B^\top P+Q=0.$$
Conditions (the lecture's "assumptions"): $(A,B)$ stabilizable and $(Q^{1/2},A)$ detectable ⇒ closed loop $A-BK$ is asymptotically stable.

## Worked example — scalar
$\dot x=ax+bu$, weights $q,r$. ARE: $2aP-\frac{b^2}rP^2+q=0\Rightarrow P=\frac r{b^2}\Big(a+\sqrt{a^2+\tfrac{qb^2}r}\Big)$ (positive root).
$K=\frac{bP}r=\frac1b\Big(a+\sqrt{a^2+\tfrac{qb^2}r}\Big)$ and the closed-loop pole is $a-bK=-\sqrt{a^2+\tfrac{qb^2}r}$ — always stable.
Numbers: $a=b=q=r=1$ → $K=1+\sqrt2\approx2.41$, closed-loop pole $-\sqrt2\approx-1.41$.

## Compare with pole placement
Pole placement: *you* choose pole locations. LQR: *you* choose cost weights and the optimization decides the poles — with good robustness margins.

## Self-test
1. What happens to $K$ as $r\to\infty$ (scalar case)? *(stable plant, a<0: K→0, do nothing; unstable plant, a>0: K→2a/b, which just mirrors the pole to −a — LQR never wastes effort beyond stabilising)*
2. In the scalar example with $a=0$, find $K$ and the pole. *(K=√(q/r), pole = −b√(q/r))*
3. Why must $R\succ0$? *(otherwise R⁻¹ is undefined / infinite control allowed)*

## Mistakes log
-
