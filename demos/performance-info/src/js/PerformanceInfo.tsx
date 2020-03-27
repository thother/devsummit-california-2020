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

type SceneViewPerformanceInfo = {
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
   * @name layerPerformanceInfo
   * @instance
   * @type {Array<LayerPerformanceInfo>}
   */
  layerPerformanceInfos: LayerPerformanceInfo[];
}

type LayerPerformanceInfo = {
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

export type SceneViewWithPerformanceInfo = SceneView & { performanceInfo: SceneViewPerformanceInfo };

type CtorProperties = {
  view: SceneViewWithPerformanceInfo;
}

@subclass("esri.widgets.PerformanceInfo")
export class PerformanceInfo extends declared(Widget) {
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
  view: SceneViewWithPerformanceInfo = null;

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
        id="performanceInfo"
        class={className}
        role="presentation"
        key="esri-performance-info__root">
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

    const performanceInfo = this.view.performanceInfo;

    const layerPerformanceInfoNodes: VNode[] = [];
    for (const layerPerformanceInfo of performanceInfo.layerPerformanceInfos) {
      layerPerformanceInfoNodes.push(this.renderLayerPerformanceInfoNode(performanceInfo, layerPerformanceInfo));
    }

    return (
      <div key="performance-info_root">
        <table>
          <thead>
            <tr>
              <td colspan="3">Performance</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Quality:</td>
              <td colspan="2">{Math.round(100 * performanceInfo.quality)}%</td>
            </tr>
            <tr>
              <td>Load:</td>
              <td colspan="2">{Math.floor(performanceInfo.load)}</td>
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
              <td colspan="2">{toScientificNotation(performanceInfo.totalMemory)}</td>
            </tr>
            <tr>
              <td>Used:</td>
              <td>{toScientificNotation(performanceInfo.usedMemory)}</td>
              <td>{this.renderMemoryBar("usedMemory", performanceInfo)}</td>
            </tr>
            <tr>
              <td>Terrain:</td>
              <td>{toScientificNotation(performanceInfo.terrainMemory)}</td>
              <td>{this.renderMemoryBar("terrainMemory", performanceInfo)}</td>
            </tr>
            <tr>
              <td>Edges:</td>
              <td>{toScientificNotation(performanceInfo.edgesMemory)}</td>
              <td>{this.renderMemoryBar("edgesMemory", performanceInfo)}</td>
            </tr>
          </tbody>
          <thead>
            <tr>
              <td colspan="3">Layers</td>
            </tr>
          </thead>
          <tbody>
            {layerPerformanceInfoNodes}
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
        key="performance-info__unsupported">
        <p>{MESSAGES.unsupported}</p>
      </div>
    );
  }

  private renderLayerPerformanceInfoNode(performanceInfo: SceneViewPerformanceInfo, layerPerformanceInfo: LayerPerformanceInfo): VNode {
    const layerTypeMap = {
      "scene": "SceneLayer",
      "feature": "FeatureLayer",
      "tile": "TileLayer",
      "vector-tile": "VectorTileLayer",
      "elevation": "ElevationLayer",
      "base-elevation": "ElevationLayer"
    }

    return (
      <tr key={`performance-info_layer_${layerPerformanceInfo.layer.id}`}>
        <td>{layerTypeMap[layerPerformanceInfo.layer.type]}</td>
        <td>{toScientificNotation(layerPerformanceInfo.memory)}</td>
        <td>
          <div
          class="memoryIndicator"
          key={`performance-info_layer_${layerPerformanceInfo.layer.id}_memory`}>
            <div
              class="memoryIndicatorValue"
              style={`width: ${100 * layerPerformanceInfo.memory / performanceInfo.totalMemory}%`}
            />
          </div>
        </td>
      </tr>
    );
  }

  private renderMemoryBar(key: keyof SceneViewPerformanceInfo, performanceInfo: SceneViewPerformanceInfo): VNode {
    if (key === "layerPerformanceInfos") {
      return;
    }

    return (
      <div
        class="memoryIndicator"
        key={`performance-info_root_${key}`}>
        <div
          class="memoryIndicatorValue"
          style={`width: ${100 * performanceInfo[key] / performanceInfo.totalMemory}%`}
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
