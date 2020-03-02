/*
 * Copyright 2020 Esri
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />
import { declared, property, subclass } from "esri/core/accessorSupport/decorators";
import SceneView = require("esri/views/SceneView");
import Widget = require("esri/widgets/Widget");
import { renderable, tsx } from "esri/widgets/support/widget";

import watchUtils = require("esri/core/watchUtils");
import Layer = require("esri/layers/Layer");

type VNode = {
  /* avoid exposing vdom implementation details */
};

const CSS = {
  selected: "selected",
  small: "small",
};

const MESSAGES = {
  unsupported: "This layer is not supported"
}

type SceneViewResourceInfo = {
  /**
   * The total memory available in bytes.
   *
   * @name totalMemory
   * @instance
   * @type {number}
   */
  totalMemory: number;

  /**
   * The memory that is in use in bytes.
   *
   * @name usedMemory
   * @instance
   * @type {number}
   */
  usedMemory: number;

  /**
   * Quality level as a percentage.
   *
   * @name quality
   * @instance
   * @type {number} between 0..1
   */
  quality: number;

  /**
   * Average number of frame tasks waiting.
   *
   * @name load
   * @instance
   * @type {number}
   */
  load: number;

  /**
   * The memory currently in use by elevation layers and tiled layers, in bytes.
   *
   * @name terrainMemory
   * @instance
   * @type number
   */
  terrainMemory: number;

  /**
   * The memory currently in use by adding edges to 3D objects in scene layers or extruded polygons, in bytes.
   *
   * @name edgesMemory
   * @instance
   * @type number
   */
  edgesMemory: number;

  /**
   * An array containing information about non-tiled layers.
   *
   * @name resources
   * @instance
   * @type {Array<LayerResourceInfo>}
   */
  layerResourceInfo: LayerResourceInfo[];
}

type LayerResourceInfo = {
  /**
   * The layer.
   *
   * @name title
   * @instance
   * @type {string}
   */
  layer: Layer;

  /**
   * The memory currently in use by the layer, in bytes.
   *
   * @name memory
   * @instance
   * @type {number}
   */
  memory: number;

  /**
   * The number of loaded features.
   *
   * @name displayedFeatures
   * @instance
   * @type {number}
   */
  displayedFeatures: number;

  /**
   * The maximum number of features that can be displayed in this layer.
   * Increase or decrease it, by setting the `LayerView.maximumNumberOfFeatures` property.
   *
   * @name maxFeatures
   * @instance
   * @type {number}
   */
  maxFeatures: number;

  /**
   * The total number of features in a layer.
   *
   * @name totalFeatures
   * @instance
   * @type {number}
   */
  totalFeatures: number;
}

export type SceneViewWithResourceInfo = SceneView & { resourceInfo: SceneViewResourceInfo };

type CtorProperties = {
  view: SceneViewWithResourceInfo;
}

@subclass("esri.widgets.ResourceInfo")
export class ResourceInfo extends declared(Widget) {
  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------


  constructor(properties: CtorProperties) {
    super();
  }

  protected initialize(): void {
    watchUtils.init(this, "view", () => {
      if (this.intervalHandle) {
        window.clearInterval(this.intervalHandle);
      }

      window.setInterval(() => this.renderNow(), 1000);
    });
  }

