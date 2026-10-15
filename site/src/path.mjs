// Learning path: the Weekend Study Plan, turned into concrete, ordered steps.
//
// Shape
//   week    { id, title, short, phase, dates, blurb, sessions[] }
//   session { id, date (ISO, Asia/Singapore), label, course, title, minutes?, steps[] }
//   step    one of
//     { kind: 'read',  note, min }                  read a concept / vault note
//     { kind: 'see',   lab, min, note? }            open an interactive lab
//     { kind: 'predict', id, prompt, lab? }         commit to a guess first (saved locally)
//     { kind: 'quiz',  notes: [..], min }           self-test cards for those notes
//     { kind: 'teach', note, min }                  "teach it back in 2 minutes"
//     { kind: 'do',    text, files?: [..], min, link? }  problems / assignment / mock exam
//     { kind: 'checkpoint', items: [..] }            "can you ...?"
//
// Notes are referenced by their vault title (the file name without .md).
// Course files (PDFs, zips) are referenced by name only; they live in the vault.
// Dates are local Singapore dates. Every concept note appears at least once
// (the build fails loudly if one is missing).

export const EXAMS = [
  { course: 'EE5907', name: 'EE5907 Pattern Recognition', iso: '2026-11-28T13:00:00+08:00', label: 'Sat 28 Nov, 1:00 PM', format: 'Closed book, one double-sided cheat sheet, 2 h' },
  { course: 'EE5101', name: 'EE5101 Linear Systems', iso: '2026-12-01T13:00:00+08:00', label: 'Tue 1 Dec, 1:00 PM', format: '2.5 h; 2021/22 paper was open book (confirm for 2026)' },
];

export const DEADLINES = [
  { course: 'EE5101', title: 'L9 Decoupling control lecture', iso: '2026-10-19T18:00:00+08:00', label: 'Mon 19 Oct, 6–9 PM' },
  { course: 'EE5101', title: 'L10 State estimation lecture', iso: '2026-10-26T18:00:00+08:00', label: 'Mon 26 Oct, 6–9 PM' },
  { course: 'EE5101', title: 'L11 Part 2 recap lecture', iso: '2026-11-02T18:00:00+08:00', label: 'Mon 2 Nov, 6–9 PM' },
  { course: 'EE5907', title: 'Assignment 2 due (CA2, 20%)', iso: '2026-11-06T17:59:00+08:00', label: 'Fri 6 Nov, 5:59 PM', important: true },
  { course: 'EE5907', title: 'EE5907 final exam', iso: '2026-11-28T13:00:00+08:00', label: 'Sat 28 Nov, 1:00 PM', important: true },
  { course: 'EE5101', title: 'EE5101 final exam', iso: '2026-12-01T13:00:00+08:00', label: 'Tue 1 Dec, 1:00 PM', important: true },
];

export const PHASES = [
  { id: 'p0', title: 'Warm-up', from: '2026-10-12', to: '2026-10-16' },
  { id: 'p1', title: 'Foundations + Part 1 catch-up', from: '2026-10-17', to: '2026-10-25' },
  { id: 'p2', title: 'Finish all content', from: '2026-10-26', to: '2026-11-08' },
  { id: 'p3', title: 'Drill', from: '2026-11-09', to: '2026-11-22' },
  { id: 'p4', title: 'Exam week', from: '2026-11-23', to: '2026-12-01' },
];

