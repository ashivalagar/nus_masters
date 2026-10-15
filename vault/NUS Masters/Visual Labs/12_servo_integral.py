"""Servo / internal model = cruise control. P-only leaves an offset under disturbance; integrator removes it."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
dt=.01; t=np.arange(0,20,dt); r=1.0
def sim(ki):
    y=0.;I=0.;ys=[]
    for k,tk in enumerate(t):
        d=-0.5 if tk>10 else 0.   # hill at t=10
        e=r-y; I+=e*dt; u=3*e+ki*I
        y+=dt*(-y+u+d); ys.append(y)
    return ys
fig,ax=plt.subplots(figsize=(8,4))
ax.plot(t,sim(0),label="P only (offset!)"); ax.plot(t,sim(2),label="P + integral")
ax.axhline(r,color="k",ls=":"); ax.axvline(10,color="gray",ls="--"); ax.text(10.2,.2,"hill (disturbance)")
ax.legend(); ax.set_title("The integrator keeps 'remembering' error until it is exactly zero")
finish(fig,"12_servo_integral")
