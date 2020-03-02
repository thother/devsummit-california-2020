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
import SceneView = require("esri/views/SceneView");


import { ResourceInfo, SceneViewWithResourceInfo } from "./ResourceInfo";
import { PerformanceInfo } from "./PerformanceInfo";
import { Generator } from "./Generator";

import { Scenario as AnimationScenario } from "./Animator";
import Camera = require("esri/Camera");


import FeatureLayerView = require("esri/views/layers/FeatureLayerView");
import SceneLayerView = require("esri/views/layers/SceneLayerView");
import { Controller, Control } from "./Controller";

import { 
  normalElevationLayer,
  exaggeratedElevationLayer,

  imageTileLayer,
  vectorTileLayer,

  sceneLayer,
  sceneLayerDefinitionExpression,
  sceneLayerFeatureFilter,
  sketchSceneRenderer,
  normalSeneRenderer,

  featureLayer,
  featureLayerDefinitionExpression,
  featureLayerFeatureFilter,
  featureLayerElevationAbsolute,
  featureLayerElevationRelative,

  graphicsLayer,
  graphicsLayerResources,

  carAnimationLine,
  carAnimationLineSegmentLengths,
  carAnimationLineLength
} from "./config";
import { Animator } from "./Animator";
import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import Accessor = require("esri/core/Accessor");
import watchUtils = require("esri/core/watchUtils");
import Layer = require("esri/layers/Layer");
import Point = require("esri/geometry/Point");
import PointSymbol3D = require("esri/symbols/PointSymbol3D");
import ObjectSymbol3DLayer = require("esri/symbols/ObjectSymbol3DLayer");


type CtorProperties = {
  viewDiv: string;
};

@subclass()
class Demo extends declared(Accessor)  {
  

  constructor(properties: CtorProperties) {
    super();
  }

  protected initialize() {
    watchUtils.on(this, "view.map.layers", "change", async (changeEvent: __esri.CollectionChangeEvent<Layer>) => {
      for (const added of changeEvent.added) {
        if (added === sceneLayer) {
          this.view.whenLayerView(sceneLayer).then((lv) => {
            this.sceneLayerView = lv;
            
            if (this.featureLayerView && this.featureLayerView.filter) {
              this.sceneLayerView.filter = sceneLayerFeatureFilter              
            }
          });
        }
        if (added === featureLayer) {
          this.view.whenLayerView(featureLayer).then((lv) => {
            this.featureLayerView = lv;

            if (this.sceneLayerView && this.sceneLayerView.filter) {
              this.featureLayerView.filter = featureLayerFeatureFilter              
            }
          });
        }
      }
      for (const removed of changeEvent.removed) {
        if (removed === featureLayer) {
          this.featureLayerView = null;
        }
        if (removed === sceneLayer) {
          this.sceneLayerView = null;
        }
      }
    });

    const view = this.view = new SceneView({
      map: {
        basemap: "satellite",
        layers: [ graphicsLayer ],
        ground: {
          layers: [ ]
        }
      },
      container: this.viewDiv
    }) as SceneViewWithResourceInfo;

    this.animator = new Animator({ view, graphicsLayer })

    this.load();
  }

  @property()
  viewDiv: string = null;

  @property()
  private view: SceneViewWithResourceInfo = null;

  @property()
  private sceneLayerView: SceneLayerView = null;

  @property()
  private featureLayerView: FeatureLayerView = null;

