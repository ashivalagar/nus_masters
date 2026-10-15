---
tags: [ee5907, core, exam-likely]
---
# Bayes Rule and Bayesian Decision Theory
Course map: [[EE5907 Course Map]] · Source: [[W01 Foundations of PR and Bayesian Reasoning.pdf]], [[W03 Bayesian Decision Theory, Classifier, and Evaluation.pdf]]
Needs: [[Probability Basics]], [[Gaussian Distribution]] · Next: [[MLE MAP and Cross-Entropy]]

## 🧠 Mental picture
- **Posterior = a detective's updated suspicion.** Prior = base rate before the clue; likelihood = "how typical is this clue for each suspect?"; posterior = prior × likelihood, rescaled.
- **Airport security / smoke alarm = cost-sensitive decisions.** A false alarm costs a minute; a missed bomb costs a catastrophe. So the alarm threshold is set to **err on the side of the expensive mistake** — the loss matrix does exactly that.
- **Reject option = the bouncer who says "I'm not sure — ask the manager".** When no class is confident enough, abstaining beats a risky guess if rejecting is cheap.
- **Gaussian classifier = two overlapping hills.** Classify as whichever hill is taller at $x$ (after weighting by priors). The boundary is where the hills have equal height. Equal-shaped hills → straight boundary; different shapes → curved.
- **Priors move the border:** the common class gets the benefit of the doubt, so the boundary slides **toward the rarer class** (like a country with more people claiming more border land).
- 👀 Try it: `08_bayes_boundary.py`

![[08_bayes_boundary.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## From probabilities to decisions
Bayes' rule for class $\omega_i$ and observation $x$:
$$P(\omega_i|x)=\frac{p(x|\omega_i)P(\omega_i)}{p(x)},\qquad p(x)=\sum_jp(x|\omega_j)P(\omega_j)$$
(posterior = likelihood × prior / evidence).

## Decision theory (W03)
- **Loss matrix** $\lambda(\alpha_i|\omega_j)$ = cost of taking action $\alpha_i$ when the truth is $\omega_j$.
- **Conditional risk:** $R(\alpha_i|x)=\sum_j\lambda(\alpha_i|\omega_j)P(\omega_j|x)$. **Bayes decision rule:** choose the action with minimum conditional risk. The resulting total expected loss is the **Bayes risk** — the best any classifier can do.
- **Zero-one loss** → minimum risk = **maximum posterior (MAP)**: choose $\arg\max_iP(\omega_i|x)$.
- **Cost-sensitive:** unequal losses shift the threshold (e.g. missing a disease costs more than a false alarm).
- **Reject option:** with cost $\lambda_r$ for rejecting and $\lambda_s$ for a wrong class, reject when $\max_iP(\omega_i|x)<1-\lambda_r/\lambda_s$.

## Gaussian Bayesian classifier
Use the log discriminant $g_i(x)=\ln p(x|\omega_i)+\ln P(\omega_i)$ with $p(x|\omega_i)=\mathcal N(\mu_i,\Sigma_i)$:
$$g_i(x)=-\tfrac12(x-\mu_i)^\top\Sigma_i^{-1}(x-\mu_i)-\tfrac12\ln|\Sigma_i|+\ln P(\omega_i)\ (+\text{const})$$
- **Different $\Sigma_i$** → quadratic boundaries.
- **Shared $\Sigma$** → linear: $g_i(x)=w_i^\top x+w_{i0}$ with $w_i=\Sigma^{-1}\mu_i$, $w_{i0}=-\tfrac12\mu_i^\top\Sigma^{-1}\mu_i+\ln P(\omega_i)$.
- **$\Sigma=\sigma^2I$, equal priors** → nearest-mean (minimum Euclidean distance) classifier.

## Worked example 1 — disease test
See [[Probability Basics]]: prior 1%, sensitivity 99%, false-positive 5% ⇒ $P(D|+)\approx0.167$.

## Worked example 2 — 1D Gaussian
Two classes, $\mu_1=0,\mu_2=2$, $\sigma=1$, equal priors → boundary at $x=1$. With $P(\omega_1)=0.8$, boundary shifts toward class 2: $x=1+\frac{\sigma^2}{\mu_2-\mu_1}\ln\frac{P(\omega_1)}{P(\omega_2)}=1+\tfrac12\ln4\approx1.69$ (the common class claims more space).

## Self-test
1. State the MAP rule. *(pick class with largest posterior)*
2. When is the Gaussian Bayes boundary linear? *(equal covariances)*
3. A cost-sensitive loss makes false negatives 10× worse. Which way does the boundary move? *(towards predicting the positive class more often)*

## Mistakes log
-
