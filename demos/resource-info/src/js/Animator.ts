import SceneView = require("esri/views/SceneView");
import Camera = require("esri/Camera");
import { declared, subclass, property } from "esri/core/accessorSupport/decorators";
import Accessor = require("esri/core/Accessor");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import Point = require("esri/geometry/Point");
import PointSymbol3D = require("esri/symbols/PointSymbol3D");
import { ObjectSymbol3DLayer } from "esri/symbols";
import watchUtils = require("esri/core/watchUtils");


type Config = {
  camera: Camera;
  distance: number;
  altitude: number;
  speed: number;
  start: number;
  states: Map<number, any>;
}

export type Scenario = {
  name: string;
  config: Config;

  tick: (ticks: number, resources: {
    config: Config;
    view: SceneView;
    graphicsLayer: GraphicsLayer;
  }) => void;
};

type CtorProperties = {
  view: SceneView;
  graphicsLayer: GraphicsLayer;
}

@subclass()
export class Animator extends declared(Accessor) {
  constructor(properties: CtorProperties) {
    super(properties);
  }

  protected initialize() {
    watchUtils.watch(this, "scenario", (scenario) => {
      this.view.camera = scenario.config.camera;
    });
  }

  @property()
  view: SceneView = null;

  graphicsLayer: GraphicsLayer = null;

  @property()
  scenario: Scenario = null;

  @property()
  cameraEnabled = false;

  @property()
  audioEnabled = false;


  startCamera(): void {
    this.cameraEnabled = true;
    this.animateCamera();
  }

  stopCamera(): void {
    this.cameraEnabled = false;
  }

  startAudio(): void {
    if (!this.audioElement) {
      this.createDomElements();
    }
    this.audioElement.play();

    this.audioEnabled = true;
    this.animateResources();
  }

  stopAudio(): void {
    this.audioElement.pause();
    this.audioEnabled = false;
  }

  private ticks = 0;

  private animateCamera(): void {
    if (!this.cameraEnabled || !this.scenario) {
      return;
    }
    const { view, graphicsLayer, scenario: { config, tick }} = this;

    if (view.camera) {
      tick(this.ticks++, { config, view, graphicsLayer });
    }

    window.requestAnimationFrame(() => this.animateCamera());
  }



  // --------------------------


  private audioElement: HTMLAudioElement;
  private audioContext: AudioContext;
  private audioAnalyser: AnalyserNode;
  private bufferLength: number;
  private dataArray: Uint8Array;
  private canvasElement: HTMLCanvasElement;
  private canvasContext: CanvasRenderingContext2D;

  private average = 0;
  private rotationStates = new Map<number, number>();
  private rotationHeadings = new Map<number, number>();

  private async animateResources(): Promise<void> {
    let requestFrame = false;

    if (this.audioAnalyser) {
      const { canvasElement } = this;

      this.audioAnalyser.getByteFrequencyData(this.dataArray);

      this.canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

      var barWidth = (canvasElement.width / this.bufferLength) * 2.5;
      var barHeight;
      var x = 0;

      for(var i = 0; i < this.bufferLength; i++) {
        barHeight = this.dataArray[i]/2;

        const color = barHeight+100;
        this.canvasContext.fillStyle = `rgba(${color}, ${color}, ${color}, 0.6)`;
        this.canvasContext.fillRect(x, canvasElement.height - barHeight / 2, barWidth, barHeight);

        x += barWidth + 1;
      }

      const numFeatures = this.graphicsLayer.graphics.length;

      let bufferAverage = 0;
      for(let i = 0; i < this.bufferLength; i++) {
        bufferAverage += this.dataArray[i];
      }
      bufferAverage /= this.bufferLength;

      this.average -= this.average / 10;
      this.average += bufferAverage / 10;


      for (let i = 0; i < numFeatures; i++) {
        const graphic = this.graphicsLayer.graphics.getItemAt(i);
        const geometry = graphic.geometry.clone() as Point;
        const uid = (graphic as any).uid;

        geometry.z = geometry.z || 0;


        if (this.average > 0.1) {
          geometry.z = this.average / 20;

          let angle = this.rotationStates.get(uid) || 0;
          if (bufferAverage > 40 && angle < 1) {
            this.rotationStates.set(uid, angle + Math.floor(bufferAverage / 20) * 360);
          } else {
            this.rotationStates.set(uid, angle * 0.9); 
          }

          requestFrame = true;
        }
       
        graphic.geometry = geometry;
      }
    }

    // ---------------------------------------------------------------

    this.graphicsLayer.graphics.forEach((graphic) => {
      if (!graphic.symbol || graphic.symbol.type !== "point-3d") {
        return;
      }

      const uid = (graphic as any).uid;
      const clone = (graphic.symbol as PointSymbol3D).clone() as PointSymbol3D;
      const symbolLayer = clone.symbolLayers.getItemAt(0) as ObjectSymbol3DLayer;

      if (symbolLayer && symbolLayer.type === "object") {
        if (!this.rotationHeadings.has(uid)) {
          this.rotationHeadings.set(uid, symbolLayer.heading);
        }

        symbolLayer.heading = this.rotationHeadings.get(uid) + this.rotationStates.get(uid);
      }

      graphic.symbol = clone;
    });

    if (this.audioEnabled || requestFrame) {
      window.requestAnimationFrame(() => this.animateResources());
    }
  }

  private createDomElements() {
    const canvasElement = document.createElement("canvas");
    canvasElement.setAttribute("id", "equalizerCanvas");
    this.canvasElement = canvasElement;
    document.body.appendChild(canvasElement);

    this.canvasContext = canvasElement.getContext("2d");
    this.canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

    const audioElement = document.createElement("audio");
    audioElement.setAttribute("src", "assets/super_mario_bros.mp3");
    audioElement.setAttribute("type", "audio/mpg");
    audioElement.loop = true;

    document.querySelector("head").appendChild(audioElement);


    this.audioElement = audioElement;

    // for legacy browsers
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContext();
    const audioSource = this.audioContext.createMediaElementSource(audioElement);
    audioSource.connect(this.audioContext.destination);

    this.audioAnalyser = this.audioContext.createAnalyser();
    audioSource.connect(this.audioAnalyser);

    this.audioAnalyser.fftSize = 2048;
    this.bufferLength = this.audioAnalyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    this.audioAnalyser.getByteFrequencyData(this.dataArray);
  }
}