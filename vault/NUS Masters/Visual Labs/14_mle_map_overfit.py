"""MLE vs MAP = trusting data alone vs data + prior hunch. 3 coin flips, 3 heads."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
th=np.linspace(0,1,400); fig,ax=plt.subplots(1,3,figsize=(13,3.8))
for a,n,h in zip(ax,[3,10,100],[3,8,52]):
    lik=th**h*(1-th)**(n-h); lik/=lik.max()
    pr=th**4*(1-th)**4; pr/=pr.max()
    po=lik*pr; po/=po.max()
    a.plot(th,lik,"b",label="likelihood (MLE=%.2f)"%(h/n)); a.plot(th,pr,"g:",label="prior (Beta 5,5)")
    a.plot(th,po,"r",label="posterior (MAP=%.2f)"%((h+4)/(n+8)))
    a.set_title("n=%d, heads=%d"%(n,h)); a.legend(fontsize=7)
fig.suptitle("Few data: MLE jumps to extremes, prior calms it. Lots of data: they agree.")
finish(fig,"14_mle_map_overfit")
