---
tags: [ee5101, course-map]
---
# EE5101 / ME5401 Linear Systems — Course Map
Home: [[Masters Mind]] · Exam: **Tue 1 Dec 2026, 1:00–3:30 PM** · Intel: [[Exam Intel]]
Lecturers: Dr Jianshu Zhou (Part 1, L1–L5) · Dr Armin Lederer (Part 2, L6–L11). Lectures Mon 6–9 PM.
Assessment: **Final 70% (Parts 1+2)** + **Part 2 project 30%** (brief not yet released).

## Big picture
Model a system in state space → understand its behaviour (modes, stability) → ask whether you can steer it (controllability) and see it (observability) → design feedback (pole placement, LQR, servo, decoupling) → estimate unmeasured states (observer).

```
State-space model ─► solution & modes ─► controllability / observability
        │                                         │
        ▼                                         ▼
 canonical forms, stability ──► state feedback ─► LQR ─► servo ─► decoupling
                                      └──── observer (state estimation)
```

## Lecture by lecture
| # | Topic | Status | Concept notes | Files |
|---|---|---|---|---|
| L1 | Introduction to linear control systems | ✅ available | [[State-Space Representation]] | [[L01 Introduction to Linear Control Systems.pdf]] |
| L2 | Mathematical tools for linear systems | ✅ available | [[00 Math Roadmap]] (notes 1–5) | [[L02 Mathematical Tools (textbook chapter).pdf]] (447-page textbook, use as reference only) |
| L3 | State-space dynamics and system modes | ✅ | [[Matrix Exponential and State Solution]], [[System Modes]] | [[L03 State-Space Dynamics and System Modes.pdf]] |
| L4 | Controllability and observability | ✅ | [[Controllability]], [[Observability]] | [[L04 Controllability and Observability.pdf]] |
| L5 | Canonical forms, realizations and stability | ✅ | [[Canonical Forms Realizations Stability]] | [[L05 Canonical Forms Realizations and Stability.pdf]] |
| L6 | Linear state feedback and pole placement | ✅ | [[State Feedback and Pole Placement]] | [[L06 Linear State Feedback and Pole Placement.pdf]], [[L06 Linear State Feedback and Pole Placement (annotated).pdf\|annotated]], [[P06 Problems.pdf]], [[P06 Solutions.pdf]], [[robot_demo_code.zip]] |
| L7 | Quadratic optimal control (LQR) | ✅ | [[LQR Quadratic Optimal Control]] | [[L07 Quadratic Optimal Control.pdf]], [[L07 Quadratic Optimal Control (annotated).pdf\|annotated]], [[P07 Problems.pdf]], [[P07 Solutions.pdf]], [[satellite_sim.zip]] |
| L8 | Servo control | ✅ | [[Servo Control]] | [[L08 Servo Control.pdf]], [[P08 Problems.pdf]], [[P08 Solutions.pdf]], [[servo.zip]] |
| L9 | Decoupling control | ⏳ Mon 19 Oct (expected) | [[Decoupling Control]] | — |
| L10 | State estimation | ⏳ Mon 26 Oct (expected) | [[Observers and State Estimation]] | — |
| L11 | Recap of Part 2 | ⏳ Mon 2 Nov (expected) | — | — |

## Exam topic weights (from the 2021/22 paper — see [[EE5101 Past Paper Analysis]])
Format then: open book, 2.5 h, 4 compulsory questions × 25 marks.
| Topic | In 2021/22 paper | Priority |
|---|---|---|
| $e^{At}$ (Cayley–Hamilton), eigenvalues, modes | Q1a, Q1c | ⭐⭐⭐ |
| Similarity transformation / canonical forms | Q1b, Q3a | ⭐⭐⭐ |
| Controllability (with parameters), transfer function | Q2a | ⭐⭐⭐ |
| Lyapunov stability | Q2b | ⭐⭐ |
| Conceptual true/false on $e^{At}$ | Q2c | ⭐ |
| Multi-input pole placement (canonical form method) | Q3a | ⭐⭐⭐ |
| LQR (incl. cross term) | Q3b | ⭐⭐⭐ |
| Decoupling | Q4a | ⭐⭐ |
| Servo / internal model, disturbance rejection | Q4b | ⭐⭐⭐ |
| Observers / state estimation | not tested in 2021 | ⭐⭐ (still learn it) |

## Minimum viable toolkit for the exam (my guess — verify with past papers)
1. Convert a system to state space, get eigenvalues, say if stable.
2. Compute $e^{At}$ for a 2×2 matrix.
3. Rank tests for controllability and observability.
4. Place poles by hand (Ackermann or coefficient matching).
5. Solve a small scalar/2×2 LQR via the Riccati equation.
6. Design an observer and combine with state feedback (separation principle).

## Practice material already available
Problem sets 6–8 with solutions (Part 2 only). Part 1 problem sets / tutorials not on Canvas — ask the lecturer or check past papers.
