"""kNN = ask your k nearest neighbours. k=1 memorises noise; big k is a lazy majority vote."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
rng=np.random.default_rng(5);X=np.vstack([rng.normal([-.8,0],1,(60,2)),rng.normal([.8,0],1,(60,2))]);y=np.r_[np.zeros(60),np.ones(60)]
g=np.linspace(-4,4,150);xx,yy=np.meshgrid(g,g);G=np.c_[xx.ravel(),yy.ravel()]
D=((G[:,None]-X[None])**2).sum(-1);idx=np.argsort(D,1)
fig,ax=plt.subplots(1,3,figsize=(14,4))
for a,k in zip(ax,[1,15,100]):
    p=y[idx[:,:k]].mean(1).reshape(xx.shape);a.contourf(xx,yy,p,levels=[0,.5,1],colors=["#ffd6d6","#d6e4ff"]);a.scatter(*X.T,c=y,cmap="coolwarm",s=10,edgecolor="k",lw=.3);a.set_title("k=%d"%k)
fig.suptitle("k small: jagged/overfit. k large: smooth/underfit.")
finish(fig,"18_knn_boundary")
