"""Eigenvectors = the directions a matrix only stretches. Change A and see what survives."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
A = np.array([[1.0, 2.0], [2.0, 1.0]])        # try [[2,1],[0,1]] or [[1,-2],[2,1]] (rotation+stretch)
th = np.linspace(0, 2*np.pi, 200); circle = np.vstack([np.cos(th), np.sin(th)])
ell = A @ circle
w, V = np.linalg.eig(A)
fig, ax = plt.subplots(1, 2, figsize=(9, 4.2))
ax[0].plot(*circle, color="gray"); ax[0].set_title("Before: unit circle of directions")
ax[1].plot(*ell, color="tab:blue"); ax[1].set_title("After: A x  (ellipse)")
for a in ax: a.set_aspect("equal"); a.set_xlim(-3.5, 3.5); a.set_ylim(-3.5, 3.5)
for i in range(2):
    if np.isreal(w[i]):
        v = np.real(V[:, i]); v = v/np.linalg.norm(v)
        ax[0].annotate("", xy=v, xytext=(0, 0), arrowprops=dict(arrowstyle="->", color="tab:red", lw=2))
        ax[1].annotate("", xy=w[i].real*v, xytext=(0, 0), arrowprops=dict(arrowstyle="->", color="tab:red", lw=2))
        ax[1].text(*(w[i].real*v*1.08), "eigenvector\nλ=%.1f" % w[i].real, color="tab:red", fontsize=8)
fig.suptitle("Eigenvectors stay on their own line: Av = λv   (eigenvalues: %s)" % np.round(w, 2))
finish(fig, "01_eigenvectors")
