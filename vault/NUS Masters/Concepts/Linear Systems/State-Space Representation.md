---
tags: [ee5101, core]
---
# State-Space Representation
Course map: [[EE5101 Course Map]] · Source: [[L01 Introduction to Linear Control Systems.pdf]], [[L03 State-Space Dynamics and System Modes.pdf]]
Needs: [[Vectors and Matrices]] · Next: [[Matrix Exponential and State Solution]]

## 🧠 Mental picture
- **State = the "save file" of a video game.** The minimum information that lets you continue the game from now on without knowing how you got here. For a ball: position + velocity (not the whole history of throws).
- **$A$ = the rules of physics** (how the state evolves on its own), **$B$ = which joysticks connect to which parts**, **$C$ = which cameras/sensors you have**, **$D$ = direct "button-to-screen" shortcut** (usually 0).
- **Why more than one derivative?** A single number "position = 3 m" can't tell you whether the ball is going up or down. You need position **and** velocity — that's why a 2nd-order equation needs 2 states.
- **Similarity transform = changing units/axes**, not changing the physics. Same song, different key.
- 👀 Try it: `04_state_trajectories.py`

![[04_state_trajectories.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Idea
Instead of one high-order differential equation, describe a system with a **state vector** $x$ (the minimum memory needed to predict the future) and first-order equations:
$$\dot x=Ax+Bu,\qquad y=Cx+Du$$
$x\in\mathbb R^n$ state, $u\in\mathbb R^m$ input, $y\in\mathbb R^p$ output; $A$ is $n\times n$, $B$ is $n\times m$, $C$ is $p\times n$, $D$ is $p\times m$. Discrete-time version: $x_{k+1}=Ax_k+Bu_k$.

## Worked example — mass–spring–damper
$m\ddot q+c\dot q+kq=u$. Choose $x_1=q,\ x_2=\dot q$:
$$\dot x=\begin{pmatrix}0&1\\-k/m&-c/m\end{pmatrix}x+\begin{pmatrix}0\\1/m\end{pmatrix}u,\qquad y=\begin{pmatrix}1&0\end{pmatrix}x$$
General recipe: an $n$-th order ODE → $n$ states (the variable and its first $n-1$ derivatives).

## Key facts
- **Transfer function:** $G(s)=C(sI-A)^{-1}B+D$. Its poles are eigenvalues of $A$ (for a minimal realization — see [[Canonical Forms Realizations Stability]]).
- State-space representation is **not unique**: $x=Tz$ gives an equivalent $(T^{-1}AT,T^{-1}B,CT,D)$ with the same eigenvalues and transfer function.
- Why state-space? Handles multi-input multi-output (MIMO), time-domain design, optimal control and estimation.

## Self-test
1. Write $\ddot y+4\dot y+3y=2u$ in state-space form. *(x=(y,ẏ): A=[[0,1],[−3,−4]], B=[0,2]ᵀ, C=[1 0])*
2. Dimensions of $A,B,C$ for 3 states, 2 inputs, 1 output? *(3×3, 3×2, 1×3)*
3. Poles of the mass–spring–damper? *(eigenvalues of A: roots of $ms^2+cs+k$)*

## Mistakes log
-
