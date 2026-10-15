"""Perceptron = nudge the fence when a sheep is on the wrong side. Logistic = soft fence."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
rng=np.random.default_rng(3); X=np.vstack([rng.normal([-1.5,-1],.8,(40,2)),rng.normal([1.5,1],.8,(40,2))]); y=np.r_[-np.ones(40),np.ones(40)]
Xb=np.c_[X,np.ones(80)]; w=np.zeros(3); snaps=[]
for ep in range(6):
    for i in rng.permutation(80):
        if y[i]*(Xb[i]@w)<=0: w=w+y[i]*Xb[i]
    snaps.append(w.copy())
fig,ax=plt.subplots(1,3,figsize=(14,4)); x=np.linspace(-4,4,50)
ax[0].scatter(*X.T,c=y,cmap="coolwarm",s=15)
for k,w_ in enumerate(snaps):
    if abs(w_[1])>1e-9: ax[0].plot(x,-(w_[0]*x+w_[2])/w_[1],alpha=.3+.7*k/5)
ax[0].set_ylim(-4,4);ax[0].set_title("Perceptron: line rotates after each epoch")
wl=np.zeros(3)
for _ in range(500): p=1/(1+np.exp(-Xb@wl)); wl-=0.1*Xb.T@(p-(y+1)/2)/80
xx,yy=np.meshgrid(x,x);P=1/(1+np.exp(-(wl[0]*xx+wl[1]*yy+wl[2])))
c=ax[1].contourf(xx,yy,P,20,cmap="coolwarm",alpha=.7);ax[1].scatter(*X.T,c=y,cmap="coolwarm",s=12,edgecolor="k",lw=.3);ax[1].set_title("Logistic: probability fades across the fence")
z=np.linspace(-6,6,100);ax[2].plot(z,1/(1+np.exp(-z)));ax[2].set_title("Sigmoid squashes any score to 0..1");ax[2].set_xlabel("score wᵀx+b")
finish(fig,"16_perceptron_logistic")
