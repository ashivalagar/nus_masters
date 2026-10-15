---
tags: [visual, hub]
---
# Visual Labs

21 tiny Python scripts (numpy + matplotlib only). Each one turns a concept into a picture you can poke at. Run from this folder:

```
python3 01_eigenvectors.py          # opens a window
LAB_NOSHOW=1 python3 01_eigenvectors.py   # just saves images/01_....png
```

**Habit:** *predict → run → explain the gap.* Change one number (η, R, C, k, ζ, a threshold) and predict before you rerun.

| # | Script | Concept | Memory hook |
|---|---|---|---|
| 01 | eigenvectors | [[Eigenvalues and Eigenvectors]] | directions that don't turn, only stretch |
| 02 | pole_map | [[Complex Numbers and Poles]] | left = calm, right = blow-up, up/down = wiggle |
| 03 | matrix_as_machine | [[Determinant Inverse and Rank]] | det = area scaling; det 0 = squashed flat |
| 04 | state_trajectories | [[Matrix Exponential and State Solution]] | modes as rivers flowing into the origin |
| 05 | gradient_descent | [[Calculus and Gradients]] | hiker in fog; η = stride length |
| 06 | bayes_crowd | [[Probability Basics]] | 1000-person crowd; rare disease trap |
| 07 | covariance_cloud | [[Expectation Variance Covariance]] | Σ = shape of the egg |
| 08 | bayes_boundary | [[Bayes Rule and Bayesian Decision Theory]] | priors slide the fence |
| 09 | controllability_rooms | [[Controllability]] / [[Observability]] | can your one knob reach every room? |
| 10 | pole_placement_effect | [[State Feedback and Pole Placement]] | choose the closed-loop personality |
| 11 | lqr_tradeoff | [[LQR Quadratic Optimal Control]] | budget dial: effort vs error |
| 12 | servo_integral | [[Servo Control]] | cruise control on a hill |
| 13 | observer_predict_correct | [[Observers and State Estimation]] | GPS dead-reckoning + fixes |
| 14 | mle_map_overfit | [[MLE MAP and Cross-Entropy]] | data alone vs data + hunch |
| 15 | roc_threshold_dial | [[Classifier Evaluation Metrics]] | smoke-alarm sensitivity dial |
| 16 | perceptron_logistic | [[Linear Discriminants Perceptron Logistic LSE]] | nudge the fence; soft fence |
| 17 | mlp_xor | [[MLP and Backpropagation]] / [[RBF Networks]] | bend the space until a line works |
| 18 | knn_boundary | [[Decision Trees and kNN]] | ask your k neighbours |
| 19 | pca_vs_lda | [[PCA]] / [[LDA]] | best shadow vs best separating shadow |
| 20 | kmeans_steps | [[K-means and Hierarchical Clustering]] | tutors and students |
| 21 | svm_margin_C | [[SVM]] | widest street; C = jaywalker tolerance |

See also: [[Make It Stick]] for study technique. Home: [[Masters Mind]].
