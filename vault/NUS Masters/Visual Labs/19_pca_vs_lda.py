"""PCA = best shadow (max variance). LDA = best shadow for SEPARATING classes. Not the same!"""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
rng=np.random.default_rng(2);S=np.array([[6,0],[0,.4]])
X0=rng.multivariate_normal([0,-1.2],S,200);X1=rng.multivariate_normal([0,1.2],S,200);X=np.vstack([X0,X1]);y=np.r_[np.zeros(200),np.ones(200)]
Xc=X-X.mean(0);w,V=np.linalg.eigh(np.cov(Xc.T));pc=V[:,-1]
Sw=np.cov(X0.T)+np.cov(X1.T);lda=np.linalg.solve(Sw,X1.mean(0)-X0.mean(0));lda/=np.linalg.norm(lda)
fig,ax=plt.subplots(1,3,figsize=(14,4))
ax[0].scatter(*X.T,c=y,cmap="coolwarm",s=6)
for v,c,l in [(pc,"g","PCA"),(lda,"k","LDA")]: ax[0].plot(*np.c_[-6*v,6*v].T,c,label=l)
ax[0].legend();ax[0].set_aspect("equal");ax[0].set_title("Same data, two axes")
for a,v,t in [(ax[1],pc,"Project on PCA: classes overlap"),(ax[2],lda,"Project on LDA: classes split")]:
    p=X@v;a.hist(p[y==0],30,alpha=.6);a.hist(p[y==1],30,alpha=.6);a.set_title(t)
finish(fig,"19_pca_vs_lda")
