---
tags: [ee5101, upcoming]
---
# Decoupling Control (upcoming — Lecture 9)
Course map: [[EE5101 Course Map]] · Needs: [[State Feedback and Pole Placement]]
**Primer written before the lecture — update after class.**

## 🧠 Mental picture
- **The shower with separate hot and cold taps.** Turn "hot" and both temperature and flow change; turn "cold" and both change again. *Decoupling* gives you new controls — a **temperature knob** and a **flow knob** — each of which changes exactly one thing.
- **Orchestra view:** each output should listen to only one conductor.
- Mathematically: a feedback + input transformation $u=-Kx+Fv$ that makes the input–output map diagonal — the system becomes independent chains of integrators.
- *Where it breaks:* decoupling cancels cross-couplings exactly, so it is sensitive to model error, and may require non-minimum-phase-style cancellations.

## Idea
In a MIMO system each input normally affects several outputs. **Decoupling** designs the controller so each output responds to exactly one (new) input: $y_i$ depends only on $v_i$.

## Typical machinery
- Relative degree $d_i$ of output $i$: smallest $k$ with $c_iA^{k-1}B\ne0$.
- Build the matrix $B^*$ whose rows are $c_iA^{d_i-1}B$. If $B^*$ is **non-singular**, state feedback $u=-K x+Fv$ can decouple the system.
- The decoupled system is a set of independent chains of integrators — pole placement then handles each chain.

## Self-test (fill in after lecture)
1. What does it mean physically for a system to be decoupled?
2. When can static state feedback not decouple a system?

## Mistakes log
-
