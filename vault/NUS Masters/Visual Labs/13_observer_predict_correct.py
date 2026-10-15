"""Observer = GPS dead-reckoning + occasional fixes. Predict with model, correct with measurement error."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
A=np.array([[0,1],[-1,-.2]]); C=np.array([[1,0.]]); dt=.01; t=np.arange(0,15,dt)
fig,ax=plt.subplots(1,2,figsize=(12,4))
# crude gains by trial: use pole placement via characteristic polynomial of A-LC
def gains(a):  # desired s^2+2a s + a^2 ; A-LC = [[-l1,1],[-1-l2,-.2]] -> s^2+(.2+l1)s+(.2 l1+1+l2)
    l1=2*a-.2; l2=a*a-1-.2*l1; return np.array([[l1],[l2]])
for a,col in [(0.5,"g"),(3,"r")]:
    L=gains(a); x=np.array([1.,0]); xh=np.array([-1.,1.5]); e=[];tr=[];es=[]
    for k in range(len(t)):
        y=C@x; tr.append(x[0]); es.append(xh[0]); e.append(np.linalg.norm(x-xh))
        x=x+dt*(A@x); xh=xh+dt*(A@xh+L[:,0]*(y-C@xh)[0])
    ax[0].plot(t,es,col,label="estimate, observer pole≈-%g"%a); ax[1].plot(t,e,col)
ax[0].plot(t,tr,"k--",label="truth"); ax[0].legend(); ax[0].set_title("Estimate chases truth")
ax[1].set_title("Estimation error ‖x−x̂‖: fast observer converges quicker"); ax[1].set_yscale("log")
fig.suptitle("Rule: observer poles ~3-5x faster than controller poles (but more noise sensitivity)")
finish(fig,"13_observer_predict_correct")
