"""Bayes rule = a crowd of 1000 people. Rare disease + good test != likely sick."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
N=1000; prev=0.01; sens=0.95; fpr=0.05
sick=int(N*prev); tp=round(sick*sens); healthy=N-sick; fp=round(healthy*fpr)
rng=np.random.default_rng(0); xy=rng.random((N,2))
lab=np.zeros(N,int); lab[:sick]=1  # sick
pos=np.zeros(N,bool); pos[:tp]=True; pos[sick:sick+fp]=True
fig,ax=plt.subplots(1,2,figsize=(11,4.5))
ax[0].scatter(*xy[lab==0].T,c="lightgray",s=12,label="healthy (990)"); ax[0].scatter(*xy[lab==1].T,c="red",s=30,label="sick (10)")
ax[0].set_title("1000 people, 1% sick"); ax[0].legend(loc="lower right"); ax[0].axis("off")
c=np.where(pos,np.where(lab==1,"red","orange"),"lightgray")
ax[1].scatter(*xy.T,c=c,s=np.where(pos,30,10)); ax[1].axis("off")
ax[1].set_title("Test positive: %d red (true) vs %d orange (false)\nP(sick|+) = %d/%d = %.0f%%"%(tp,fp,tp,tp+fp,100*tp/(tp+fp)))
finish(fig,"06_bayes_crowd")
