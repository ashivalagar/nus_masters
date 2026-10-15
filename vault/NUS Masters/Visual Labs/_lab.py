"""Shared helper for the Visual Labs. Only numpy + matplotlib are needed."""
import os
import matplotlib
if os.environ.get("LAB_NOSHOW") == "1":
    matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "images")
os.makedirs(IMG, exist_ok=True)
plt.rcParams.update({"figure.dpi": 110, "axes.grid": True, "grid.alpha": 0.25,
                     "axes.spines.top": False, "axes.spines.right": False, "font.size": 9})

def finish(fig, name):
    """Save the figure into images/<name>.png and show it (unless LAB_NOSHOW=1)."""
    fig.tight_layout()
    fig.savefig(os.path.join(IMG, name + ".png"), bbox_inches="tight")
    if os.environ.get("LAB_NOSHOW") != "1":
        plt.show()
    plt.close(fig)
    print("saved images/%s.png" % name)

def expm_eig(A, t):
    """Matrix exponential via eigen-decomposition (diagonalizable A)."""
    w, V = np.linalg.eig(A)
    return np.real(V @ np.diag(np.exp(w * t)) @ np.linalg.inv(V))
