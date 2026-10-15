"""dx/dt = A x : phase portraits + time responses. e^{At} is the fast-forward button."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish, expm_eig
systems = {"stable node  (-1,-2)": np.array([[0, 1], [-2, -3]], float),
           "stable spiral (-0.2±1j)": np.array([[0, 1], [-1.04, -0.4]], float),
           "saddle  (unstable)": np.array([[0, 1], [2, 1]], float)}
fig, axs = plt.subplots(2, 3, figsize=(12, 6.4))
t = np.linspace(0, 8, 400)
for j, (name, A) in enumerate(systems.items()):
    ax = axs[0, j]; w = np.linalg.eigvals(A)
    for x0 in [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (0.5, -1), (-0.5, 1)]:
        tr = np.array([expm_eig(A, tt) @ np.array(x0, float) for tt in np.linspace(0, 4, 160)]).T
        ax.plot(tr[0], tr[1], lw=1.2); ax.plot(*x0, "ko", ms=3)
    ax.set_xlim(-2, 2); ax.set_ylim(-2, 2); ax.set_title("%s\neigs=%s" % (name, np.round(w, 2)), fontsize=9)
    ax.set_xlabel("x1 (position)"); ax.set_ylabel("x2 (velocity)")
    ax = axs[1, j]; x0 = np.array([1.0, 0.0])
    y = np.array([expm_eig(A, tt) @ x0 for tt in t]); ax.plot(t, np.clip(y[:, 0], -5, 5), label="x1"); ax.plot(t, np.clip(y[:, 1], -5, 5), label="x2")
    ax.set_xlabel("time"); ax.legend(); ax.set_ylim(-3, 3)
fig.suptitle("Phase portraits (top) and x(t)=e^{At}x0 from x0=(1,0) (bottom)")
finish(fig, "04_state_trajectories")