  public destroy(): void {
    this.intervalHandle && window.clearInterval(this.intervalHandle);
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  @property()
  view: SceneViewWithResourceInfo = null;

  //----------------------------------
  //  visible
  //----------------------------------
  /**
   * Indicates whether the widget is visible.
   *
   * @name visible
   * @instance
   * @type {boolean}
   * @ignore
   */
  // @aliasOf("viewModel.visible")
  @property()
  @renderable()
  visible: boolean;

  //----------------------------------
  //  active
  //----------------------------------
  /**
   * Indicates whether the widget is active.
   *
   * @name active
   * @instance
   * @type {boolean}
   * @ignore
   */
  @property()
  @renderable()
  active: boolean;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  render(): VNode {
    const className = this.view.popup.dockEnabled ? CSS.small : "";

    return (
      <div
        id="resourceInfo"
        class={className}
        role="presentation"
        key="esri-resource-info__root">
        {this.renderContainerNode()}
      </div>
    );
  }

  renderContainerNode(): VNode {
    if (!this.visible) {
      return null;
    }

    if (!this.view) {
      return this.renderUnsupportedMessage();
    }

    const resourceInfo = this.view.resourceInfo;

    const layerResourceInfoNodes: VNode[] = [];
    for (const layerResourceInfo of resourceInfo.layerResourceInfo) {
      layerResourceInfoNodes.push(this.renderLayerResourceInfoNode(resourceInfo, layerResourceInfo));
    }

    return (
      <div key="resource-info_root">
        <table>
          <thead>
            <tr>
              <td colspan="3">Performance</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Quality:</td>
              <td colspan="2">{Math.round(100 * resourceInfo.quality)}%</td>
            </tr>
            <tr>
              <td>Load:</td>
              <td colspan="2">{Math.floor(resourceInfo.load)}</td>
            </tr>
          </tbody>
          <thead>
            <tr>
              <td colspan="3">Memory</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total:</td>
              <td colspan="2">{toScientificNotation(resourceInfo.totalMemory)}</td>
            </tr>
            <tr>
              <td>Used:</td>
              <td>{toScientificNotation(resourceInfo.usedMemory)}</td>
              <td>{this.renderMemoryBar("usedMemory", resourceInfo)}</td>
            </tr>
            <tr>
              <td>Terrain:</td>
              <td>{toScientificNotation(resourceInfo.terrainMemory)}</td>
              <td>{this.renderMemoryBar("terrainMemory", resourceInfo)}</td>
            </tr>
            <tr>
              <td>Edges:</td>
              <td>{toScientificNotation(resourceInfo.edgesMemory)}</td>
              <td>{this.renderMemoryBar("edgesMemory", resourceInfo)}</td>
            </tr>
          </tbody>
          <thead>
            <tr>
              <td colspan="3">Layers</td>
            </tr>
          </thead>
          <tbody>
            {layerResourceInfoNodes}
          </tbody>
        </table>
      </div>
    );
  }


  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  private intervalHandle: number = null;

  private renderUnsupportedMessage(): VNode {
    return (
      <div
        key="resource-info__unsupported">
        <p>{MESSAGES.unsupported}</p>
      </div>
    );
  }

  private renderLayerResourceInfoNode(resourceInfo: SceneViewResourceInfo, layerResourceInfo: LayerResourceInfo): VNode {
    const layerTypeMap = {
      "scene": "SceneLayer",
      "feature": "FeatureLayer",
      "tile": "TileLayer",
      "vector-tile": "VectorTileLayer",
      "elevation": "ElevationLayer",
      "base-elevation": "ElevationLayer"
    }

    return (
      <tr key={`resource-info_layer_${layerResourceInfo.layer.id}`}>
        <td>{layerTypeMap[layerResourceInfo.layer.type]}</td>
        <td>{toScientificNotation(layerResourceInfo.memory)}</td>
        <td>
          <div
          class="memoryIndicator"
          key={`resource-info_layer_${layerResourceInfo.layer.id}_memoery`}>
            <div
              class="memoryIndicatorValue"
              style={`width: ${100 * layerResourceInfo.memory / resourceInfo.totalMemory}%`}
            />
          </div>
        </td>
      </tr>
    );
  }

  private renderMemoryBar(key: keyof SceneViewResourceInfo, resourceInfo: SceneViewResourceInfo): VNode {
    if (key === "layerResourceInfo") {
      return;
    }

    return (
      <div
        class="memoryIndicator"
        key={`resource-info_root_${key}`}>
        <div
          class="memoryIndicatorValue"
          style={`width: ${100 * resourceInfo[key] / resourceInfo.totalMemory}%`}
        />
      </div>
    );
  }
}

function toScientificNotation(value: number): string {
  value = Math.floor(value);

  if (value > 1e+9) {
    return `${Math.floor(value / 1e+9)} GB`;
  } else if (value > 1e+6) {
    return `${Math.floor(value / 1e+6)} MB`;
  } else if (value > 1e+3) {
    return `${Math.floor(value / 1e+3)} KB`;
  } else {
    return `${value} B`;
  }
}