export const WEEKS = [
  {
    id: 'week-0', short: 'Week 0', title: 'Warm-up evenings', phase: 'p0',
    dates: 'Mon 12 – Fri 16 Oct', from: '2026-10-12', to: '2026-10-16',
    blurb: 'Five short weekday evenings (30–45 min) to wake up the linear algebra and see the shape of both courses before the first study weekend.',
    sessions: [
      { id: 'w0-mon', date: '2026-10-12', label: 'Mon 12 Oct', course: 'foundations', title: 'Map the ground, start with vectors',
        steps: [
          { kind: 'read', note: '00 Math Roadmap', min: 5 },
          { kind: 'predict', id: 'w0-matvec', prompt: 'A matrix multiplies every point of the plane. Before reading: what do you think happens to a square drawn on the plane? Does it stay a square?' },
          { kind: 'read', note: 'Vectors and Matrices', min: 30 },
        ] },
      { id: 'w0-tue', date: '2026-10-13', label: 'Tue 13 Oct', course: 'foundations', title: 'Matrices as machines',
        steps: [
          { kind: 'see', lab: '03_matrix_as_machine', min: 10, note: 'Vectors and Matrices' },
          { kind: 'quiz', notes: ['Vectors and Matrices'], min: 10 },
          { kind: 'teach', note: 'Vectors and Matrices', min: 5 },
        ] },
      { id: 'w0-wed', date: '2026-10-14', label: 'Wed 14 Oct', course: 'foundations', title: 'Determinant, inverse and rank',
        steps: [
          { kind: 'predict', id: 'w0-det0', prompt: 'If a matrix squashes the unit square flat onto a line, what is its determinant, and can you undo it?' },
          { kind: 'read', note: 'Determinant Inverse and Rank', min: 35 },
        ] },
      { id: 'w0-thu', date: '2026-10-15', label: 'Thu 15 Oct', course: 'foundations', title: 'Rank by hand',
        steps: [
          { kind: 'see', lab: '03_matrix_as_machine', min: 10, note: 'Determinant Inverse and Rank' },
          { kind: 'quiz', notes: ['Determinant Inverse and Rank'], min: 10 },
          { kind: 'do', text: 'Invert two 2×2 matrices and find the rank of one 3×3 by hand; check each with np.linalg.', min: 15 },
          { kind: 'teach', note: 'Determinant Inverse and Rank', min: 5 },
        ] },
      { id: 'w0-fri', date: '2026-10-16', label: 'Fri 16 Oct', course: 'foundations', title: 'See the shape of both courses',
        steps: [
          { kind: 'read', note: 'EE5101 Course Map', min: 15 },
          { kind: 'read', note: 'EE5907 Course Map', min: 15 },
          { kind: 'read', note: 'Exam Intel', min: 10 },
          { kind: 'checkpoint', items: [
            'Multiply a 2×2 matrix by a vector without notes',
            'Say what det = 0 means geometrically',
            'Name the five big blocks of EE5101 in order',
            'Name the two parts of EE5907 and who teaches each',
          ] },
        ] },
    ],
  },
  {
    id: 'week-1', short: 'Weekend 1', title: 'Foundations for both courses', phase: 'p1',
    dates: 'Sat 17 – Mon 19 Oct', from: '2026-10-17', to: '2026-10-19',
    blurb: 'Saturday rebuilds probability for EE5907; Sunday rebuilds eigenvalues, poles and ODEs for EE5101 and covers lectures L1–L3. About six focused hours each day.',
    sessions: [
      { id: 'w1-sat', date: '2026-10-17', label: 'Sat 17 Oct', course: 'EE5907', title: 'EE5907 foundations',
        steps: [
          { kind: 'predict', id: 'w1-crowd', prompt: 'A test is 95% sensitive with a 5% false-positive rate. The disease affects 1 in 100 people. You test positive. Write your gut estimate of the chance you are sick.', lab: '06_bayes_crowd' },
          { kind: 'read', note: 'Probability Basics', min: 40 },
          { kind: 'see', lab: '06_bayes_crowd', min: 10, note: 'Probability Basics' },
          { kind: 'read', note: 'Expectation Variance Covariance', min: 35 },
          { kind: 'see', lab: '07_covariance_cloud', min: 10, note: 'Expectation Variance Covariance' },
          { kind: 'read', note: 'Gaussian Distribution', min: 35 },
          { kind: 'quiz', notes: ['Probability Basics', 'Expectation Variance Covariance', 'Gaussian Distribution'], min: 15 },
          { kind: 'predict', id: 'w1-prior', prompt: 'Two equal-width Gaussian classes, one four times more common than the other. Does the decision boundary move toward the common class or the rare class?', lab: '08_bayes_boundary' },
          { kind: 'read', note: 'Bayes Rule and Bayesian Decision Theory', min: 50 },
          { kind: 'see', lab: '08_bayes_boundary', min: 10, note: 'Bayes Rule and Bayesian Decision Theory' },
          { kind: 'read', note: 'MLE MAP and Cross-Entropy', min: 50 },
          { kind: 'see', lab: '14_mle_map_overfit', min: 10, note: 'MLE MAP and Cross-Entropy' },
          { kind: 'quiz', notes: ['Bayes Rule and Bayesian Decision Theory', 'MLE MAP and Cross-Entropy'], min: 15 },
          { kind: 'teach', note: 'Bayes Rule and Bayesian Decision Theory', min: 5 },
          { kind: 'do', text: 'Assignment 2, data loading: unzip PIE into a scratch folder, inspect image size and format, write the subject-sampling code with your seed. Take the first selfies.', files: ['Assignment 2.pdf', 'PIE.zip'], link: 'Assignment 2 Notes', min: 45 },
          { kind: 'checkpoint', items: [
            'Compute P(sick | +) for a rare disease with the 1000-person picture',
            'Write the Gaussian log-discriminant g_i(x) from memory',
            'Derive the MLE of a coin’s bias from h heads in n flips',
            'Explain why MAP is MLE plus a prior',
          ] },
        ] },
      { id: 'w1-sun', date: '2026-10-18', label: 'Sun 18 Oct', course: 'EE5101', title: 'EE5101 foundations and L1–L3',
        steps: [
          { kind: 'predict', id: 'w1-eig', prompt: 'For A = [[1,2],[2,1]], guess one direction that A only stretches and never turns.', lab: '01_eigenvectors' },
          { kind: 'read', note: 'Eigenvalues and Eigenvectors', min: 45 },
          { kind: 'see', lab: '01_eigenvectors', min: 10, note: 'Eigenvalues and Eigenvectors' },
          { kind: 'read', note: 'Complex Numbers and Poles', min: 35 },
          { kind: 'see', lab: '02_pole_map', min: 10, note: 'Complex Numbers and Poles' },
          { kind: 'read', note: 'ODE Basics and the Exponential', min: 35 },
          { kind: 'quiz', notes: ['Eigenvalues and Eigenvectors', 'Complex Numbers and Poles', 'ODE Basics and the Exponential'], min: 15 },
          { kind: 'read', note: 'State-Space Representation', min: 40 },
          { kind: 'read', note: 'Matrix Exponential and State Solution', min: 50 },
          { kind: 'see', lab: '04_state_trajectories', min: 10, note: 'Matrix Exponential and State Solution' },
          { kind: 'read', note: 'System Modes', min: 35 },
          { kind: 'quiz', notes: ['State-Space Representation', 'Matrix Exponential and State Solution', 'System Modes'], min: 15 },
          { kind: 'teach', note: 'System Modes', min: 5 },
          { kind: 'do', text: 'Compute e^{At} by hand for A = [[0,1],[-2,-3]] using eigen-decomposition, then check with scipy.linalg.expm.', min: 30 },
          { kind: 'checkpoint', items: [
            'Find eigenvalues of a 2×2 from trace and determinant',
            'Read stability and oscillation off a pole’s position',
            'Write a mass–spring–damper in state-space form',
            'Compute e^{At} for a 2×2 two different ways',
          ] },
        ] },
      { id: 'w1-mon', date: '2026-10-19', label: 'Mon 19 Oct', course: 'EE5101', title: 'Lecture L9: decoupling',
        steps: [
          { kind: 'read', note: 'Decoupling Control', min: 15 },
          { kind: 'do', text: 'Attend L9 (6–9 PM). Afterwards, add two lines to the Decoupling note in your own words. Also: the EE5907 mid-term survey is due today (2 min).', min: 180 },
        ] },
    ],
  },
  {
    id: 'week-2', short: 'Weekend 2', title: 'Classifiers and core theory', phase: 'p1',
    dates: 'Sat 24 – Mon 26 Oct', from: '2026-10-20', to: '2026-10-26',
    blurb: 'Saturday: gradients, evaluation and linear classifiers, plus PCA for the assignment. Sunday: controllability, observability and canonical forms (L4–L5). Revisit last weekend’s cards first.',
    sessions: [
      { id: 'w2-sat', date: '2026-10-24', label: 'Sat 24 Oct', course: 'EE5907', title: 'EE5907 classifiers',
        steps: [
          { kind: 'quiz', notes: ['Bayes Rule and Bayesian Decision Theory', 'MLE MAP and Cross-Entropy'], min: 10 },
          { kind: 'predict', id: 'w2-eta', prompt: 'Gradient descent on f(w) = (w−3)². Step size η = 1.05. Does it reach w = 3, crawl, bounce forever, or run away?', lab: '05_gradient_descent' },
          { kind: 'read', note: 'Calculus and Gradients', min: 40 },
          { kind: 'see', lab: '05_gradient_descent', min: 10, note: 'Calculus and Gradients' },
          { kind: 'read', note: 'Classifier Evaluation Metrics', min: 35 },
          { kind: 'see', lab: '15_roc_threshold_dial', min: 10, note: 'Classifier Evaluation Metrics' },
          { kind: 'read', note: 'Linear Discriminants Perceptron Logistic LSE', min: 50 },
          { kind: 'see', lab: '16_perceptron_logistic', min: 15, note: 'Linear Discriminants Perceptron Logistic LSE' },
          { kind: 'quiz', notes: ['Calculus and Gradients', 'Classifier Evaluation Metrics', 'Linear Discriminants Perceptron Logistic LSE'], min: 15 },
          { kind: 'do', text: 'Redo Tutorial 1 from scratch, closed notes, then compare.', files: ['Tutorial 1.pdf'], min: 75 },
          { kind: 'read', note: 'PCA', min: 40 },
          { kind: 'see', lab: '19_pca_vs_lda', min: 10, note: 'PCA' },
          { kind: 'do', text: 'Assignment 2 part 1.1 data prep and part 1.2 PCA from scratch: eigenfaces, 2D/3D plots, p = 100 and 500.', files: ['Assignment 2.pdf', 'PIE.zip'], link: 'Assignment 2 Notes', min: 90 },
          { kind: 'teach', note: 'PCA', min: 5 },
        ] },
      { id: 'w2-sun', date: '2026-10-25', label: 'Sun 25 Oct', course: 'EE5101', title: 'EE5101 core theory (L4–L5)',
        steps: [
          { kind: 'quiz', notes: ['Eigenvalues and Eigenvectors', 'System Modes'], min: 10 },
          { kind: 'do', text: 'Watch the L9 (Decoupling) recording first if you missed Monday, and update the Decoupling note.', min: 30, link: 'Decoupling Control' },
          { kind: 'predict', id: 'w2-rooms', prompt: 'Two rooms, one heater in room 1, and the door between them is shut. Can any heater schedule bring room 2 to a chosen temperature? What changes as you open the door a crack?', lab: '09_controllability_rooms' },
          { kind: 'read', note: 'Controllability', min: 45 },
          { kind: 'see', lab: '09_controllability_rooms', min: 15, note: 'Controllability' },
          { kind: 'read', note: 'Observability', min: 35 },
          { kind: 'read', note: 'Canonical Forms Realizations Stability', min: 60 },
          { kind: 'see', lab: '02_pole_map', min: 5, note: 'Canonical Forms Realizations Stability' },
          { kind: 'quiz', notes: ['Controllability', 'Observability', 'Canonical Forms Realizations Stability'], min: 15 },
          { kind: 'teach', note: 'Controllability', min: 5 },
          { kind: 'do', text: 'Controllability with a parameter: for A = [[0,1],[−2,−a]], B = [0,1]ᵀ and for B = [1,1]ᵀ, find the values of a that break controllability. Then do one Lyapunov equation by hand.', min: 40 },
          { kind: 'checkpoint', items: [
            'Run the Kalman rank test and the PBH test on a 2×2',
            'State the duality between controllability and observability',
            'Write G(s) in controllable canonical form',
            'Decide stability with a Lyapunov function',
          ] },
        ] },
      { id: 'w2-mon', date: '2026-10-26', label: 'Mon 26 Oct', course: 'EE5101', title: 'Lecture L10: state estimation',
        steps: [
          { kind: 'read', note: 'Observers and State Estimation', min: 15 },
          { kind: 'do', text: 'Attend L10 (6–9 PM). Afterwards, fix anything in the Observers primer that the slides define differently.', min: 180 },
        ] },
    ],
  },
  {
    id: 'week-3', short: 'Weekend 3', title: 'Nonlinear classifiers and feedback design', phase: 'p2',
    dates: 'Sat 31 Oct – Sun 1 Nov', from: '2026-10-27', to: '2026-11-01',
    blurb: 'Saturday: MLPs, RBF networks, trees and kNN, plus LDA and kNN for Assignment 2. Sunday: pole placement, LQR and servo design (L6–L8) with problem sets 6–8.',
    sessions: [
      { id: 'w3-sat', date: '2026-10-31', label: 'Sat 31 Oct', course: 'EE5907', title: 'EE5907 nonlinear + representation',
        steps: [
          { kind: 'quiz', notes: ['Linear Discriminants Perceptron Logistic LSE', 'PCA', 'Classifier Evaluation Metrics'], min: 10 },
          { kind: 'predict', id: 'w3-xor', prompt: 'XOR: four points, opposite corners share a class. What is the smallest number of hidden units an MLP needs to separate them? Why can’t one straight line do it?', lab: '17_mlp_xor' },
          { kind: 'read', note: 'MLP and Backpropagation', min: 55 },
          { kind: 'see', lab: '17_mlp_xor', min: 15, note: 'MLP and Backpropagation' },
          { kind: 'read', note: 'RBF Networks', min: 35 },
          { kind: 'read', note: 'Decision Trees and kNN', min: 35 },
          { kind: 'see', lab: '18_knn_boundary', min: 10, note: 'Decision Trees and kNN' },
          { kind: 'quiz', notes: ['MLP and Backpropagation', 'RBF Networks', 'Decision Trees and kNN'], min: 15 },
          { kind: 'read', note: 'LDA', min: 40 },
          { kind: 'see', lab: '19_pca_vs_lda', min: 10, note: 'LDA' },
          { kind: 'do', text: 'Assignment 2 part 1.3 LDA from scratch (fisherfaces, p = 15 and 25) and part 2.1 kNN (k = 1) on PCA and LDA features.', files: ['Assignment 2.pdf'], link: 'Assignment 2 Notes', min: 120 },
          { kind: 'teach', note: 'MLP and Backpropagation', min: 5 },
        ] },
      { id: 'w3-sun', date: '2026-11-01', label: 'Sun 1 Nov', course: 'EE5101', title: 'EE5101 design (L6–L8)',
        steps: [
          { kind: 'quiz', notes: ['Controllability', 'Observability', 'Canonical Forms Realizations Stability'], min: 10 },
          { kind: 'predict', id: 'w3-poles', prompt: 'You move the closed-loop poles twice as far left. What happens to the response speed, and what happens to the control effort?', lab: '10_pole_placement_effect' },
          { kind: 'read', note: 'State Feedback and Pole Placement', min: 50 },
          { kind: 'see', lab: '10_pole_placement_effect', min: 10, note: 'State Feedback and Pole Placement' },
          { kind: 'read', note: 'LQR Quadratic Optimal Control', min: 50 },
          { kind: 'see', lab: '11_lqr_tradeoff', min: 10, note: 'LQR Quadratic Optimal Control' },
          { kind: 'read', note: 'Servo Control', min: 40 },
          { kind: 'see', lab: '12_servo_integral', min: 10, note: 'Servo Control' },
          { kind: 'quiz', notes: ['State Feedback and Pole Placement', 'LQR Quadratic Optimal Control', 'Servo Control'], min: 15 },
          { kind: 'do', text: 'Problem sets 6, 7 and 8 with the solutions covered. Uncover only after a full attempt.', files: ['P06 Problems.pdf', 'P07 Problems.pdf', 'P08 Problems.pdf', 'P06 Solutions.pdf', 'P07 Solutions.pdf', 'P08 Solutions.pdf'], min: 150 },
          { kind: 'teach', note: 'LQR Quadratic Optimal Control', min: 5 },
          { kind: 'checkpoint', items: [
            'Place two poles by coefficient matching',
            'Solve a scalar LQR from the Riccati equation',
            'Explain why an integrator removes steady-state error',
          ] },
        ] },
    ],
  },
  {
    id: 'week-a2', short: 'A2 sprint', title: 'Assignment 2 sprint', phase: 'p2',
    dates: 'Mon 2 – Fri 6 Nov', from: '2026-11-02', to: '2026-11-06',
    blurb: 'Weekday evenings: finish SVM, GMM and CNN, write the report, submit well before 5:59 PM on Friday. Monday is the L11 recap lecture.',
    sessions: [
      { id: 'a2-mon', date: '2026-11-02', label: 'Mon 2 Nov', course: 'EE5101', title: 'L11 recap + SVM experiments',
        steps: [
          { kind: 'do', text: 'Attend L11 (Part 2 recap, 6–9 PM). Note anything the lecturer flags for the exam.', min: 180 },
          { kind: 'read', note: 'SVM', min: 20 },
          { kind: 'see', lab: '21_svm_margin_C', min: 10, note: 'SVM' },
        ] },
      { id: 'a2-tue', date: '2026-11-03', label: 'Tue 3 Nov', course: 'EE5907', title: 'SVM and GMM parts',
        steps: [
          { kind: 'do', text: 'Assignment 2 part 2.3: linear SVM with C ∈ {0.0001, 0.1, 1000} on raw, PCA and LDA features; draft the discussion of dimension, features and C.', link: 'Assignment 2 Notes', min: 60 },
          { kind: 'read', note: 'GMM and EM', min: 20 },
          { kind: 'do', text: 'Assignment 2 part 2.2: GMM with 3 components on raw pixels and PCA (100, 500); 2D visualisation.', link: 'Assignment 2 Notes', min: 45 },
        ] },
      { id: 'a2-wed', date: '2026-11-04', label: 'Wed 4 Nov', course: 'EE5907', title: 'CNN and submit early',
        steps: [
          { kind: 'do', text: 'Assignment 2 part 2.4: the CNN (conv 20 5×5 → ReLU → pool, conv 50 5×5 → ReLU → pool, FC 500, 26-way softmax).', link: 'Assignment 2 Notes', min: 60 },
          { kind: 'do', text: 'Assemble the single PDF, proof-read, check the file name MATRICULATIONNUMBER_YOURNAME_CA2.pdf, and submit (target: tonight).', link: 'Assignment 2 Notes', min: 45 },
        ] },
      { id: 'a2-fri', date: '2026-11-06', label: 'Fri 6 Nov', course: 'EE5907', title: 'Deadline 5:59 PM',
        steps: [
          { kind: 'checkpoint', items: [
            'Submission visible on Canvas with the exact file name',
            'Code comments present (they are marked)',
            'All four C values and all feature types reported for the SVM',
          ] },
        ] },
    ],
  },
  {
    id: 'week-4', short: 'Weekend 4', title: 'Part II and the remaining lectures', phase: 'p2',
    dates: 'Sat 7 – Sun 8 Nov', from: '2026-11-07', to: '2026-11-08',
    blurb: 'Saturday closes EE5907 Part II: clustering, GMM, SVM, boosting and Tutorial 2. Sunday closes EE5101: decoupling, observers, and a first mixed problem set.',
    sessions: [
      { id: 'w4-sat', date: '2026-11-07', label: 'Sat 7 Nov', course: 'EE5907', title: 'EE5907 Part II',
        steps: [
          { kind: 'quiz', notes: ['MLP and Backpropagation', 'Decision Trees and kNN', 'LDA'], min: 10 },
          { kind: 'predict', id: 'w4-kmeans', prompt: 'K-means with three centroids, all started inside the same blob. Will it always find the three obvious clusters?', lab: '20_kmeans_steps' },
          { kind: 'read', note: 'K-means and Hierarchical Clustering', min: 45 },
          { kind: 'see', lab: '20_kmeans_steps', min: 10, note: 'K-means and Hierarchical Clustering' },
          { kind: 'read', note: 'GMM and EM', min: 40 },
          { kind: 'read', note: 'SVM', min: 40 },
          { kind: 'see', lab: '21_svm_margin_C', min: 10, note: 'SVM' },
          { kind: 'read', note: 'Boosting', min: 30 },
          { kind: 'quiz', notes: ['K-means and Hierarchical Clustering', 'GMM and EM', 'SVM', 'Boosting'], min: 15 },
          { kind: 'do', text: 'Tutorial 2, closed notes, timed at 75 minutes.', files: ['Tutorial 2.pdf'], min: 75 },
          { kind: 'teach', note: 'SVM', min: 5 },
        ] },
      { id: 'w4-sun', date: '2026-11-08', label: 'Sun 8 Nov', course: 'EE5101', title: 'EE5101 remaining topics',
        steps: [
          { kind: 'quiz', notes: ['State Feedback and Pole Placement', 'LQR Quadratic Optimal Control', 'Servo Control'], min: 10 },
          { kind: 'read', note: 'Decoupling Control', min: 40 },
          { kind: 'predict', id: 'w4-observer', prompt: 'An observer starts with the wrong estimate. If you make its poles 6× faster, what gets better and what gets worse once the measurement is noisy?', lab: '13_observer_predict_correct' },
          { kind: 'read', note: 'Observers and State Estimation', min: 45 },
          { kind: 'see', lab: '13_observer_predict_correct', min: 10, note: 'Observers and State Estimation' },
          { kind: 'quiz', notes: ['Decoupling Control', 'Observers and State Estimation'], min: 10 },
          { kind: 'teach', note: 'Observers and State Estimation', min: 5 },
          { kind: 'do', text: 'First mixed problem set: one e^{At}, one canonical-form transformation, one pole placement, one LQR, one servo design. Use P06–P08 and the L03–L05 examples.', files: ['P06 Problems.pdf', 'P07 Problems.pdf', 'P08 Problems.pdf'], min: 120 },
          { kind: 'checkpoint', items: [
            'Design an observer gain L for a 2-state system',
            'State the separation principle',
            'Say when static state feedback can decouple a system',
          ] },
        ] },
    ],
  },
  {
    id: 'week-5', short: 'Weekend 5', title: 'Timed mocks', phase: 'p3',
    dates: 'Sat 14 – Sun 15 Nov', from: '2026-11-09', to: '2026-11-15',
    blurb: 'Drill under exam conditions. EE5907 has no past paper, so build a timed mock from the tutorials and the proxy paper. EE5101 gets the 2021/22 paper.',
    sessions: [
      { id: 'w5-sat', date: '2026-11-14', label: 'Sat 14 Nov', course: 'EE5907', title: 'EE5907 timed mock',
        steps: [
          { kind: 'quiz', notes: ['Bayes Rule and Bayesian Decision Theory', 'MLE MAP and Cross-Entropy', 'PCA', 'LDA', 'SVM'], min: 15 },
          { kind: 'do', text: 'Timed self-made mock, 2 h, closed book with only your draft cheat sheet: Tutorial 1 + Tutorial 2 + proxy-paper Q1–Q3 (see your EE5907 Exam Style and Proxy Papers note in the vault).', files: ['Tutorial 1.pdf', 'Tutorial 2.pdf'], min: 120 },
          { kind: 'do', text: 'Mark the mock. For every lost mark, add a line to the Mistakes log of the matching concept note.', min: 60 },
          { kind: 'read', note: 'EE5907 Cheat Sheet', min: 10 },
          { kind: 'checkpoint', items: ['Finished the mock inside 2 h', 'Every mistake logged against a concept'] },
        ] },
      { id: 'w5-sun', date: '2026-11-15', label: 'Sun 15 Nov', course: 'EE5101', title: 'EE5101 2021/22 paper, timed',
        steps: [
          { kind: 'quiz', notes: ['Controllability', 'Canonical Forms Realizations Stability', 'LQR Quadratic Optimal Control'], min: 15 },
          { kind: 'do', text: 'The 2021/22 paper, timed at 2.5 h, open-book resources only. Then review every mistake against your EE5101 Past Paper Analysis note in the vault.', min: 210 },
          { kind: 'checkpoint', items: ['Attempted all four questions', 'Listed the sub-questions to redo next weekend'] },
        ] },
    ],
  },
  {
    id: 'week-6', short: 'Weekend 6', title: 'Second mock and cheat sheets', phase: 'p3',
    dates: 'Sat 21 – Sun 22 Nov', from: '2026-11-16', to: '2026-11-22',
    blurb: 'Saturday: a second EE5907 mock and the one-page double-sided cheat sheet. Sunday: redo failed EE5101 sub-questions and finish the open-book procedure sheet.',
    sessions: [
      { id: 'w6-sat', date: '2026-11-21', label: 'Sat 21 Nov', course: 'EE5907', title: 'Second mock + cheat sheet',
        steps: [
          { kind: 'do', text: 'Second self-made mock: derivations from Part I (Bayes, MLE/MAP, logistic, backprop) plus PCA, LDA and SVM. 2 h, closed book.', min: 120 },
          { kind: 'read', note: 'EE5907 Cheat Sheet', min: 10 },
          { kind: 'do', text: 'Write the one-page double-sided cheat sheet: front = Part I formulas, back = Part II recipes.', link: 'EE5907 Cheat Sheet', min: 120 },
          { kind: 'quiz', notes: ['K-means and Hierarchical Clustering', 'GMM and EM', 'Boosting', 'RBF Networks'], min: 15 },
        ] },
      { id: 'w6-sun', date: '2026-11-22', label: 'Sun 22 Nov', course: 'EE5101', title: 'Redo + procedure sheet',
        steps: [
          { kind: 'do', text: 'Redo the failed sub-questions from the 2021 paper, then problem sets 6–8 again.', files: ['P06 Problems.pdf', 'P07 Problems.pdf', 'P08 Problems.pdf'], min: 150 },
          { kind: 'do', text: 'Finish the open-book procedure sheet: steps for e^{At}, canonical-form T, Lyapunov, Riccati, decoupling and servo design.', min: 90 },
          { kind: 'quiz', notes: ['Matrix Exponential and State Solution', 'Decoupling Control', 'Observers and State Estimation', 'Servo Control'], min: 15 },
        ] },
    ],
  },
  {
    id: 'exam-week', short: 'Exam week', title: 'Exam week', phase: 'p4',
    dates: 'Wed 25 Nov – Tue 1 Dec', from: '2026-11-23', to: '2026-12-01',
    blurb: 'Light, spaced EE5907 review, the EE5907 exam on Saturday, then two full EE5101 days before Tuesday’s exam.',
    sessions: [
      { id: 'ex-wed', date: '2026-11-25', label: 'Wed 25 Nov', course: 'EE5907', title: 'Light review (45 min)',
        steps: [
          { kind: 'quiz', notes: ['Probability Basics', 'Bayes Rule and Bayesian Decision Theory', 'MLE MAP and Cross-Entropy', 'Classifier Evaluation Metrics'], min: 30 },
          { kind: 'do', text: 'Finalise the cheat sheet front.', link: 'EE5907 Cheat Sheet', min: 15 },
        ] },
      { id: 'ex-thu', date: '2026-11-26', label: 'Thu 26 Nov', course: 'EE5907', title: 'Light review (45 min)',
        steps: [
          { kind: 'quiz', notes: ['Linear Discriminants Perceptron Logistic LSE', 'MLP and Backpropagation', 'RBF Networks', 'Decision Trees and kNN'], min: 30 },
          { kind: 'do', text: 'Finalise the cheat sheet back.', link: 'EE5907 Cheat Sheet', min: 15 },
        ] },
      { id: 'ex-fri', date: '2026-11-27', label: 'Fri 27 Nov', course: 'EE5907', title: 'Light review (45 min)',
        steps: [
          { kind: 'quiz', notes: ['PCA', 'LDA', 'K-means and Hierarchical Clustering', 'GMM and EM', 'SVM', 'Boosting'], min: 35 },
          { kind: 'teach', note: 'PCA', min: 5 },
        ] },
      { id: 'ex-sat', date: '2026-11-28', label: 'Sat 28 Nov', course: 'EE5907', title: 'EE5907 exam, 1 PM',
        steps: [
          { kind: 'do', text: 'One-hour formula skim in the morning with the cheat sheet. Eat, travel early. Exam at 1:00 PM.', min: 60 },
        ] },
      { id: 'ex-sun', date: '2026-11-29', label: 'Sun 29 Nov', course: 'EE5101', title: 'Full EE5101 day',
        steps: [
          { kind: 'do', text: 'Timed paper in the morning (2.5 h).', min: 150 },
          { kind: 'quiz', notes: ['Controllability', 'Observability', 'State Feedback and Pole Placement', 'LQR Quadratic Optimal Control', 'Servo Control'], min: 20 },
          { kind: 'do', text: 'Afternoon: weak spots from the morning paper.', min: 150 },
        ] },
      { id: 'ex-mon', date: '2026-11-30', label: 'Mon 30 Nov', course: 'EE5101', title: 'Weak spots, early night',
        steps: [
          { kind: 'quiz', notes: ['Matrix Exponential and State Solution', 'Canonical Forms Realizations Stability', 'Decoupling Control', 'Observers and State Estimation'], min: 20 },
          { kind: 'do', text: 'Weak spots and the formula / procedure sheet. Stop early, sleep early.', min: 120 },
        ] },
      { id: 'ex-tue', date: '2026-12-01', label: 'Tue 1 Dec', course: 'EE5101', title: 'EE5101 exam, 1 PM',
        steps: [
          { kind: 'do', text: '30-minute skim of the procedure sheet. Exam at 1:00 PM.', min: 30 },
        ] },
    ],
  },
];
