# SHP data source

`DataSHP.zip` is the runtime data source for the three geospatial layers in the ATLAS Webmap. Keep the filename unchanged when replacing the dataset.

| Map layer | Source inside the ZIP | Geometry | Features |
|---|---|---:|---:|
| Sepaku Admin | `Sepaku Admin.shp` | MultiPolygon | 1 |
| HTI Compartments | `IHM Sepaku HTI-per kompartemen.shp` | Polygon | 9 |
| Jalan Sepaku | `Jalan_Sepaku.shp` | LineString | 8,227 |

The shapefiles use WGS84 geographic coordinates (EPSG:4326), so the website loads them directly into Leaflet through `shpjs`. The `.dbf`, `.shx`, `.prj`, `.cpg`, and `.qmd` files must remain inside the ZIP because the attribute popups and coordinate interpretation depend on them.

The source files are intentionally kept as SHP data rather than converted to a separate GeoJSON copy. Replace `DataSHP.zip` with a new ZIP using the same three layer names if the source data is updated.
