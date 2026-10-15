"""K-means = assign each student to nearest tutor, tutors move to class centre, repeat."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
rng=np.random.default_rng(4);X=np.vstack([rng.normal(m,.6,(50,2)) for m in [(0,0),(4,0),(2,3.5)]])
C=X[[0,1,2]]+0.0;C=np.array([[1.,1],[1.5,1],[1.2,.5]])
fig,ax=plt.subplots(1,4,figsize=(15,3.6))
for it,a in enumerate(ax):
    lab=((X[:,None]-C[None])**2).sum(-1).argmin(1);a.scatter(*X.T,c=lab,cmap="Set1",s=8);a.scatter(*C.T,c="k",marker="X",s=140)
    a.set_title("iter %d: assign, then move"%it)
    C=np.array([X[lab==k].mean(0) if (lab==k).any() else C[k] for k in range(3)])
fig.suptitle("Bad starts can give bad clusters -> run several times (K-means++).")
finish(fig,"20_kmeans_steps")
