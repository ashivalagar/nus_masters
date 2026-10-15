"""SVM = widest street between classes; only support vectors (kerb posts) matter. C = tolerance for jaywalkers."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
rng=np.random.default_rng(7);X=np.vstack([rng.normal([-1.2,-1.2],.9,(40,2)),rng.normal([1.2,1.2],.9,(40,2))]);y=np.r_[-np.ones(40),np.ones(40)]
def fit(C,ep=60000):
    lam=1/(C*len(y));w=np.zeros(2);b=0.;ws=np.zeros(2);bs=0.;n=0
    for t in range(1,ep+1):
        i=rng.integers(80);eta=1/(lam*(t+50))
        m=y[i]*(X[i]@w+b)<1
        w=(1-eta*lam)*w+(eta*y[i]*X[i] if m else 0); b+=eta*y[i]*.1 if m else 0
        if t>ep//2: ws+=w;bs+=b;n+=1
    return ws/n,bs/n
fig,ax=plt.subplots(1,3,figsize=(14,4.2));x=np.linspace(-4,4,10)
for a,C in zip(ax,[0.05,1,50]):
    w,b=fit(C);a.scatter(*X.T,c=y,cmap="coolwarm",s=14)
    sv=np.abs(y*(X@w+b)-1)<.3 ;sv|=(y*(X@w+b)<1);a.scatter(*X[sv].T,s=90,facecolors="none",edgecolors="k")
    for off,ls in [(0,"-"),(1,"--"),(-1,"--")]: a.plot(x,-(w[0]*x+b-off)/w[1],"k",ls=ls,lw=1)
    a.set_ylim(-4,4);a.set_title("C=%g  margin width=%.2f"%(C,2/np.linalg.norm(w)))
fig.suptitle("Small C: wide street, tolerates violations. Large C: narrow street, punishes every violation.")
finish(fig,"21_svm_margin_C")
