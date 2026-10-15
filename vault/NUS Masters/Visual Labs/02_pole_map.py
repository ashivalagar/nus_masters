"""The pole map: where the pole sits in the complex plane decides the behaviour."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
poles = {"fast decay  s=-3": -3, "slow decay  s=-0.5": -0.5, "wobble+decay  -0.5±3j": -0.5+3j,
         "pure oscillation ±2j": 2j, "wobble+grow  +0.3±2j": 0.3+2j, "runaway  s=+0.5": 0.5}
fig = plt.figure(figsize=(11, 5))
axm = fig.add_subplot(1, 2, 1)
axm.axvline(0, color="k", lw=1); axm.axhline(0, color="k", lw=1)
axm.axvspan(-4, 0, color="tab:green", alpha=0.08); axm.axvspan(0, 1.5, color="tab:red", alpha=0.08)
axm.text(-3.8, 3.3, "LEFT = Lives (stable)", color="tab:green"); axm.text(0.05, 3.3, "RIGHT =\nRuns away", color="tab:red")
cols = plt.cm.tab10(np.arange(6)); t = np.linspace(0, 8, 600)
axr = fig.add_subplot(1, 2, 2)
for (name, p), c in zip(poles.items(), cols):
    pts = [p] if np.isreal(p) else [p, np.conj(p)]
    axm.plot([q.real for q in pts], [q.imag for q in pts], "x", color=c, ms=10, mew=3)
    y = np.real(np.exp(p*t)) if np.isreal(p) else np.exp(p.real*t)*np.cos(p.imag*t)
    axr.plot(t, np.clip(y, -3, 3), color=c, label=name)
axm.set_xlim(-4, 1.5); axm.set_ylim(-3.6, 3.6); axm.set_xlabel("real part (decay/growth rate)"); axm.set_ylabel("imaginary part (wobble speed)")
axm.set_title("Pole map"); axr.set_title("Response of each mode"); axr.set_xlabel("time"); axr.legend(fontsize=7); axr.set_ylim(-3, 3)
finish(fig, "02_pole_map")
