"""Covariance = shape of a point cloud; eigenvectors = its axes; PCA = the long axis."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
rng=np.random.default_rng(1)
covs=[np.array([[1,0],[0,1]]),np.array([[3,0],[0,0.4]]),np.array([[2,1.6],[1.6,2]]),np.array([[2,-1.6],[-1.6,2]])]
fig,ax=plt.subplots(1,4,figsize=(14,3.6))
for a,S in zip(ax,covs):
    X=rng.multivariate_normal([0,0],S,400); a.scatter(*X.T,s=5,alpha=.5)
    w,V=np.linalg.eigh(S)
    for l,v in zip(w,V.T): a.arrow(0,0,*(2*np.sqrt(l)*v),color="r",width=.03,length_includes_head=True)
    a.set_title("Σ=%s"%np.round(S,1).tolist(),fontsize=8); a.set_xlim(-5,5); a.set_ylim(-5,5); a.set_aspect("equal")
fig.suptitle("Red arrows = eigenvectors of Σ, length ∝ √eigenvalue (spread). Off-diagonal = tilt.")
finish(fig,"07_covariance_cloud")
