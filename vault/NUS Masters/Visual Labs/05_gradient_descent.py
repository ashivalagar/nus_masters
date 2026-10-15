"""Gradient descent = a hiker in fog. Learning rate = stride length."""
import numpy as np, matplotlib.pyplot as plt
from _lab import finish
f = lambda w: (w-3)**2; g = lambda w: 2*(w-3)
fig, ax = plt.subplots(1, 2, figsize=(11, 4.2))
ws = np.linspace(-1, 7, 200); ax[0].plot(ws, f(ws), "k")
for eta, c in [(0.05, "tab:green"), (0.4, "tab:blue"), (0.95, "tab:orange"), (1.05, "tab:red")]:
    w = 0.0; path = [w]
    for _ in range(12): w = w - eta*g(w); path.append(w)
    path = np.clip(np.array(path), -1, 7); ax[0].plot(path, f(path), "o-", color=c, ms=4, label="η=%.2f" % eta)
ax[0].set_title("f(w)=(w-3)²: tiny η crawls, η≈1 ping-pongs, η>1 diverges"); ax[0].legend(); ax[0].set_ylim(0, 25)
# elongated bowl in 2D
Q = np.diag([1.0, 15.0]); F = lambda p: 0.5*p @ Q @ p; G = lambda p: Q @ p
X, Y = np.meshgrid(np.linspace(-4, 4, 120), np.linspace(-2, 2, 120)); Z = 0.5*(X**2 + 15*Y**2)
ax[1].contour(X, Y, Z, 15, colors="lightgray")
for eta, c in [(0.02, "tab:green"), (0.12, "tab:red")]:
    p = np.array([-3.5, 1.5]); path = [p.copy()]
    for _ in range(40): p = p - eta*G(p); path.append(p.copy())
    path = np.array(path); ax[1].plot(*path.T, ".-", color=c, label="η=%.2f" % eta)
ax[1].legend(); ax[1].set_title("Narrow valley: big η zig-zags across it")
finish(fig, "05_gradient_descent")
