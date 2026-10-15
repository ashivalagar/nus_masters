---
tags: [ee5907, assignment, deadline]
---
# Assignment 2 Notes (CA2 — 20% of EE5907)
Brief: [[Assignment 2.pdf]] · Data: [[PIE.zip]] · Course map: [[EE5907 Course Map]] · Plan: [[Weekend Study Plan]]

## ⏰ Deadline
**Fri 6 Nov 2026, 5:59 PM SGT**, Canvas, max 3 submission attempts.
Late: ≤12 h → 80% of earned marks; ≤1 day → 50%; ≤2 days → 30%; >2 days → 0.
**One PDF** named exactly `MATRICULATIONNUMBER_YOURNAME_CA2.pdf` (code + results embedded as screenshots). Wrong name/format = **−20 points**.

## Rules that bite
- **Implement PCA and LDA from scratch** — no `sklearn.decomposition.PCA`, no `LinearDiscriminantAnalysis`. SVD / eigendecomposition from numpy/scipy is fine.
- Random seed: last **3** digits of matric number for general randomness; last **2** digits for the subject sampling (`random.sample(range(1,69),25)`).
- Individual work; AI tools allowed for refinement/coding, **not** to generate the whole submission.
- Comments in code are marked.

## Parts and marks
| Part | What | Marks | Concept notes |
|---|---|---|---|
| 1.1 | Choose 25 of 68 PIE subjects, 70/30 split; add **10 selfies** (grayscale, 32×32; 7 train / 3 test) → 26 classes | 5 | — |
| 1.2 | PCA from scratch; 2D/3D plots; 3 eigenfaces; PCA with p = 100, 500 | 20 | [[PCA]] |
| 1.3 | LDA from scratch; 2D/3D plots; 3 fisherfaces; LDA with p = 15, 25 | 25 | [[LDA]] |
| 2.1 | KNN (k=1) on PCA (100, 500) and LDA (15, 25) features; report accuracy for PIE test and your own photos | 10 | [[Decision Trees and kNN]] |
| 2.2 | GMM with 3 components: raw pixels and PCA (100, 500); 2D visualisation | 10 | [[GMM and EM]] |
| 2.3 | Linear SVM, C ∈ {0.0001, 0.1, 1000}, on raw / PCA / LDA features; discuss | 15 | [[SVM]] |
| 2.4 | CNN: conv(20, 5×5)→ReLU→pool, conv(50, 5×5)→ReLU→pool, FC 500, output 26 + softmax | 15 | [[MLP and Backpropagation]] |

## Exam synergy (why this assignment is also revision)
PCA, LDA, KNN, SVM, GMM, MLP/CNN — about half the Part II exam content. Writing the discussion for 2.3(d) (effect of dimension, feature method and C) is a ready-made exam answer.

## To-do
- [ ] **Take 10 selfies this week** (same lighting, face centred, grayscale, 32×32)
- [ ] Unzip `PIE.zip` into a scratch folder (not the vault) and inspect image size/format
- [ ] 1.1 data prep → 1.2 PCA → 1.3 LDA (Sat 24–Sun 25 Oct)
- [ ] 2.1 KNN → 2.3 SVM (Sat 31 Oct)
- [ ] 2.2 GMM + 2.4 CNN after Week 9–11 lectures (finish by ~4 Nov)
- [ ] Proof-read, check filename, submit by Wed 4 Nov to leave buffer
