---
tags: [ee5907]
---
# K-means and Hierarchical (Agglomerative) Clustering
Course map: [[EE5907 Course Map]] · Source: [[W08 K-means and Agglomerative Clustering (workshop, updated).pdf]]
Next: [[GMM and EM]] (soft version of K-means)

## 🧠 Mental picture
- **K-means = pizza shops and customers.** Each customer goes to the nearest shop (assign); each shop then moves to the centre of its customers (update). Repeat until no shop moves. A bad starting layout can end in a poor arrangement (local minimum), so restart a few times.
- **Hierarchical = a family tree / party mingling.** Everyone starts alone; the two closest people join; groups join groups. The **dendrogram height** is how far apart a group was before it merged.
- **Linkage = how groups measure distance:** *single* = "friend-of-a-friend" chains (one close pair is enough); *complete* = "everybody in both groups must be near" (compact groups); *average* = a compromise.
- 👀 Try it: `20_kmeans_steps.py`

![[20_kmeans_steps.png]]
> *Predict first: before you look at the picture or run the script, say out loud what you expect. Then check. Surprises are where learning sticks.*

## Clustering
**Unsupervised** grouping. Partitional (K-means) vs hierarchical; hard (each point in one cluster) vs soft ([[GMM and EM]]).

## K-means
1. Choose $K$; initialise $K$ centroids (random points).
2. **Assign** each point to its nearest centroid.
3. **Update** each centroid to the mean of its points.
4. Repeat until assignments stop changing.
It minimises within-cluster sum of squares $\sum_k\sum_{x\in C_k}\|x-\mu_k\|^2$; each step never increases it, so it **converges, but to a local minimum** (try several initialisations / K-means++). Limits: needs $K$, assumes round similar-size clusters, sensitive to outliers. Choose $K$ with the elbow method or silhouette score.
Example: points $1,2,6,7$, $K=2$, init $1$ and $6$ → clusters $\{1,2\},\{6,7\}$, means $1.5,6.5$, stable.

## Agglomerative clustering
Start with each point its own cluster; repeatedly **merge the closest two** until one remains; read clusters off the **dendrogram** by cutting at a height. Cluster distance (linkage):
- **MIN / single:** closest pair → chains, handles non-round shapes, sensitive to noise.
- **MAX / complete:** farthest pair → compact clusters, sensitive to outliers.
- **Group average:** mean of all pairwise distances → compromise.
- **Centroid / Ward:** distance between centroids (Ward: increase in variance).
Example on $1,2,6,7$: merges $(1,2)$ at 1, $(6,7)$ at 1, then the two groups at 4 (single: $|6-2|$) or 6 (complete: $|7-1|$). Cost $O(n^2)$–$O(n^3)$.

## Self-test
1. Why can K-means give different results on different runs? *(random init → local minima)*
2. Single vs complete linkage on the example above? *(4 vs 6)*
3. Which cluster shape defeats K-means? *(non-convex, e.g. two moons)*

## Mistakes log
-
