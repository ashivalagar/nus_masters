"""ROC = turning a threshold dial on a smoke alarm: sensitivity vs false alarms."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
rng=np.random.default_rng(0); neg=rng.normal(0,1,2000); pos=rng.normal(1.5,1,2000)
fig,ax=plt.subplots(1,2,figsize=(11,4)); x=np.linspace(-4,6,300)
g=lambda x,m:np.exp(-(x-m)**2/2)/np.sqrt(2*np.pi)
ax[0].fill_between(x,g(x,0),alpha=.4,label="negatives");ax[0].fill_between(x,g(x,1.5),alpha=.4,label="positives")
for th in [0,.75,1.5]: ax[0].axvline(th,color="k",ls="--",lw=.8)
ax[0].legend();ax[0].set_title("Slide threshold →: fewer false alarms, more misses")
ths=np.linspace(-4,6,200);tpr=[(pos>t).mean() for t in ths];fpr=[(neg>t).mean() for t in ths]
ax[1].plot(fpr,tpr,"r");ax[1].plot([0,1],[0,1],"k:")
for th in [0,.75,1.5]: ax[1].plot((neg>th).mean(),(pos>th).mean(),"ko")
ax[1].set_xlabel("FPR");ax[1].set_ylabel("TPR (recall)");ax[1].set_title("ROC: each threshold is one dot")
finish(fig,"15_roc_threshold_dial")
