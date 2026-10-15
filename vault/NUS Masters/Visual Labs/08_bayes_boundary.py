"""Bayes decision boundary: equal covariances -> straight line; priors slide it."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
m1,m2=np.array([-1.,0]),np.array([1.,0.5])
def post(X,S1,S2,p1):
    def g(X,m,S):
        d=X-m; Si=np.linalg.inv(S); return np.exp(-.5*np.einsum('...i,ij,...j',d,Si,d))/np.sqrt(np.linalg.det(S))
    a=g(X,m1,S1)*p1; b=g(X,m2,S2)*(1-p1); return a/(a+b)
x=np.linspace(-4,4,300); X=np.stack(np.meshgrid(x,x),-1)
I=np.eye(2); S2=np.array([[2.5,.8],[.8,.6]])
cfg=[("equal Σ, p1=.5",I,I,.5),("equal Σ, p1=.9 (line slides away)",I,I,.9),("different Σ -> curved",I,S2,.5)]
fig,ax=plt.subplots(1,3,figsize=(13,4))
for a,(t,A,B,p) in zip(ax,cfg):
    P=post(X,A,B,p); a.contourf(x,x,P,levels=[0,.5,1],colors=["#ffd6d6","#d6e4ff"]); a.contour(x,x,P,[.5],colors="k")
    a.plot(*m1,"bo");a.plot(*m2,"ro");a.set_title(t);a.set_aspect("equal")
finish(fig,"08_bayes_boundary")
