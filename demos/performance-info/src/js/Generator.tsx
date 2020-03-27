import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import Widget = require("esri/widgets/Widget");
import { tsx } from "esri/widgets/support/widget";

import Graphic = require("esri/Graphic");

import GraphicsLayer = require("esri/layers/GraphicsLayer");
import { PointSymbol3D, WebStyleSymbol, ObjectSymbol3DLayer } from "esri/symbols";
import Point = require("esri/geometry/Point");

type VNode = {
  /* avoid exposing vdom implementation details */
};

// const CSS = {
//   red: "red",
//   yellow: "yellow",
//   green: "green",

//   tooltip_left: "tooltip tooltip-left tooltip-multiline modifier-class",
// };

// const MESSAGES = {
//   tooltip_fps: "Shows the current number of frames per second."
// }

export type Resource = {
  name: string;
  icon: {
    src: string;
    height?: number;
  };
  symbol: PointSymbol3D | WebStyleSymbol;
  scale: number;
};

type CtorProperties = {
  graphicsLayer: GraphicsLayer;
  resources: Resource[];
  cb: (name: string) => void;
}

@subclass("esri.widgets.Generator")
export class Generator extends declared(Widget) {
  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  constructor(properties: CtorProperties) {
    super();
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  @property()
  graphicsLayer: GraphicsLayer = null;


  @property()
  resources: Resource[] = null;

  @property()
  cb: (name: string) => void = null;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  render(): VNode {
    if (!this.resources || !this.resources.length) {
      console.error("No resources defined");
      return;
    }
    
    const itemIndices = this.resources.map((_, index) => index);

    // wrap around
    itemIndices.push(itemIndices[0], itemIndices[1]);

    const onclick = () => {
      this.startAnimation();
    }

    return (
      <div id="resourceGenerator" onclick={onclick}>
        <table>
          {itemIndices.map((index) => this.renderResource(this.resources[index]))}
        </table>
      </div>
    );
  }

  renderResource(resource: Resource): VNode {
    const onload = (event: Event) => {
      if (!resource.icon.height) {
        resource.icon.height = (event.target as HTMLImageElement).height;
      }
    }

    return (
      <tr>
        <td>
          <img src={resource.icon.src} onload={onload}></img>
        </td>
      </tr>
    );
  }

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------


  private targetY = 0;
  private currentY = 0;

  private combinedElementsHeight = 0
  private firstElementHeight = 0;

  private startAnimation() {
    const { resources  } = this;

    if (!this.combinedElementsHeight) {
      for (const resource of resources) {
        this.combinedElementsHeight += resource.icon.height;
      }
    }

    if (!this.firstElementHeight) {
      this.firstElementHeight = resources[0].icon.height;
    }

    const elementsCount = resources.length;

    const currentResourceIndex = this.resources.indexOf(this.getCurrentResource());
    const nextResourceIndex = currentResourceIndex + 1 + 2 * (elementsCount); // do 2 extra loops

    for (let index = currentResourceIndex; index < nextResourceIndex ; index++) {
      const resourceIndex = index % elementsCount;
      this.targetY += resources[resourceIndex].icon.height;
    }

    this.animateGenerator();
  }

  private getCurrentResource(): Resource {
    const indices = this.resources.map((_, index) => index);

    // wrap one element around
    indices.push(indices[0]);

    let iconHeights = 0;
    for (const index  of indices) {
      iconHeights += this.resources[index].icon.height;

      if (iconHeights > this.currentY) {
        return this.resources[index];
      }
    }
  }

  private async animateGenerator() {
    const delta = Math.pow(this.targetY, 0.5);
    this.currentY += delta;
    this.targetY -= delta;

    if (this.currentY >= this.combinedElementsHeight + this.firstElementHeight) {
      this.currentY -= this.combinedElementsHeight;
    }

    const table = document.getElementById("resourceGenerator").childNodes[0] as HTMLTableElement;
    table.style.transform = `translateY(-${this.currentY}px)`;

    if (this.targetY > 0) {
      window.requestAnimationFrame(() => this.animateGenerator());
    } else {
      this.updateFeatureLayer();
      this.cb(this.getCurrentResource().name);
    }
  }
  
  private updateFeatureLayer() {
    const resource = this.getCurrentResource();

    if (!this.graphicsLayer.graphics.length) {
      this.createGraphics()
    }

    this.graphicsLayer.graphics.forEach(async (graphic) => {
      if (resource.symbol.type === "web-style") {
        const symbol: PointSymbol3D = await resource.symbol.fetchSymbol();
        if (resource.scale) {
          const symbolLayer = symbol.symbolLayers.getItemAt(0) as ObjectSymbol3DLayer;
          symbolLayer.width *= resource.scale;
          symbolLayer.height *= resource.scale;
          symbolLayer.depth *= resource.scale;
        }
        graphic.symbol = symbol;
      } else {
        graphic.symbol = resource.symbol;
      }
    });
  } 

  private createGraphics(): void {
    for (let i = 0; i < 20; i++) {
      this.graphicsLayer.graphics.add(new Graphic({
        geometry: new Point({
          "spatialReference": {
            "wkid": 102100
          },
          "x": -8238112.846146458,
          "y": 4970465.220192298
        })
      }));
    }
  }

}
