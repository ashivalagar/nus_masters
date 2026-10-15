"""LQR = the budget dial: cheap control (small R) vs cheap error (small Q)."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
A=np.array([[0,1],[0,0.]]); B=np.array([[0],[1.]])
def lqr(Q,R):
    n=2; Rinv=np.linalg.inv(R); H=np.block([[A,-B@Rinv@B.T],[-Q,-A.T]])
    w,V=np.linalg.eig(H); Vs=V[:,w.real<0]; X1,X2=Vs[:n],Vs[n:]
    P=np.real(X2@np.linalg.inv(X1)); return Rinv@B.T@P
fig,ax=plt.subplots(1,2,figsize=(12,4)); t=np.linspace(0,10,1000); dt=t[1]-t[0]
for r,c in [(0.01,"r"),(1,"b"),(100,"g")]:
    K=lqr(np.eye(2),np.array([[r]])); x=np.array([1.,0]); xs=[];us=[]
    for _ in t: u=-(K@x)[0]; xs.append(x[0]); us.append(u); x=x+dt*(A@x+B[:,0]*u)
    ax[0].plot(t,xs,c,label="R=%g"%r); ax[1].plot(t,us,c)
ax[0].set_title("State x1 (error)"); ax[0].legend(); ax[1].set_title("Control effort u")
fig.suptitle("Small R: aggressive, big u. Large R: lazy, slow. Q vs R is a budget choice.")
finish(fig,"11_lqr_tradeoff")
