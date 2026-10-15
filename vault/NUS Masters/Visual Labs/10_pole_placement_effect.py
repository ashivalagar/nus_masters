"""Pole placement = choosing the closed-loop personality (spring-damper)."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
t=np.linspace(0,8,500)
fig,ax=plt.subplots(1,2,figsize=(12,4))
for p,c in [(-1,"g"),(-3,"b"),(-8,"r")]:
    ax[0].plot(t,1-np.exp(p*t),c,label="pole at %d"%p)
ax[0].set_title("First order: farther left = faster"); ax[0].legend()
wn=3
for z in [0.1,0.5,1,2]:
    if z<1:
        wd=wn*np.sqrt(1-z*z); y=1-np.exp(-z*wn*t)*(np.cos(wd*t)+z/np.sqrt(1-z*z)*np.sin(wd*t))
    elif z==1: y=1-np.exp(-wn*t)*(1+wn*t)
    else:
        s=np.sqrt(z*z-1); p1,p2=-wn*(z-s),-wn*(z+s); y=1+(p2*np.exp(p1*t)-p1*np.exp(p2*t))/(p1-p2)
    ax[1].plot(t,y,label="ζ=%.1f"%z)
ax[1].set_title("Second order: poles' angle sets damping (ζ)"); ax[1].legend()
fig.suptitle("Gain K moves poles; poles shape the step response. Too far left = huge control effort.")
finish(fig,"10_pole_placement_effect")
