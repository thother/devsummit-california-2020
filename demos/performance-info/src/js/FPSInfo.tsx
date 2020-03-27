import { subclass, declared } from "esri/core/accessorSupport/decorators";
import Widget = require("esri/widgets/Widget");
import watchUtils = require("esri/core/watchUtils");
import { tsx } from "esri/widgets/support/widget";


type VNode = {
  /* avoid exposing vdom implementation details */
};

const CSS = {
  red: "red",
  yellow: "yellow",
  green: "green",

  tooltip_left: "tooltip tooltip-left tooltip-multiline modifier-class",
};

const MESSAGES = {
  tooltip_fps: "Shows the current number of frames per second."
}

@subclass("esri.widgets.FPSInfo")
export class FPSInfo extends declared(Widget) {
  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  constructor(private intervalHandle: number = null) {
    super();
  }

  protected initialize(): void {
    watchUtils.init(this, "view", () => {
      if (this.intervalHandle) {
        window.clearInterval(this.intervalHandle);
      }

      window.setInterval(() => this.renderNow(), 1000);
    });

    this.measureFramesPerSecond();
  }

  destroy(): void {
    this.intervalHandle && window.clearInterval(this.intervalHandle);
  }

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  render(): VNode {
    const fps = this.getFramesPerSecond()

    return (
      <div 
        id="fpsInfo"
        class={fps > 50 ? CSS.green : fps > 30 ? CSS.yellow : CSS.red}>
        <span class={CSS.tooltip_left} aria-label={MESSAGES.tooltip_fps}>{Math.floor(fps)}</span>
      </div>
    );
  }

  private fpsTimestamp = 0;
  private fpsMeasurements: number[] = new Array(90);
  private fpsMeasurementsIndex = 0;

  private measureFramesPerSecond(): void {
    const now = performance.now()
    const milisecondsBetweenAnimationFrames = now - this.fpsTimestamp;
    this.fpsTimestamp = now;

    this.fpsMeasurements[this.fpsMeasurementsIndex] = Math.round(1000 / milisecondsBetweenAnimationFrames);
    this.fpsMeasurementsIndex = (this.fpsMeasurementsIndex + 1) % this.fpsMeasurements.length;

    window.requestAnimationFrame(() => this.measureFramesPerSecond());
  }

  private getFramesPerSecond(): number {
    return this.fpsMeasurements.reduce((sum, cur) => (sum + cur), 0) / this.fpsMeasurements.length;
  }
}