  @property()
  private animator: Animator = null;

  
  private async load(): Promise<void> {
    const { view, animator } = this;

    // main layout

    const controlGroups: Control[][] = [
      [{
        icon: "ground",
        caption: "ground",
        select: () => {
          if (this.hasLayers([exaggeratedElevationLayer, normalElevationLayer])) {
            view.map.ground.layers.removeAll();
          } else {
            view.map.ground.layers.add(normalElevationLayer);
          }
        },
        selected: () => this.hasLayers([exaggeratedElevationLayer, normalElevationLayer])
      },{
        icon: "ground",
        caption: "normal",
        select: () => {
          if (this.hasLayers([normalElevationLayer])) {
            view.map.ground.layers.remove(normalElevationLayer);
          } else {
            view.map.ground.layers.removeAll();
            view.map.ground.layers.add(normalElevationLayer); 
          }
        },
        selected: () => this.hasLayers([normalElevationLayer])
      }, {
        icon: "ground",
        caption: "exagger.",
        select: () => {
          if (this.hasLayers([exaggeratedElevationLayer])) {
            view.map.ground.layers.remove(exaggeratedElevationLayer);
          } else {
            view.map.ground.layers.removeAll();
            view.map.ground.layers.add(exaggeratedElevationLayer); 
          }
          exaggeratedElevationLayer.exaggeration = animator.scenario === animationScenarios[0] ? 200 : 5
        },
        selected: () => this.hasLayers([exaggeratedElevationLayer])
      }],

      [{
        icon: "basemap",
        caption: "basemap",
        select: () => {
          if (this.hasLayers([imageTileLayer, vectorTileLayer])) {
            view.map.basemap.baseLayers.removeAll();
          } else {
            view.map.basemap.baseLayers.add(imageTileLayer);
          }
        },
        selected: () => this.hasLayers([imageTileLayer, vectorTileLayer])
      }, {
        icon: "basemap",
        caption: "image",
        select: () => {
          if (this.hasLayers([imageTileLayer])) {
            view.map.basemap.baseLayers.remove(imageTileLayer);
          } else {
            view.map.basemap.baseLayers.removeAll();
            view.map.basemap.baseLayers.add(imageTileLayer);
          }
        },
        selected: () => this.hasLayers([imageTileLayer])
      }, {
        icon: "basemap",
        caption: "vector",
        select: () => {
          if (this.hasLayers([vectorTileLayer])) {
            view.map.basemap.baseLayers.remove(vectorTileLayer);
          } else {
            view.map.basemap.baseLayers.removeAll();
            view.map.basemap.baseLayers.add(vectorTileLayer);
          }
        },
        selected: () => this.hasLayers([vectorTileLayer])
      }],

      [{
        icon: "scene",
        caption: "scene",
        select: () => {
          if (this.hasLayers([sceneLayer])) {
            view.map.layers.remove(sceneLayer);
          } else {
            view.map.layers.add(sceneLayer);
          }
        },
        selected: () => this.hasLayers([sceneLayer])
      }, {
        icon: "scene",
        caption: "normal",
        select: () => {
          if (this.hasLayers([sceneLayer]) && sceneLayer.renderer === normalSeneRenderer) {
            view.map.layers.remove(sceneLayer);
          } else if (!this.hasLayers([sceneLayer])) {
            view.map.layers.add(sceneLayer);
          }
          sceneLayer.renderer = normalSeneRenderer;
        },
        selected: () => this.hasLayers([sceneLayer]) && sceneLayer.renderer === normalSeneRenderer
      }, {
        icon: "scene",
        caption: "sketch",
        select: () => {
          if (this.hasLayers([sceneLayer]) && sceneLayer.renderer === sketchSceneRenderer) {
            view.map.layers.remove(sceneLayer);
          } else if (!this.hasLayers([sceneLayer])) {
            view.map.layers.add(sceneLayer);
          }
          sceneLayer.renderer = sketchSceneRenderer;
        },
        selected: () => this.hasLayers([sceneLayer]) && sceneLayer.renderer === sketchSceneRenderer
      }],

      [{
        icon: "feature",
        caption: "feature",
        select: () => {
          if (this.hasLayers([featureLayer])) {
            view.map.layers.remove(featureLayer);
          } else {
            view.map.layers.add(featureLayer);
          }
        },
        selected: () => this.hasLayers([featureLayer])
      }, {
        icon: "feature",
        caption: "absolute",
        select: () => {
          if (this.hasLayers([featureLayer]) && 
              featureLayer.elevationInfo && 
              featureLayer.elevationInfo.mode === featureLayerElevationAbsolute.mode) {
            view.map.layers.remove(featureLayer);
          } else if (!this.hasLayers([featureLayer])) {
            view.map.layers.add(featureLayer);
          }
          featureLayer.elevationInfo = featureLayerElevationAbsolute;
        },
        selected: () => this.hasLayers([featureLayer]) && 
                          featureLayer.elevationInfo &&
                          featureLayer.elevationInfo.mode === featureLayerElevationAbsolute.mode
      }, {
        icon: "feature",
        caption: "relative",
        select: () => {
          if (this.hasLayers([featureLayer]) &&
              featureLayer.elevationInfo &&
              featureLayer.elevationInfo.mode === featureLayerElevationRelative.mode) {
            view.map.layers.remove(featureLayer);
          } else if (!this.hasLayers([featureLayer])) {
            view.map.layers.add(featureLayer);
          }
          featureLayer.elevationInfo = featureLayerElevationRelative;
        },
        selected: () => this.hasLayers([featureLayer]) && 
                          featureLayer.elevationInfo && 
                          featureLayer.elevationInfo.mode === featureLayerElevationRelative.mode
      }],

      [{
        icon: "filter",
        caption: "filter",
        select: () => {
          const { featureLayerView, sceneLayerView } = this;
          if (featureLayerView && featureLayerView.filter || sceneLayerView && sceneLayerView.filter) {
            if (featureLayerView && featureLayerView.filter) {
              featureLayerView.filter = null;
            }
            if (sceneLayerView && sceneLayerView.filter) {
              sceneLayerView.filter = null;
            }

            featureLayer.definitionExpression = null;
            sceneLayer.definitionExpression = null;
          } else {
            if (featureLayer.definitionExpression || sceneLayer.definitionExpression) {
              featureLayer.definitionExpression = null;
              sceneLayer.definitionExpression = null;
            } else {
              featureLayer.definitionExpression = featureLayerDefinitionExpression;
              sceneLayer.definitionExpression = sceneLayerDefinitionExpression;
            }
          } 
        },     
        selected: () => !!(((featureLayer && featureLayer.definitionExpression) || (this.featureLayerView && this.featureLayerView.filter)) ||
                            (sceneLayer && sceneLayer.definitionExpression) || (this.sceneLayerView && this.sceneLayerView.filter))

      }, {
        icon: "filter",
        caption: "server",
        select: () => {
          if (featureLayer.definitionExpression || sceneLayer.definitionExpression) {
            sceneLayer.definitionExpression = null;
            featureLayer.definitionExpression = null;
          } else {
            sceneLayer.definitionExpression = sceneLayerDefinitionExpression;
            featureLayer.definitionExpression = featureLayerDefinitionExpression;
          }
        },
        selected: () => !!(featureLayer.definitionExpression || sceneLayer.definitionExpression)
      }, {
        icon: "filter",
        caption: "client",
        select: () => {
          const { featureLayerView, sceneLayerView } = this;
          if (featureLayerView && featureLayerView.filter) {
            featureLayerView.filter = null;
          } else if (featureLayerView){
            featureLayerView.filter = featureLayerFeatureFilter;
          }

          if (sceneLayerView && sceneLayerView.filter) {
            sceneLayerView.filter = null;
          } else if (sceneLayerView) {
            sceneLayerView.filter = sceneLayerFeatureFilter;
          }
        },
        selected: () => !!((this.featureLayerView && this.featureLayerView.filter) || (this.sceneLayerView && this.sceneLayerView.filter))
      }],

      [{
        icon: "camera",
        caption: "camera",
        select: () => {
          if (animator.cameraEnabled) {
            animator.stopCamera()
          } else {
            animator.startCamera();
          }
        },
        selected: () => animator.cameraEnabled
      }, {
        icon: "camera",
        caption: "globe",
        select: () => {
          if (animator.cameraEnabled && animator.scenario === animationScenarios[0]) {
            animator.stopCamera();
          } else {
            animator.startCamera();
          }
          animator.scenario = animationScenarios[0];
        },
        selected: () => (animator.cameraEnabled && animator.scenario === animationScenarios[0])
      }, {
        icon: "camera",
        caption: "city",
        select: () => {
          if (animator.cameraEnabled && animator.scenario === animationScenarios[1]) {
            animator.stopCamera();
          } else {
            animator.startCamera();
          }
          animator.scenario = animationScenarios[1];
        },
        selected: () => (animator.cameraEnabled && animator.scenario === animationScenarios[1])
      }],

      [{
        icon: "music",
        caption: "music",
        select: () => {
          if (animator.audioEnabled) {
            animator.stopAudio();
          } else {
            animator.startAudio();
          }
        },
        selected: () => animator.audioEnabled
      }]
    ];


    // -------------------------------------------------


    const animationScenarios: AnimationScenario[] = [{
      name: "globe",
      config: {
        camera: new Camera({
          position: new Point({
            spatialReference: {
              wkid: 102100
            },
            x: 0,
            y: 4969665,
            z: 5
          }),
          heading: 0,
          tilt: 0
        }),
        distance: 20000000,
        altitude: 50000000,
        speed: 2000,
        start: Date.now(),
        states: null
      },
      tick: (ticks, resources) => {
        const {config, view} = resources;
        const camera = view.camera.clone();

        camera.position.x = config.camera.position.x + config.distance * ticks / config.speed;
        camera.position.y = config.camera.position.y + config.distance / 20 * Math.sin(ticks / config.speed);
        camera.position.z = config.altitude * (1 + Math.cos(ticks / config.speed) / 2);
        camera.heading = 0;
        camera.tilt = config.camera.tilt;

        view.environment.atmosphere.quality = "high";

        view.environment.lighting = {
          date: new Date(config.start - ticks / config.speed),
          
          directShadowsEnabled: false,
          ambientOcclusionEnabled: false
        };

        view.camera = camera;
      }
    }, {
      name: "city",
      config: {
        camera: new Camera({
          position: new Point({
            spatialReference: {
              wkid: 102100
            },
            x: -8238736.034643562,
            y: 4969665.590906493,
            z: 5.9063404854387045
          }),
          heading: 0,
          tilt: 70 
        }),
        distance: 5000,
        altitude: 1000,
        speed: 500,
        start: Date.now(),
        states: null
      },
      tick: (ticks, resources) => {
        const {config, view} = resources;
        const camera = view.camera.clone();

        camera.position.x = config.camera.position.x + config.distance * Math.cos(ticks / config.speed);
        camera.position.y = config.camera.position.y + config.distance * Math.sin(ticks / config.speed);
        camera.position.z = config.altitude + 300 * Math.cos(ticks / config.speed / 1.23456789);
        camera.heading = 360 - (ticks / config.speed / Math.PI * 180) - 90;
        camera.tilt = 90 - Math.atan(config.altitude / config.distance) / Math.PI * 180;

        view.environment.lighting = {
          date: new Date(config.start - ticks * config.speed * 100),
          directShadowsEnabled: false,
          ambientOcclusionEnabled: false
        };

        view.camera = camera;
      }
    }, {
      name: "car",
      config: {
        camera: new Camera({
          position: new Point({
            spatialReference: {
              wkid: 102100
            },
            x: -8238959.639566096,
            y: 4969571.6945557315,
            z: 3187.7089045317844
          }),
          heading: 30,
          tilt: 0.5 
        }),
        distance: 1500,
        altitude: 750,
        speed: 200,
        start: Date.now(),
        states: new Map()
      },
      tick: (ticks, resources) => {
        const {config, view} = resources;

        const camera = view.camera.clone();

        const distance = ((Date.now() - config.start) / 1000 * config.speed) % carAnimationLineLength;

        const {x, y, dx, dy} = this.findLineSegmentPosition(carAnimationLineSegmentLengths, distance);

        config.camera.position.x += 0.001 * (x + dx - config.camera.position.x);
        config.camera.position.y += 0.001 * (y + dy - config.camera.position.y);

        camera.position.x = config.camera.position.x + config.distance * Math.cos(ticks / config.speed);
        camera.position.y = config.camera.position.y + config.distance * Math.sin(ticks / config.speed);
        camera.position.z = config.altitude + config.altitude / 3 * Math.cos(ticks / config.speed / 1.23456789);
        camera.heading = 360 - (ticks / config.speed / Math.PI * 180) - 90;
        camera.tilt = (90 - Math.atan(config.altitude / config.distance) / Math.PI * 180);

        view.environment.lighting = {
          date: new Date(config.start - ticks * config.speed * 250),
          directShadowsEnabled: false,
          ambientOcclusionEnabled: false
        };

        view.camera = camera;

        // --

        const graphicsLength = graphicsLayer.graphics.length;

        for (let i = 0; i < graphicsLength; i++)  {
          const graphic = graphicsLayer.graphics.getItemAt(i);
          const uid = (graphic as any).uid;

          const speed = 10;
          const distance = (i / graphicsLength * carAnimationLineLength + (Date.now() - config.start) / 1000 * speed) % carAnimationLineLength;

          const {x, y, dx, dy, idx} = this.findLineSegmentPosition(carAnimationLineSegmentLengths, distance);
        
          const clone = graphic.geometry.clone() as Point;
          clone.x = x + dx;
          clone.y = y + dy;
          clone.z = 0;

          graphic.geometry = clone;

          const hasLastSegment = config.states.has(uid);
          if (graphic.symbol && (!hasLastSegment || config.states.get(uid) != idx)) {
            const symbol = (graphic.symbol as PointSymbol3D).clone() as PointSymbol3D;
            const symbolLayer = symbol.symbolLayers.getItemAt(0) as ObjectSymbol3DLayer;
            symbolLayer.heading = 360 - Math.atan2(dy, dx) / Math.PI * 180 + 90;

            graphic.symbol = symbol;
            config.states.set(uid, idx);
          }
        }
      }
    }, {
      name: "boat",
      config: {
        camera: new Camera({
          position: new Point({
            spatialReference: {
              wkid: 102100
            },
            x: -8240510.163080326,
            y: 4967989.839668392,
            z: 0
          }),
          heading: 0,
          tilt: 70
        }),
        distance: 2000,
        altitude: 200,
        speed: 500,
        start: Date.now(),
        states: new Map()
      },
      tick: (ticks, resources) => {
        const {config, view} = resources;

        const camera = view.camera.clone();

        camera.position.x = config.camera.position.x + config.distance * Math.cos(ticks / config.speed);
        camera.position.y = config.camera.position.y + config.distance * Math.sin(ticks / config.speed);
        camera.position.z = config.altitude + 100 * Math.cos(ticks / config.speed / 1.23456789);
        camera.heading = 360 - (ticks / config.speed / Math.PI * 180) - 90;
        camera.tilt = 90 - Math.atan(config.altitude / config.distance) / Math.PI * 180;

        view.environment.lighting = {
          date: new Date(config.start - ticks * config.speed * 100),
          directShadowsEnabled: false,
          ambientOcclusionEnabled: false
        };

        view.camera = camera;

        // --

        type State = {
          startOffset: number;
          speed: number;
          symbol: PointSymbol3D;
          x1: number;
          y1: number;
          x2: number;
          y2: number;
          lineLength: number;
        };

        const graphicsLength = graphicsLayer.graphics.length;

        for (let i = 0; i < graphicsLength; i++)  {
          const graphic = graphicsLayer.graphics.getItemAt(i);
          const uid = (graphic as any).uid;

          const areaRadius = 1000;
          const windAngle = 260;

          if (!config.states.has(uid)) {
            const windwardOffset = Math.random() - 0.5;
            const courseOffset = 120 * Math.random() - 60;
            const startOffset = areaRadius * Math.random();
            const speed = 25 + 25 * Math.random();

            const x1 = config.camera.position.x + areaRadius * (Math.cos((windAngle + 90 + courseOffset) / 180 * Math.PI) + Math.cos(windAngle / 180 * Math.PI) * windwardOffset);
            const y1 = config.camera.position.y + areaRadius * (Math.sin((windAngle + 90 + courseOffset) / 180 * Math.PI) + Math.sin(windAngle / 180 * Math.PI) * windwardOffset);
            const x2 = config.camera.position.x + areaRadius * (Math.cos((windAngle - 90 + courseOffset) / 180 * Math.PI) + Math.cos(windAngle / 180 * Math.PI) * windwardOffset);
            const y2 = config.camera.position.y + areaRadius * (Math.sin((windAngle - 90 + courseOffset) / 180 * Math.PI) + Math.sin(windAngle / 180 * Math.PI) * windwardOffset);

            const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

            config.states.set(uid, {
              speed,
              startOffset,
              lineLength,

              x1,
              y1,
              x2,
              y2,

              symbol: null,
            } as State);
          }
          const state = config.states.get(uid) as State;
          const { speed, startOffset, lineLength, x1, y1, x2, y2 } = state;

          const traveledDistance = (Date.now() - config.start) / 1000 * speed + startOffset;
          const fraction = (traveledDistance % lineLength) / lineLength;

          const clone = graphic.geometry.clone() as Point;
          clone.x = x1 + fraction * (x2 - x1);
          clone.y = y1 + fraction * (y2 - y1);
          clone.z = 0;

          graphic.geometry = clone;

          const needsSymbolUpdate = !state.symbol || state.symbol !== graphic.symbol;
          if (needsSymbolUpdate && graphic.symbol) {
            const symbol = (graphic.symbol as PointSymbol3D).clone() as PointSymbol3D;
            const symbolLayer = symbol.symbolLayers.getItemAt(0) as ObjectSymbol3DLayer;
            symbolLayer.heading = 360 - Math.atan2(state.y2 - state.y1, state.x2 - state.x1) / Math.PI * 180 + 90;
            symbolLayer.roll = symbolLayer.heading  > windAngle ?  30 : -30;
            graphic.symbol = symbol;
            state.symbol = symbol;
          }
        }
      }
    }, {
      name: "tree",
      config: {
        camera: new Camera({
          position: new Point({
            spatialReference: {
              wkid: 102100
            },
            x: -8242666.879809741,
            y: 4966710.08634817,
            z: 0
          }),
          heading: 0,
          tilt: 70
        }),
        distance: 300,
        altitude: 100,
        speed: 200,
        start: Date.now(),
        states: new Map()
      },
      tick: (ticks, resources) => {
        const {config, view} = resources;

        const camera = view.camera.clone();

        camera.position.x = config.camera.position.x + (config.distance + 200 * Math.cos(ticks / config.speed / 1.23456789)) * Math.cos(ticks / config.speed);
        camera.position.y = config.camera.position.y + (config.distance + 200 * Math.cos(ticks / config.speed / 1.23456789)) * Math.sin(ticks / config.speed);
        camera.position.z = config.altitude + 50 * Math.cos(ticks / config.speed / 1.23456789);
        camera.heading = 360 - (ticks / config.speed / Math.PI * 180) - 90;
        camera.tilt = 90 - Math.atan(config.altitude / config.distance) / Math.PI * 180;

        view.environment.lighting = {
          date: new Date(config.start - ticks * config.speed * 100),
          directShadowsEnabled: false,
          ambientOcclusionEnabled: false
        };

        view.camera = camera;

        // --

        const graphicsLength = graphicsLayer.graphics.length;

        for (let i = 0; i < graphicsLength; i++)  {
          const graphic = graphicsLayer.graphics.getItemAt(i);
          const uid = (graphic as any).uid;

          const distance = 100;

          if (!config.states.has(uid)) {
            config.states.set(uid, true);

            const clone = graphic.geometry.clone() as Point;
            clone.x = config.camera.position.x + distance * (Math.random() - 0.5);
            clone.y = config.camera.position.y + distance * (Math.random() - 0.5);
            clone.z = 0;
  
            graphic.geometry = clone;
          }
        }
      }
    }, {
      name: "airplane",
      config: {
        camera: new Camera({
          position: new Point({
            spatialReference: {
              wkid: 102100
            },
            x: -8237376.640397705,
            y: 4971360.6452791905,
            z: 0
          }),
          heading: 0,
          tilt: 70
        }),
        distance: 2500,
        altitude: 1400,
        speed: 500,
        start: Date.now(),
        states: new Map()
      },
      tick: (ticks, resources) => {
        const {config, view} = resources;

        type State = {
          verticalOffset: number;
          horizontalOffset: number;
          courseOffset: number;
          startOffset: number;
          speed: number;
          symbol: PointSymbol3D;

          x1: number;
          y1: number;
          x2: number;
          y2: number;
          lineLength: number;
        };


        const graphicsLength = graphicsLayer.graphics.length;

        for (let i = 0; i < graphicsLength; i++)  {
          const graphic = graphicsLayer.graphics.getItemAt(i);
          const uid = (graphic as any).uid;

          const areaRadius = 10000;
          const windAngle = 260;

          if (!config.states.has(uid)) {
            const verticalOffset = 1000 * Math.random();
            const horizontalOffset = Math.random() - 0.5;
            const courseOffset = 120 * Math.random() - 60;
            const startOffset = areaRadius * Math.random();
            const speed = 500 + 250 * Math.random();

            const x1 = config.camera.position.x + areaRadius * (Math.cos((windAngle + 90 + courseOffset) / 180 * Math.PI) + Math.cos(windAngle / 180 * Math.PI) * horizontalOffset)
            const y1 = config.camera.position.y + areaRadius * (Math.sin((windAngle + 90 + courseOffset) / 180 * Math.PI) + Math.sin(windAngle / 180 * Math.PI) * horizontalOffset);
            const x2 = config.camera.position.x + areaRadius * (Math.cos((windAngle - 90 + courseOffset) / 180 * Math.PI) + Math.cos(windAngle / 180 * Math.PI) * horizontalOffset);
            const y2 = config.camera.position.y + areaRadius * (Math.sin((windAngle - 90 + courseOffset) / 180 * Math.PI) + Math.sin(windAngle / 180 * Math.PI) * horizontalOffset);
  
            const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

            config.states.set(uid, {
              verticalOffset,
              horizontalOffset,
              courseOffset,
              startOffset,
              speed,

              x1,
              y1,
              x2,
              y2,
              lineLength,

              symbol: null
            } as State);
          }
          const state: State = config.states.get(uid);
          const {x1, y1, x2, y2, speed, startOffset, horizontalOffset} = state;

          const distance = (Date.now() - config.start) / 1000 * speed + startOffset;


          const fraction = (distance % length) / length;

          const clone = graphic.geometry.clone() as Point;
          clone.x = x1 + fraction * (x2 - x1);
          clone.y = y1 + fraction * (y2 - y1);
          clone.z = config.altitude + horizontalOffset;

          graphic.geometry = clone;

          if (graphic.symbol && (!state.symbol || state.symbol !== graphic.symbol)) {
            const symbol = (graphic.symbol as PointSymbol3D).clone() as PointSymbol3D;
            const symbolLayer = symbol.symbolLayers.getItemAt(0) as ObjectSymbol3DLayer;
            symbolLayer.heading = 360 - Math.atan2(y2 - y1, x2 - x1) / Math.PI * 180 + 90;
            graphic.symbol = symbol;
            state.symbol = symbol;
          }
        }

        // --

        const camera = view.camera.clone();

        const graphic = graphicsLayer.graphics.getItemAt(0);
        const geometry = graphic.geometry as Point;

        camera.position.x = geometry.x + config.distance * Math.cos(ticks / config.speed);
        camera.position.y = geometry.y + config.distance * Math.sin(ticks / config.speed);
        camera.position.z = geometry.z + 1000 + 50 * Math.cos(ticks / config.speed / 1.23456789);
        camera.heading = 360 - (ticks / config.speed / Math.PI * 180) - 90;
        camera.tilt = 90 - Math.atan(config.altitude / config.distance) / Math.PI * 180;

        view.environment.lighting = {
          date: new Date(config.start - ticks * config.speed * 100),
          directShadowsEnabled: false,
          ambientOcclusionEnabled: false
        };

        view.camera = camera;
      }
    }];




    // start

    view.ui.components = [];

    const controller = new Controller({ controlGroups });
    view.ui.add(controller, "manual");

    const generator = new Generator({ graphicsLayer, resources: graphicsLayerResources, cb: (name) => {
      this.loadDefaultLayers(name);

      if (name === "tree") {
        this.featureLayerView && (this.featureLayerView.filter = null);
        this.sceneLayerView && (this.sceneLayerView.filter = null);
      }

      if (name === "airplane") {
        graphicsLayer.elevationInfo = {
          mode: "absolute-height"
        };
      } else {
        graphicsLayer.elevationInfo = {
          mode: "relative-to-scene"
        };
      }


      let scenario = animationScenarios.find((scenario) => scenario.name === name);
      if (!scenario) {
        scenario = animationScenarios[1];
      }

      animator.scenario = scenario;

      if (!animator.cameraEnabled) {
        animator.startCamera();
      }
    }});
    view.ui.add(generator, "manual");

    const resourceInfo = new ResourceInfo({ view });
    view.ui.add(resourceInfo, "manual");

    const performanceInfoInfo = new PerformanceInfo();
    view.ui.add(performanceInfoInfo, "manual");


    await view.when();

    (window as any).view = view;

    this.animator.scenario = animationScenarios[0];
    animator.startCamera();

    view.on("click", (event) => {
      console.log("mapPoint", JSON.stringify(event.mapPoint, null, 2));
    });
  }

