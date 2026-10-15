---
tags: [ee5907, exam-likely]
---
# Classifier Evaluation Metrics
Course map: [[EE5907 Course Map]] · Source: [[W03 Bayesian Decision Theory, Classifier, and Evaluation.pdf]], notebooks [[roc_plot.ipynb]], [[pr_plot.ipynb]]
Needs: [[Bayes Rule and Bayesian Decision Theory]]

## 🧠 Mental picture
- **Airport scanner dial.** Turn sensitivity up: it catches more real threats (TPR ↑) but beeps at more harmless belts (FPR ↑). The **ROC curve is the record of turning that dial** from "never beep" to "always beep". A perfect scanner hugs the top-left corner.
- **Fishing net.** A fine net catches all the fish you want (**recall**) but also boots and seaweed (**low precision**). A coarse net gives clean catch (**high precision**) but misses fish (**low recall**).
- **Accuracy paradox:** a "no earthquake today" predictor is 99.99% accurate and totally useless — so for rare events use **PR curve / F1**, not accuracy or sometimes ROC.
- 👀 Try it: `15_roc_threshold_dial.py`

![[15_roc_threshold_dial.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Confusion matrix (binary)
| | predicted + | predicted − |
|---|---|---|
| actual + | TP | FN |
| actual − | FP | TN |

- Accuracy $=\frac{TP+TN}{\text{all}}$ — misleading with class imbalance.
- **TPR / recall / sensitivity** $=\frac{TP}{TP+FN}$. **FPR** $=\frac{FP}{FP+TN}$. **Precision** $=\frac{TP}{TP+FP}$.
- **F1** $=\frac{2PR}{P+R}=\frac{2TP}{2TP+FP+FN}$.

## Threshold curves
- Move the decision threshold on the score → get a different $(FPR,TPR)$. The **ROC curve** plots TPR vs FPR; **AUC** = area under it (1 perfect, 0.5 chance). **EER** = point where FPR = FNR.
- With **heavy class imbalance**, ROC can look good while precision is poor → use the **Precision–Recall curve** (and average precision / F-scores).

## Worked example
TP=40, FN=10, FP=20, TN=130 (200 samples): accuracy $=170/200=0.85$; recall $=40/50=0.80$; precision $=40/60=0.667$; FPR $=20/150=0.133$; F1 $=80/110=0.727$.

## Self-test
1. Why can 99% accuracy be useless? *(imbalance: predicting the majority class)*
2. Raise the threshold: what happens to TPR, FPR, precision (typically)? *(TPR↓, FPR↓, precision↑)*
3. When prefer PR over ROC? *(rare positives)*

## Mistakes log
-
