---
tags: [ee5907, course-map]
---
# EE5907 Pattern Recognition — Course Map
Home: [[Masters Mind]] · Exam: **Sat 28 Nov 2026, 1:00–3:00 PM**, closed book + one double-sided cheat sheet · Intel: [[Exam Intel]]
Lecturers: Dr Xu Yuecong (Part I, Wk 1–6) · Dr Wang Si (Part II, Wk 7–13).
Assessment: Final 60% · CA2 (Assignment 2) 20% · CA1 (Assignment 1) 15% · Quiz 5%.

## Big picture
A **pattern recognition pipeline**: represent the data → fit a probabilistic/discriminative model → make decisions → evaluate. Part I builds the probability and decision-theory foundation and trains classifiers; Part II learns better features (PCA, LDA), groups data (clustering, GMM) and adds SVMs, boosting and deep learning.

```
Probability ─► MLE/MAP ─► Bayes decisions ─► evaluation
                              │
        linear classifiers ───┼──► MLP / RBF ──► deep learning
                              │
 features: PCA, LDA ──► classifiers: kNN, SVM, trees ──► clustering: K-means, GMM
```

## Week by week
| Wk | Topic | Status | Concept notes | Files |
|---|---|---|---|---|
| 0 | Intro and admin | ✅ | [[Exam Intel]] | [[W00 Introduction and Admin Matters.pdf]] |
| 1 | Foundations of PR, Bayesian reasoning | ✅ | [[Probability Basics]], [[Bayes Rule and Bayesian Decision Theory]] | [[W01 Foundations of PR and Bayesian Reasoning.pdf]] |
| 2 | Learning probabilistic models (MLE, MAP, entropy, ERM) | ✅ | [[MLE MAP and Cross-Entropy]], [[Gaussian Distribution]] | [[W02 Learning Probabilistic Models.pdf]], [[binom_dist_plot.ipynb]] |
| 3 | Bayesian decision theory, classifiers, evaluation | ✅ | [[Bayes Rule and Bayesian Decision Theory]], [[Classifier Evaluation Metrics]] | [[W03 Bayesian Decision Theory, Classifier, and Evaluation.pdf]], [[roc_plot.ipynb]], [[pr_plot.ipynb]], [[Tutorial 1.pdf]] |
| 4 | Linear discriminants, perceptron, logistic, LSE | ✅ | [[Linear Discriminants Perceptron Logistic LSE]] | [[W04 Linear Discriminant Functions and Classifiers.pdf]], [[decision_bound.ipynb]] |
| 5 | Nonlinear classifiers, MLP, RBF | ✅ | [[MLP and Backpropagation]], [[RBF Networks]] | [[W05 Nonlinear Classifier, MLPs and RBF Network.pdf]], [[Assignment 1.pdf]], [[Generate_data.py]] |
| 5+ | Supplement: decision trees (non-parametric) | ✅ | [[Decision Trees and kNN]] | [[Supplementary Non-parametric Classifier with DT.pdf]] |
| 6 | (quiz week, 17 Sep — no slides on Canvas) | — | — | [[Lecture Transcript 2026-08-27.pdf]] (transcript of an earlier lecture) |
| 7 | PCA and LDA | ✅ | [[PCA]], [[LDA]] | [[W07 PCA and LDA (workshop, updated).pdf]] |
| 8 | K-means and agglomerative clustering | ✅ | [[K-means and Hierarchical Clustering]] | [[W08 K-means and Agglomerative Clustering (workshop, updated).pdf]] |
| 9 | GMM and boosting; Tutorial 2 released | ⏳ | [[GMM and EM]], [[Boosting]] | — |
| 10 | Support vector machines | ⏳ | [[SVM]] | — |
| 11 | Deep learning | ⏳ | [[MLP and Backpropagation]] (foundation) | — |
| 12 | Revision and Q&A | ⏳ | — | Tutorial 2 answers (Wk 11) |

## Assessments
- [[Assignment 2 Notes]] — **due Fri 6 Nov, 5:59 PM** (PIE dataset [[PIE.zip]]); overlaps heavily with the exam.
- Assignment 1 (done) — MLP backprop from scratch + RBF: [[Assignment 1.pdf]].

## Exam intel
No EE5907 past paper exists in the library database — see [[EE5907 Exam Style and Proxy Papers]]. Best evidence on style is [[Tutorial 1.pdf]]: **short proofs/derivations and conceptual explanations**, closed book + cheat sheet. Tutorial 2 arrives Week 9.

| Topic | Evidence it matters | Priority |
|---|---|---|
| Bayes rule / decision theory / Gaussian classifier | Tutorial 1 Q1, Q3 | ⭐⭐⭐ |
| MLE / MAP | Tutorial 1 Q2 | ⭐⭐⭐ |
| Perceptron / logistic / LSE | W04 (tutorial discussion) | ⭐⭐ |
| MLP + backprop, RBF | W05; proxy paper Q1–Q2 | ⭐⭐⭐ |
| PCA / LDA | Assignment 2, Part II | ⭐⭐⭐ |
| K-means / hierarchical | W08 | ⭐⭐ |
| GMM / EM | Week 9 (upcoming) | ⭐⭐ |
| SVM | Week 10; proxy paper Q3 | ⭐⭐⭐ |
| Boosting / DL | Week 9 / 11 | ⭐⭐ |
