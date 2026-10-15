---
tags: [ee5101]
---
# Servo Control
Course map: [[EE5101 Course Map]] · Source: [[L08 Servo Control.pdf]], problems [[P08 Problems.pdf]], solutions [[P08 Solutions.pdf]], code [[servo.zip]]
Needs: [[State Feedback and Pole Placement]] · **Check the slides** — the lecture develops a polynomial approach to SISO pole placement; this note holds the general picture.

## 🧠 Mental picture
- **Cruise control.** *Feedforward* = "the road is flat, I know roughly how much throttle gives 100 km/h" — fine until a hill appears. *Integral action* = a patient driver who keeps nudging the pedal as long as there is *any* speed error; the integral remembers all past error and only stops pushing when the error is exactly zero.
- **Thermostat:** proportional control stops short of the setpoint ("close enough"); the integrator keeps adding heat until the room reads exactly right.
- **Internal model principle = "to track it, you must contain a copy of it."** To follow a constant you need an integrator (1/s); to follow $\sin t$ you need oscillator dynamics $1/(s^2+1)$ inside the controller; to reject a step disturbance you need an integrator too. (That's exam Q4b.)
- *Where it breaks:* integrators also cause overshoot/windup — extra memory has a cost.
- 👀 Try it: `12_servo_integral.py`

![[12_servo_integral.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Goal
Make the output $y$ **track a reference** $r$ (e.g. a constant setpoint) with zero steady-state error, despite constant disturbances/model error.

## Two standard tools
1. **Feedforward / pre-compensator.** With $u=-Kx+Nr$, closed-loop DC gain is $-C(A-BK)^{-1}BN$. Choose
   $N=-\big[C(A-BK)^{-1}B\big]^{-1}$ (square system) so $y_{ss}=r$. Works only if the model is exact.
2. **Integral action (servo compensator).** Add an integrator state $\dot e=r-y$ and feed it back: this is robust to modelling errors because the integrator forces $e\to0$ in steady state. Augmented system is stabilised by state feedback on $(x,e)$ — requires $(A,B)$ controllable and no transmission zero at the origin.

## Polynomial approach (L08)
Pole placement for SISO systems done directly on the transfer function: solve a polynomial (Diophantine) equation for the controller so the closed-loop characteristic polynomial equals a chosen one. Check the slide for when solutions exist and their order.

## Self-test
1. Why does the feedforward-only design fail under parameter error? *(DC gain no longer cancels exactly)*
2. Why does an integrator give zero steady-state error to a constant reference? *(ė=0 forces y=r)*

## Mistakes log
-
