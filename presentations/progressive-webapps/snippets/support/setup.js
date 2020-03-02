
function requireOnLoaded() {
  const args = arguments;
  window.addEventListener("api-loaded", () => require.apply(null, args), false);
}

function logMessage(msg) {
  const message = Array.isArray(msg) ? msg.join(" ") : msg;

  const logDiv = document.getElementById("logDiv");
  logDiv.style.visibility = "visible";
  logDiv.textContent = message;
};

function smallView(view, type) {
  require([
    "esri/views/MapView",
    "esri/views/SceneView",
    "dojo/domReady!"
  ], (MapView, SceneView) => {

    const smallViewDiv = document.getElementById("smallViewDiv");
    smallViewDiv.style.visibility = "visible";

    const viewProps = {
      map: {
        basemap: "streets"
      },
      container: "smallViewDiv",
      ui: {
        components: []
      }
    };

    let smallView;
    if (type === "3d") {
      smallView = new SceneView(viewProps);
    } else {
      smallView = new MapView(viewProps);
    }

    smallView.when(() => {
      smallView.constraints.snapToZoom = false;
    });

    view.watch("extent", (extent) => {
      smallView.extent = extent;
    });
  });
}

window.addEventListener("load", () => {
  const apiCSS = document.createElement("link");
  apiCSS.setAttribute("rel", "stylesheet");
  apiCSS.setAttribute("href", "//jsdev.arcgis.com/4.15/esri/css/main.css");

  const apiScript = document.createElement("script");
  apiScript.setAttribute("src", "//jsdev.arcgis.com/4.15/");
  apiScript.onload = () => window.dispatchEvent(new Event("api-loaded"));

  const supportCSS = document.createElement("link");
  supportCSS.setAttribute("rel", "stylesheet");
  supportCSS.setAttribute("href", "./support/style.css");

  document.head.appendChild(apiCSS);
  document.head.appendChild(apiScript);
  document.head.appendChild(supportCSS);

  // ---

  const viewDiv = document.createElement("div");
  viewDiv.setAttribute("id", "viewDiv");

  const smallViewDiv = document.createElement("div");
  smallViewDiv.setAttribute("id", "smallViewDiv");
  smallViewDiv.style.visibility = "hidden";

  const logDiv = document.createElement("div");
  logDiv.setAttribute("id", "logDiv");
  logDiv.style.visibility = "hidden";

  document.body.appendChild(viewDiv);
  document.body.appendChild(smallViewDiv);
  document.body.appendChild(logDiv);
});

window.addEventListener("message", (message) => (message.data && message.data.play && window.play()), false);
