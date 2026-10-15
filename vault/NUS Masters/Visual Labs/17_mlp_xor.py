"""XOR: no line works. A hidden layer (or RBF bumps) bends the space."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
X=np.array([[0,0],[0,1],[1,0],[1,1.]]);y=np.array([0,1,1,0.])
rng=np.random.default_rng(1);W1=rng.normal(0,1,(2,4));b1=np.zeros(4);W2=rng.normal(0,1,4);b2=0.
sg=lambda z:1/(1+np.exp(-z)); loss=[]
for ep in range(6000):
    H=np.tanh(X@W1+b1);p=sg(H@W2+b2);d=p-y
    gW2=H.T@d;gb2=d.sum();dH=np.outer(d,W2)*(1-H**2);gW1=X.T@dH;gb1=dH.sum(0)
    for P,g in ((W1,gW1),(b1,gb1),(W2,gW2)): P-=0.3*g
    b2-=0.3*gb2; loss.append(-np.mean(y*np.log(p+1e-9)+(1-y)*np.log(1-p+1e-9)))
g=np.linspace(-.5,1.5,200);xx,yy=np.meshgrid(g,g);G=np.c_[xx.ravel(),yy.ravel()]
P=sg(np.tanh(G@W1+b1)@W2+b2).reshape(xx.shape)
fig,ax=plt.subplots(1,3,figsize=(14,4))
ax[0].contourf(xx,yy,P,20,cmap="coolwarm",alpha=.7);ax[0].scatter(*X.T,c=y,cmap="coolwarm",s=120,edgecolor="k");ax[0].set_title("MLP (4 tanh hidden) solves XOR")
ax[1].semilogy(loss);ax[1].set_title("Backprop: loss falls (log scale)");ax[1].set_xlabel("epoch")
cs=X[[0,3]] # RBF centres on the two class-0 corners
phi=lambda A:np.exp(-((A[:,None,:]-cs[None])**2).sum(-1)/(2*.5**2))
F=phi(X);ax[2].scatter(F[:,0],F[:,1],c=y,cmap="coolwarm",s=120,edgecolor="k");ax[2].set_title("RBF: in (φ1,φ2) space XOR becomes line-separable");ax[2].set_xlabel("φ1");ax[2].set_ylabel("φ2")
finish(fig,"17_mlp_xor")