  private loadDefaultLayers(name: string) {
    const { view } = this;
    if (!this.hasLayers([normalElevationLayer, exaggeratedElevationLayer])) {
      view.map.ground.layers.add(normalElevationLayer);
    }
    if (!this.hasLayers([imageTileLayer, vectorTileLayer])) {
      view.map.basemap.baseLayers.add(imageTileLayer);
    }
    if (!this.hasLayers([featureLayer])) {
      view.map.layers.add(featureLayer);
      watchUtils.once(this, "featureLayerView", (lv) => {
        lv.filter = featureLayerFeatureFilter;
      });
    }
    if (!this.hasLayers([sceneLayer])) {
      view.map.layers.add(sceneLayer);
      watchUtils.once(this, "sceneLayerView", (lv) => {
        lv.filter = sceneLayerFeatureFilter;
      });
    }
  }

  private getLayerCollection(layer: __esri.Layer) {
    if (!this.view || !this.view.ready) {
      return null;
    }

    switch(layer.type) {
      case "feature":
      case "scene":
        return this.view.map.layers;
      case "tile":
      case "vector-tile":
        return this.view.map.basemap.baseLayers;
      case "elevation":
      case "base-elevation":
        return this.view.map.ground.layers;
    }
  }
  
  private hasLayers(layers: __esri.Layer[]): boolean {
    for (const layer of layers) {
      const layerCollection = this.getLayerCollection(layer);
      if (layerCollection && layerCollection.indexOf(layer) > -1) {
        return true;
      }
    }
    
    return false;
  }

  private findLineSegmentPosition(lengths: number[], distance: number) {
    let length = 0;
    for (let j = 0; j < carAnimationLine.length; j++) {
      if (length + lengths[j] > distance) {
        const fraction = (distance - length) / carAnimationLineSegmentLengths[j];

        return {
            x: carAnimationLine[j-1][0],
            y: carAnimationLine[j-1][1],
            dx: fraction * (carAnimationLine[j][0] - carAnimationLine[j-1][0]),
            dy: fraction * (carAnimationLine[j][1] - carAnimationLine[j-1][1]),
            idx: j
        }
      }

      length += carAnimationLineSegmentLengths[j];
    }
  }
}


export = Demo;
