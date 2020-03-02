import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import BaseElevationLayer = require("esri/layers/BaseElevationLayer");
import ElevationLayer = require("esri/layers/ElevationLayer");

@subclass("esri.layers.BaseElevationLayer")
export class ExaggeratedElevationLayer extends declared(BaseElevationLayer) {

  constructor(properties?: { exaggeration: number }) {
    super();

    this.exaggeration = properties && properties.exaggeration;
  }

  @property()
  exaggeration = 200;

  private _elevation: ElevationLayer;

  load(): Promise<any> {
    this._elevation = new ElevationLayer({
      url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
    });

    // wait for the elevation layer to load before resolving load()
    return this.addResolvingPromise(this._elevation.load());
  }

  // Fetches the tile(s) visible in the view
  async fetchTile(level: number, row: number, col: number, options?: __esri.BaseElevationLayerFetchTileOptions) {
    const data: __esri.ElevationTileData = await this._elevation.fetchTile(level, row, col, options);

    const exaggeration = this.exaggeration;
    for (var i = 0; i < data.values.length; i++) {
      // each value represents an elevation sample for the
      // given pixel position in the tile. Multiply this
      // by the exaggeration value
      data.values[i] = data.values[i] * exaggeration;
    }

    return data;
  }
}
