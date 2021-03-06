import pydeck
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs

# Specify the name of your library, see index.js in the js/ directory
pydeck.settings.custom_libraries = [
    {
        "libraryName": "LODTextLayerLibrary",
        "resourceUri": "https://unpkg.com/pydeck-lod-text-layer/dist/bundle.js",
        # "resourceUri": "http://localhost:8080/dist/bundle.js",
    }
]

n_clusters_per_level = [128, 64, 32, 16, 8, 4]
base_data, _ = make_blobs(n_samples=500, centers=50, cluster_std=0.5, random_state=42)
base_df = pd.DataFrame(
    {
        "x": base_data.T[0],
        "y": base_data.T[1],
        "label_level": np.zeros(500, dtype=np.int32),
        "label": [f"point-{i}" for i in range(500)],
        "label_color": [[0, 0, 0] for i in range(500)],
        "label_size": np.full(500, 2048, dtype=np.int32)
    }
)
dataframes = [base_df]
for i, n_clusters in enumerate(n_clusters_per_level, 1):
    km = KMeans(n_clusters=n_clusters).fit(base_data)
    level_data = km.cluster_centers_
    level_df = pd.DataFrame(
        {
            "x": level_data.T[0],
            "y": level_data.T[1],
            "label_level": np.full(n_clusters, i, dtype=np.int32),
            "label": [f"level {i}\ncluster {j}" for j in range(n_clusters)],
            "label_color": [[24 * i, 24 * i, 24 * i] for j in range(n_clusters)],
            "label_size": np.full(n_clusters, 2048 * (i+1)**2, dtype=np.int32)
        }
    )
    dataframes.append(level_df)

data = pd.concat(dataframes)

custom_layer = pydeck.Layer(
    "LODTextLayer",
    data=data,
    billboard=False,
    get_position=["x", "y"],
    get_text="label",
    get_level="label_level",
    get_size="label_size",
    get_color="label_color",
    size_units='"meters"',
    size_scale=1,
    line_width_min_pixels=1,
    line_height=0.5,
    # font_family="arial",
    get_text_anchor=pydeck.types.String("middle"),
    get_alignment_baseline=pydeck.types.String("center"),
    maxZoom=8,
    minZoom=2,
    fadeRate=0.75,
)
point_layer = pydeck.Layer(
    "ScatterplotLayer",
    base_df,
    coordinate_system=None,
    coordinate_origin=[0, 0],
    get_position=["x", "y"],
    get_radius=1024,
    radius_min_pixels=8,
    radius_max_pixels=16,
    get_color=[255, 64, 8, 128],
)

view_state = pydeck.ViewState(latitude=0, longitude=0, zoom=6)

r = pydeck.Deck([point_layer, custom_layer], initial_view_state=view_state, map_provider=None)

r.to_html("custom_layer.html", css_background_color="#333")
