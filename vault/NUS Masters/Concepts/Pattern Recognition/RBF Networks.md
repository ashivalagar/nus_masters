---
tags: [ee5907]
---
# RBF Networks
Course map: [[EE5907 Course Map]] · Source: [[W05 Nonlinear Classifier, MLPs and RBF Network.pdf]], assignment [[Assignment 1.pdf]]
Needs: [[Gaussian Distribution]], [[Linear Discriminants Perceptron Logistic LSE]] · Related: [[MLP and Backpropagation]], [[K-means and Hierarchical Clustering]]

## 🧠 Mental picture
- **Street lamps / mobile towers.** Each centre $c_j$ is a lamp that lights up only its neighbourhood (brighter when you're closer). The prediction is a weighted sum of the lamps you can see. Far from all lamps → dark → output ≈ 0 (the model says "I don't know").
- **Local vs global:** an MLP neuron is a long fence across the whole map; an RBF neuron is a single lantern.
- **Hybrid training = place the lamps first, then set their brightness.** Brightness (output weights) is a least-squares problem because the output is linear in the lamp readings.
- **Lamp width $\sigma$:** too narrow → islands of light with gaps; too wide → everything blurs.
- 👀 Try it: `17_mlp_xor.py` (includes an RBF version of the 4-corner problem)

![[17_mlp_xor.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Idea
A hidden layer of **Gaussian bumps** centred at points $c_j$: $\varphi_j(x)=\exp\!\big(-\|x-c_j\|^2/(2\sigma_j^2)\big)$, output $\hat y=\sum_jw_j\varphi_j(x)+b$.
It is **linear in its nonlinear hidden features** — so once the centres and widths are fixed, the output weights come from least squares: $w=(\Phi^\top\Phi+\lambda I)^{-1}\Phi^\top y$ where $\Phi_{ij}=\varphi_j(x_i)$.

## Training = hybrid process
1. Choose centres: random subset of training points (Assignment 1) or **K-means** cluster centres.
2. Set widths (e.g. $\sigma\approx d_{\max}/\sqrt{2M}$ for $M$ centres, or average distance between centres).
3. Solve for output weights by LSE (or gradient descent).

## MLP vs RBF
MLP features are *global* (sigmoid/ReLU across space), trained end-to-end; RBF features are *local* (respond only near a centre), trained in stages. RBF needs many centres in high dimension.

## Self-test
1. What is $\varphi_j$ at $x=c_j$? *(1)*
2. Why is the output layer a least-squares problem? *(linear in w once Φ is fixed)*
3. Effect of too small $\sigma$? *(spiky features → overfit)*

## Mistakes log
-
