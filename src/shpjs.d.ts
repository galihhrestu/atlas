declare module "shpjs" {
  import type { FeatureCollection } from "geojson";

  type ShpFeatureCollection = FeatureCollection & {
    fileName?: string;
  };

  const shp: (source: string | ArrayBuffer | Uint8Array) => Promise<ShpFeatureCollection | ShpFeatureCollection[]>;

  export default shp;
}
