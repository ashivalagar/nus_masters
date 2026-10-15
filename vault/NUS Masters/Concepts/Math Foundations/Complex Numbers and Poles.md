---
tags: [math, control]
---
# Complex Numbers and Poles
Prev: [[Eigenvalues and Eigenvectors]] · Next: [[ODE Basics and the Exponential]]

## 🧠 Mental picture — **the pole map**
Treat the complex plane as a **weather map for system behaviour**:
- **West ← →East = fate.** West (negative real part) = the disturbance dies out. East = it blows up. The further west, the *faster* it dies (like a ball rolling into a deep valley with thick syrup).
- **North/South = wobble.** Distance from the horizontal axis = how fast it oscillates (a spring bouncing). On the axis itself: no wobble at all.
- **Pole on the imaginary axis = a perfect pendulum with no friction:** never decays, never grows.
- **Memory hook:** "**L**eft = **L**ives (stable), **R**ight = **R**uns away."
- Poles are just the system's eigenvalues, so [[Eigenvalues and Eigenvectors]] and this note are the same story seen from two angles.
- 👀 Try it: `02_pole_map.py` — drag-like grid of poles with their time responses side by side.

![[02_pole_map.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Why you need it
A real matrix can have **complex eigenvalues** (they come in conjugate pairs $\sigma\pm j\omega$). In control, eigenvalues of $A$ are the system **poles**, and where they sit in the complex plane decides how the system behaves.

## Basics
- $j^2=-1$. A complex number is $a+bj$; conjugate $a-bj$; magnitude $\sqrt{a^2+b^2}$.
- Quadratic $\lambda^2+p\lambda+q=0$ has complex roots when $p^2-4q<0$: $\lambda=\frac{-p\pm j\sqrt{4q-p^2}}2$.
- **Euler:** $e^{(\sigma+j\omega)t}=e^{\sigma t}\big(\cos\omega t+j\sin\omega t\big)$.

## What the pole position means ($\lambda=\sigma+j\omega$)
- $\sigma$ (real part) = growth/decay rate: $\sigma<0$ decays, $\sigma>0$ explodes.
- $\omega$ (imaginary part) = oscillation frequency.
- **Continuous-time system $\dot x=Ax$ is asymptotically stable iff every eigenvalue has $\operatorname{Re}\lambda<0$** (left half-plane).

## Worked example
$\lambda^2+2\lambda+5=0\Rightarrow\lambda=-1\pm2j$. Response $\propto e^{-t}\cos2t$: oscillates at 2 rad/s while the envelope decays with time constant 1 s. Stable.

## Self-test
1. Is $\lambda=-0.1\pm5j$ stable? Fast or slow decay? *(stable; slow decay, lots of oscillation)*
2. Roots of $\lambda^2+4\lambda+13=0$? *(−2 ± 3j)*
3. Place poles to get fast, non-oscillatory decay: where? *(far left on the real axis)*

## Used in
[[Canonical Forms Realizations Stability]], [[State Feedback and Pole Placement]], [[System Modes]].

## Mistakes log
-
