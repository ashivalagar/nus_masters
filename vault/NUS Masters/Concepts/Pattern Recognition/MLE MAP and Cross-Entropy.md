---
tags: [ee5907, core, exam-likely]
---
# MLE, MAP, Cross-Entropy and Generalization
Course map: [[EE5907 Course Map]] · Source: [[W02 Learning Probabilistic Models.pdf]]
Needs: [[Calculus and Gradients]], [[Gaussian Distribution]] · Prev: [[Bayes Rule and Bayesian Decision Theory]]

## 🧠 Mental picture
- **MLE = a detective who picks the explanation that makes the evidence *least surprising*.** Flip a coin 10 times and see 7 heads: which bias $p$ makes "7 heads" most likely? $p=0.7$.
- **MAP = the same detective with experience.** A hunch (prior) says "coins are usually fair". With only a few flips the hunch pulls the answer toward 0.5; with lots of data the evidence outvotes the hunch. **Regularisation is that hunch** — it stops wild conclusions from few clues.
- **Cross-entropy = average "surprise".** A forecaster says "0% chance of rain" and it pours: infinite surprise (log-loss punishes confident wrong answers brutally). Training minimises total surprise.
- **Overfitting = memorising last year's exam answers.** You score 100% on the mock you memorised (training) and flop on the real exam (test). The **generalisation gap** is that difference. **Cross-validation** = several different mock exams so you can't memorise your way through.
- 👀 Try it: `14_mle_map_overfit.py`

![[14_mle_map_overfit.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Maximum likelihood estimation (MLE)
Choose parameters $\theta$ that make the observed data most probable: $\hat\theta=\arg\max_\theta\prod_ip(x_i|\theta)=\arg\max_\theta\sum_i\ln p(x_i|\theta)$.
**Recipe:** write the likelihood → take the log → differentiate → set to zero → solve (check it is a maximum).

- **Bernoulli:** $k$ successes in $n$ trials ⇒ $\hat p=k/n$. (Data $1,1,0,1$ ⇒ $\hat p=3/4$.)
- **Univariate Gaussian:** $\hat\mu=\frac1n\sum x_i$, $\hat\sigma^2=\frac1n\sum(x_i-\hat\mu)^2$ (the $1/n$ version is biased; $1/(n-1)$ is unbiased).

## Information view
- **Entropy** $H(p)=-\sum p\ln p$ — uncertainty. **Cross-entropy** $H(p,q)=-\sum p\ln q$ — cost of describing $p$ with model $q$. **KL divergence** $D_{KL}(p\|q)=H(p,q)-H(p)\ge0$.
- **MLE = minimising negative log-likelihood = minimising cross-entropy** between the data distribution and the model. This is why classification networks use cross-entropy loss ([[Linear Discriminants Perceptron Logistic LSE]], [[MLP and Backpropagation]]).
- **Sigmoid** makes a valid binary probability, **softmax** a valid multiclass distribution: $\operatorname{softmax}(z)_k=e^{z_k}/\sum_je^{z_j}$.

## Empirical risk, overfitting, regularization
- **ERM:** minimise average training loss. **Generalization gap** = test loss − training loss; large gap ⇒ overfitting.
- **MAP:** maximise posterior $\propto$ likelihood × prior. Gaussian prior on weights ⇒ **L2 regularization (weight decay)**; Laplace prior ⇒ **L1 (sparsity)**. So MAP = regularized MLE.
- **Validation / cross-validation** choose hyperparameters (regularization strength, $k$, learning rate, …) without touching the test set.

## Self-test
1. Derive $\hat p$ for Bernoulli. *(ln L = k ln p + (n−k) ln(1−p); derivative k/p − (n−k)/(1−p) = 0)*
2. Why is MAP with a zero-mean Gaussian prior the same as ridge regression? *(log prior = −‖w‖²/2σ² adds an L2 penalty)*
3. What does a large train/test gap tell you? *(overfitting → regularize, simplify, or get more data)*

## Mistakes log
-
