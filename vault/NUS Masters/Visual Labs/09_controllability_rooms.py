"""Controllability = can your single knob steer the state anywhere?
Two water tanks; input pours into tank 1 only."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish, expm_eig
def run(A,B,x0,T=6,n=300):
    ts=np.linspace(0,T,n); u=np.sin(2*ts)
    x=np.zeros((n,2)); xx=np.array(x0,float)
    dt=ts[1]-ts[0]
    for k in range(n): x[k]=xx; xx=xx+dt*(A@xx+B[:,0]*u[k])
    return x
B=np.array([[1.],[0]])
Ac=np.array([[-1,0],[1,-2.]])   # tank1 feeds tank2: controllable
Au=np.array([[-1,0],[0,-2.]])   # tanks isolated: tank2 unreachable
fig,ax=plt.subplots(1,2,figsize=(11,4))
for a,A,t in [(ax[0],Ac,"Coupled: rank[B AB]=%d"),(ax[1],Au,"Isolated: rank[B AB]=%d")]:
    r=np.linalg.matrix_rank(np.hstack([B,A@B]))
    for x0 in [(0,0),(1,-1),(-1,1)]:
        x=run(A,B,x0); a.plot(*x.T,lw=1); a.plot(*x[0],"ko",ms=3)
    a.set_title(t%r); a.set_xlabel("tank 1"); a.set_ylabel("tank 2")
fig.suptitle("Isolated case: tank 2 never feels the input -> it only decays on its own")
finish(fig,"09_controllability_rooms")
