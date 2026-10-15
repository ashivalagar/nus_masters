---
tags: [math, probability, core]
---
# Probability Basics
Prev: [[Calculus and Gradients]] · Next: [[Expectation Variance Covariance]]

## 🧠 Mental picture
- **Bayes = a detective updating suspicion.** Prior = suspicion before evidence; likelihood = "how typical is this clue if he's guilty?"; posterior = suspicion after the clue.
- **Think in crowds, not percentages** (the disease test): out of **10 000 people**, 100 are sick → 99 detected. 9 900 are healthy → 5% = **495** false alarms. A positive result means you're one of 99 + 495 = 594 beeping people, only 99 truly sick ⇒ **1 in 6**. A metal detector on a beach full of bottle-caps beeps mostly at caps.
- **Prior is the "base rate" you must never forget** — rare events stay rare even after mildly convincing evidence.
- **Binomial = repeated coin flips** (n flips, how many heads?).
- 👀 Try it: `06_bayes_crowd.py`

![[06_bayes_crowd.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Core rules
- $0\le P(A)\le1$; probabilities of all outcomes sum to 1; $P(\bar A)=1-P(A)$.
- **Conditional:** $P(A|B)=\dfrac{P(A\cap B)}{P(B)}$. **Independent:** $P(A\cap B)=P(A)P(B)$.
- **Total probability:** $P(B)=\sum_iP(B|A_i)P(A_i)$.
- **Bayes' rule:** $P(A|B)=\dfrac{P(B|A)P(A)}{P(B)}$ — "posterior ∝ likelihood × prior". Covered in lecture W01 ([[W01 Foundations of PR and Bayesian Reasoning.pdf]]) and used all course long ([[Bayes Rule and Bayesian Decision Theory]]).

## Random variables
- Discrete: probability mass function $p(x)$, sums to 1. Continuous: density $p(x)$, integrates to 1; probabilities come from areas.
- **Bernoulli($p$):** one coin flip, $P(1)=p$. **Binomial($n,p$):** number of successes in $n$ flips: $P(k)=\binom nkp^k(1-p)^{n-k}$.

## Worked example — disease test (lecture W01)
1% have the disease; test detects 99% of sick; false-positive rate 5%.
$P(D|+)=\dfrac{0.99\cdot0.01}{0.99\cdot0.01+0.05\cdot0.99}=\dfrac{0.0099}{0.0594}\approx0.167$.
A positive test still means only ≈17% chance of disease, because the **prior is small**. This kind of calculation is a classic exam question.

Binomial: $n=3,p=0.5$, $P(2)=3\cdot0.25\cdot0.5=0.375$.

## Self-test
1. $P(A)=0.3$, $P(B|A)=0.5$, $P(B|\bar A)=0.2$. Find $P(B)$ and $P(A|B)$. *(0.29; 0.15/0.29≈0.517)*
2. Two fair dice: probability the sum is 7? *(6/36 = 1/6)*
3. Why does a rare disease make false positives dominate? *(prior term in Bayes)*

## Mistakes log
-
