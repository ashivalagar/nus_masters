---
tags: [ee5907, core, exam-likely]
---
# MLP and Backpropagation
Course map: [[EE5907 Course Map]] · Source: [[W05 Nonlinear Classifier, MLPs and RBF Network.pdf]], assignment [[Assignment 1.pdf]]
Needs: [[Calculus and Gradients]], [[Linear Discriminants Perceptron Logistic LSE]] · Related: [[RBF Networks]]

## 🧠 Mental picture
- **Assembly line of specialists.** Each hidden neuron is a specialist that looks for one feature (an edge, a curve); later layers combine specialist reports. XOR needs **two fences, then AND them** — that's what one hidden layer does.
- **Without nonlinearity, stacking layers is useless** — like stacking flat glass panes: still flat. Activations are the bends.
- **Backprop = blame assignment through a chain of command.** The boss (loss) says "the answer was wrong by this much"; blame flows backward and each weight is told how much of the error it caused (the chain rule's gear ratios). Each worker then adjusts by blame × learning rate.
- **Learning rate = tuning a radio.** Tiny nudges: you'll never find the station; huge twists: you skip over it.
- **Early stopping = stop cramming before you start memorising the textbook's typos.**
- **CNN filter = a small stencil slid across the image** asking "is my pattern here?" at every position.
- 👀 Try it: `17_mlp_xor.py`

![[17_mlp_xor.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Why
Linear models fail on XOR-like problems. A **multilayer perceptron** learns its own nonlinear features: hidden layer = learned feature map, output layer = linear classifier on those features.

## Forward pass (one hidden layer)
$z^{(1)}=W_1x+b_1,\ h=\varphi(z^{(1)}),\ z^{(2)}=W_2h+b_2,\ \hat y=\sigma(z^{(2)})$ (or softmax for multiclass).
Activations: sigmoid, tanh, **ReLU** $\max(0,z)$. Without nonlinear activations the whole network collapses to one linear map.
**Universal approximation theorem:** one hidden layer with enough units can approximate any continuous function on a compact set (says nothing about *learning* it).

## Backpropagation = chain rule
Loss $L$ (BCE for sigmoid out, cross-entropy for softmax). Error signals:
- Output: $\delta^{(2)}=\hat y-y$ (for sigmoid+BCE or softmax+CE).
- Hidden: $\delta^{(1)}=(W_2^\top\delta^{(2)})\odot\varphi'(z^{(1)})$.
- Gradients: $\partial L/\partial W_2=\delta^{(2)}h^\top$, $\partial L/\partial b_2=\delta^{(2)}$, $\partial L/\partial W_1=\delta^{(1)}x^\top$, $\partial L/\partial b_1=\delta^{(1)}$.
- Update: $W\leftarrow W-\eta\,\partial L/\partial W$. Example: $y=1,\hat y=0.8\Rightarrow\delta^{(2)}=-0.2$, pushing the output up.

## Training practice (from the lecture)
Random (small) initialization; learning rate matters (too big diverges, too small crawls); **validation set + early stopping**; **weight decay** (= L2 / MAP, see [[MLE MAP and Cross-Entropy]]); bias–variance dilemma: bigger network ⇒ lower bias, higher variance.

## CNN link (Assignment 2.4)
Conv layers reuse the same idea with shared local filters; backprop still applies. Output size of a conv layer (no padding, stride 1): $n-k+1$; max-pool 2×2 stride 2 halves the size. For 32×32 input: conv5 → 28 → pool → 14 → conv5 → 10 → pool → 5 ⇒ flatten $50\times5\times5=1250$ values → FC 500 → 26 outputs.

## Self-test
1. Why does the XOR network need a nonlinear activation? *(otherwise equals a single linear layer)*
2. Write the output-layer gradient for softmax + cross-entropy. *(δ = ŷ − y one-hot)*
3. What does early stopping regularize against? *(overfitting)*

## Mistakes log
-
