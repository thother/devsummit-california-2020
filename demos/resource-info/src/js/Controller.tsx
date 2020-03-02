import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import Widget = require("esri/widgets/Widget");
import { tsx, renderable } from "esri/widgets/support/widget";

type VNode = {
  /* avoid exposing vdom implementation details */
};

// const CSS = {
//   red: "selected",
//   yellow: "yellow",
//   green: "green",

//   tooltip_left: "tooltip tooltip-left tooltip-multiline modifier-class",
// };

// const MESSAGES = {
//   tooltip_fps: "Shows the current number of frames per second."
// }


export type Control = {
  icon: string;
  caption: string;
  select: () => void;
  selected: () => boolean;
}

type CtorProperties = {
  controlGroups: Control[][];
}

@subclass("esri.widgets.Controller")
export class Controller extends declared(Widget) {
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
  @renderable()
  controlGroups: Control[][] = null;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  renderControlNode(control: Control): VNode {
    let enabled = control.selected() 
    let onclick = () => control.select()

    return (
      <div class={'button'} onclick={onclick}>
        <span class={`icon icon-${control.icon} ${enabled? "enabled" : "disabled"}`}/>
        <span class={`description`}>{control.caption}</span>
      </div>
    );
  }

  renderControlGroup(controlGroup: Control[]): VNode {
    const controlNodes: VNode[] = [];
    for (const control of controlGroup) {
      controlNodes.push(this.renderControlNode(control));
    }

    return (
      <div>
        {controlNodes}
      </div>
    );
  }

  render(): VNode {
    const controlGroupNodes: VNode[] = [];
    for (const controlGroup of this.controlGroups) {
      controlGroupNodes.push(this.renderControlGroup(controlGroup));
    }

    return (
      <div id="resourceController">
        {controlGroupNodes}
      </div>
    );
  }
}



