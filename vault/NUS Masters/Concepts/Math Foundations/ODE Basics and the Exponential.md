---
tags: [math, control]
---
# ODE Basics and the Exponential
Prev: [[Complex Numbers and Poles]] · Next: [[Calculus and Gradients]]

## 🧠 Mental picture
- **$\dot x=-ax$ = a draining bathtub / cooling coffee.** The hotter the coffee is above the room, the faster it cools. Rate ∝ amount left ⇒ exponential decay. Time constant $\tau=1/a$: after one $\tau$ you're 63% of the way to room temperature, after $3\tau$ ≈ 95%.
- **$\dot x=+ax$ = compound interest / rabbits.** The more you have, the faster it grows — the unstable case.
- **$\dot x=Ax$ = many bathtubs connected by pipes.** The matrix $A$ describes the pipes; $e^{At}$ is the **fast-forward button**: "show me the water levels $t$ seconds from now".
- **Forced response = pebbles in a pond.** Every past push $u(\tau)$ creates ripples that fade by $e^{A(t-\tau)}$; the present state is the sum of all ripples (that's the convolution integral).
- 👀 Try it: `04_state_trajectories.py`

![[04_state_trajectories.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Scalar case
$\dot x=ax$ means "the rate of change is proportional to the current value". Solution: $x(t)=e^{at}x(0)$.
- $a<0$: decay with **time constant** $\tau=1/|a|$ (about 63% of the way to zero after one $\tau$).
- $a>0$: exponential growth (unstable). $a=0$: stays constant.
- With an input: $\dot x=ax+bu$. Solution = free response + forced response: $x(t)=e^{at}x(0)+\int_0^te^{a(t-\tau)}bu(\tau)\,d\tau$.

## Vector case
$\dot x=Ax$ has solution $x(t)=e^{At}x(0)$ where the **matrix exponential** is
$e^{At}=I+At+\frac{(At)^2}{2!}+\frac{(At)^3}{3!}+\cdots$
If $A=V\Lambda V^{-1}$ then $e^{At}=Ve^{\Lambda t}V^{-1}$, with $e^{\Lambda t}=\operatorname{diag}(e^{\lambda_1t},\dots,e^{\lambda_nt})$.
This is the heart of [[Matrix Exponential and State Solution]].

## Worked example
$A=\begin{pmatrix}-1&0\\0&-2\end{pmatrix}$ is diagonal, so $e^{At}=\begin{pmatrix}e^{-t}&0\\0&e^{-2t}\end{pmatrix}$ and from $x(0)=(1,1)$: $x(t)=(e^{-t},e^{-2t})$. Both states decay; the second decays twice as fast.

## Discrete-time twin
$x_{k+1}=Ax_k\Rightarrow x_k=A^kx_0$. Stable iff all $|\lambda_i|<1$ (inside the unit circle).

## Self-test
1. $\dot x=-3x$, $x(0)=2$: time constant and $x(1)$? *(1/3 s; 2e⁻³≈0.0996)*
2. Why is $\dot x=Ax$ stable iff all eigenvalues have negative real part? *(each mode is $e^{\lambda t}$)*
3. Show that $\frac d{dt}e^{At}=Ae^{At}$ from the series. *(differentiate term by term)*

## Mistakes log
-
