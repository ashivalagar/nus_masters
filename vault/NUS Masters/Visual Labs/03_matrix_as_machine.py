"""A matrix is a machine that warps space. det = area scale; det=0 squashes everything flat (no undo)."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
mats = {"rotate 30°": np.array([[np.cos(.52), -np.sin(.52)], [np.sin(.52), np.cos(.52)]]),
        "stretch x2 in x": np.array([[2, 0], [0, 1]]), "shear": np.array([[1, 1], [0, 1]]),
        "squeeze (det 0.25)": np.array([[0.5, 0], [0, 0.5]]), "SINGULAR (det 0)": np.array([[1, 1], [1, 1]])}
fig, axs = plt.subplots(1, 5, figsize=(14, 3.2))
sq = np.array([[0, 1, 1, 0, 0], [0, 0, 1, 1, 0]], float)
g = np.linspace(-1, 2, 7)
for ax, (name, M) in zip(axs, mats.items()):
    for x in g:
        l = M @ np.array([[x, x], [-1, 2]]); ax.plot(*l, color="lightgray", lw=0.7)
        l = M @ np.array([[-1, 2], [x, x]]); ax.plot(*l, color="lightgray", lw=0.7)
    ax.fill(*(M @ sq), color="tab:orange", alpha=0.6); ax.plot(*sq, "k--", lw=1)
    ax.set_title("%s\ndet = %.2f" % (name, np.linalg.det(M)), fontsize=9); ax.set_aspect("equal"); ax.set_xlim(-1.5, 3); ax.set_ylim(-1.5, 3)
fig.suptitle("Dashed = original unit square, orange = after the machine. det = area scale; det 0 = flattened, cannot be undone")
finish(fig, "03_matrix_as_machine")
