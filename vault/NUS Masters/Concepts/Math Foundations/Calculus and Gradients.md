---
tags: [math, calculus, ml]
---
# Calculus and Gradients
Prev: [[ODE Basics and the Exponential]] · Next: [[Probability Basics]]

## 🧠 Mental picture
- **Gradient descent = a hiker in thick fog.** You can't see the valley, but you can feel the slope under your boots. Step opposite to the slope ($-\nabla L$). The **learning rate** is your stride: tiny steps take forever, giant strides overshoot the valley and ping-pong across it.
- **Loss surface = a landscape.** Neural network training is hiking in a landscape with millions of dimensions.
- **Chain rule = a train of gears.** Turn the first gear 1°; the second turns by ratio₁, the third by ratio₁·ratio₂… Backprop just multiplies gear ratios backward from the output.
- **Lagrange multiplier = walking along a fence to find the highest point.** You stop where the fence is *tangent* to a contour line — there $\nabla f\parallel\nabla g$. PCA/LDA use this to turn "maximise variance subject to $\|w\|=1$" into an eigenvalue problem.
- 👀 Try it: `05_gradient_descent.py` (try $\eta=0.05,\ 0.9,\ 1.1$ and predict what happens first!)

![[05_gradient_descent.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Single variable
- Derivative = slope. Rules: $(x^n)'=nx^{n-1}$, $(e^{x})'=e^x$, $(\ln x)'=1/x$, product rule, **chain rule** $\frac d{dx}f(g(x))=f'(g(x))g'(x)$.
- Minimum of a smooth function: set the derivative to zero.

## Several variables
- **Partial derivative** $\partial f/\partial x_i$: differentiate treating the others as constants.
- **Gradient** $\nabla f=(\partial f/\partial x_1,\dots,\partial f/\partial x_n)$: points in the direction of steepest increase.
- Useful: $\nabla_x(a^\top x)=a$ and $\nabla_x(x^\top Ax)=(A+A^\top)x=2Ax$ for symmetric $A$.

## Gradient descent (how models learn)
To minimize a loss $L(w)$: repeat $w\leftarrow w-\eta\,\nabla L(w)$, with learning rate $\eta>0$.
Example: $L(w)=(w-3)^2$, $\nabla L=2(w-3)$, $\eta=0.1$, $w_0=0$:
$w_1=0-0.1(-6)=0.6$; $w_2=0.6-0.1(-4.8)=1.08$; … → 3.

## Chain rule = backpropagation
A network is a composition $L(\sigma(W_2\,\sigma(W_1x)))$. Backprop is just the chain rule applied layer by layer ([[MLP and Backpropagation]]).

## Constrained optimization (Lagrange multipliers)
Maximize $f$ subject to $g=0$: solve $\nabla f=\lambda\nabla g$. This is how [[PCA]] and [[LDA]] turn into eigenvalue problems.

## Self-test
1. $\frac{d}{dx}\,e^{-x^2}$? *(−2x e^{−x²})*
2. Gradient of $f(x,y)=x^2y+3y$? *(2xy, x²+3)*
3. One gradient step for $L(w)=w^2$, $w=4$, $\eta=0.25$? *(w = 4 − 0.25·8 = 2)*

## Mistakes log
-
