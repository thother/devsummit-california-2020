import Polygon = require("esri/geometry/Polygon");
import VectorTileLayer = require("esri/layers/VectorTileLayer");
import { ExaggeratedElevationLayer } from "./ExageratedElevationLayer";
import ElevationLayer = require("esri/layers/ElevationLayer");
import TileLayer = require("esri/layers/TileLayer");
import SimpleRenderer = require("esri/renderers/SimpleRenderer");
import MeshSymbol3D = require("esri/symbols/MeshSymbol3D");
import SceneLayer = require("esri/layers/SceneLayer");
import FeatureLayer = require("esri/layers/FeatureLayer");
import GraphicsLayer = require("esri/layers/GraphicsLayer");


import { Resource as GeneratorResource } from "./Generator";
import FeatureFilter = require("esri/views/layers/support/FeatureFilter");
import { PointSymbol3D } from "esri/symbols";
import LineCallout3D = require("esri/symbols/callouts/LineCallout3D");
import WebStyleSymbol = require("esri/symbols/WebStyleSymbol");

const areaOfInterestExtentPolygon = new Polygon({
  spatialReference: {
    wkid: 102100
  },
  rings: [[
    [-8240065.611268307, 4968362.868711796],
    [-8239302.119759329, 4975235.393009057],
    [-8233975.309550539, 4974018.805261608],
    [-8234793.198983995, 4969583.048152395],
    [-8237397.299937232, 4968889.940017371],
    [-8238519.394853006, 4967590.404433879],
    [-8240065.611268307, 4968362.868711796]
  ]]
});
  
export const vectorTileLayer = new VectorTileLayer({
  style: {
    layers: [
      {
        layout: {},
        paint: {
          "fill-color": "#F0ECDB"
        },
        source: "esri",
        minzoom: 0,
        "source-layer": "Land",
        type: "fill",
        id: "Land/0"
      },
      {
        layout: {},
        paint: {
          "fill-pattern": "Landpattern",
          "fill-opacity": 0.25
        },
        source: "esri",
        minzoom: 0,
        "source-layer": "Land",
        type: "fill",
        id: "Land/1"
      },
      {
        layout: {},
        paint: {
          "fill-color": "#93CFC7"
        },
        source: "esri",
        minzoom: 0,
        "source-layer": "Marine area",
        type: "fill",
        id: "Marine area/1"
      },
      {
        layout: {},
        paint: {
          "fill-pattern": "Marine area",
          "fill-opacity": 0.08
        },
        source: "esri",
        "source-layer": "Marine area",
        type: "fill",
        id: "Marine area/2"
      },
      {
        layout: {
          "line-cap": "round",
          "line-join": "round"
        },
        paint: {
          "line-color": "#cccccc",
          "line-dasharray": [7, 5.33333],
          "line-width": 1
        },
        source: "esri",
        minzoom: 1,
        "source-layer": "Boundary line",
        type: "line",
        id: "Boundary line/Admin0/0"
      },
      {
        layout: {
          "text-font": ["Risque Regular"],
          "text-anchor": "center",
          "text-field": "{_name_global}"
        },
        paint: {
          "text-halo-blur": 1,
          "text-color": "#AF420A",
          "text-halo-width": 1,
          "text-halo-color": "#f0efec"
        },
        source: "esri",
        "source-layer": "Continent",
        type: "symbol",
        id: "Continent"
      },
      {
        layout: {
          "text-font": ["Atomic Age Regular"],
          "text-field": "{_name}",
          "text-transform": "none"
        },
        paint: {
          "text-halo-blur": 1,
          "text-color": "#AF420A",
          "text-halo-width": 1,
          "text-halo-color": "#f0efec"
        },
        source: "esri",
        minzoom: 2,
        "source-layer": "Admin0 point",
        maxzoom: 10,
        type: "symbol",
        id: "Admin0 point/large"
      }
    ],
    glyphs:
      "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/resources/fonts/{fontstack}/{range}.pbf",
    version: 8,
    sprite:
      "https://www.arcgis.com/sharing/rest/content/items/7675d44bb1e4428aa2c30a9b68f97822/resources/sprites/sprite",
    sources: {
      esri: {
        url:
          "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer",
        type: "vector"
      }
    }
  }
});


export const exaggeratedElevationLayer = new ExaggeratedElevationLayer({ exaggeration: 200 }) as ElevationLayer & ExaggeratedElevationLayer;

export const normalElevationLayer = new ElevationLayer({
  url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
});



export const imageTileLayer = new TileLayer({
  url: "//services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
})

export const sketchSceneRenderer = new SimpleRenderer({
  symbol: new MeshSymbol3D({
    symbolLayers: [{
      type: "fill",
      material: {
        color: [244, 247, 134]
      },
      edges: {
        type: "sketch",
        color: [50, 50, 50, 0.5],
        size: 1.5,
        extensionLength: 2
      }
    }]
  })
});

export const normalSeneRenderer = new SimpleRenderer({
  symbol: new MeshSymbol3D({
    symbolLayers: [{
      type: "fill",
      material: {
        color: [244, 247, 244]
      }
    }]
  })
});

export const sceneLayerDefinitionExpression = "heightroof >= 500";
export const sceneLayerFeatureFilter = new FeatureFilter({ geometry: areaOfInterestExtentPolygon, spatialRelationship: "contains" });
export const sceneLayer = new SceneLayer({
  url: "https://tilesqa.arcgis.com/tiles/SdQnSRS214Ul5Jv5/arcgis/rest/services/SM__4326__US_NewYorkCity__Buildings_OBB/SceneServer",
  renderer: normalSeneRenderer
});


export const featureLayerDefinitionExpression = "website IS NOT NULL";
export const featureLayerFeatureFilter = new FeatureFilter({ geometry: areaOfInterestExtentPolygon, spatialRelationship: "contains" });
export const featureLayerElevationRelative: __esri.FeatureLayerElevationInfo = {
  mode: "relative-to-scene",
  offset: 0
};
export const featureLayerElevationAbsolute: __esri.FeatureLayerElevationInfo = {
  mode: "absolute-height"
};

export const featureLayer = new FeatureLayer({
  url : "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Restaurants_NewYork/FeatureServer/0",
  elevationInfo: featureLayerElevationRelative,
  featureReduction: {
    type: "selection"
  },
  renderer: new SimpleRenderer({
    symbol: new PointSymbol3D({
      symbolLayers: [
        {
          type: "icon",
          anchor: "bottom",
          resource: {
            href: "assets/icons/restaurant.png"
          },
          size: 18,
          outline: {
            color: [50, 50, 50, 0.25],
            size: 1
          }
        }
      ],
      verticalOffset: {
        screenLength: 40,
        maxWorldLength: 100,
        minWorldLength: 40
      },
      callout: new LineCallout3D({
        color: [255, 255, 255, 0.5],
        size: 1,
        border: {
          color: [50, 50, 50, 0.25]
        }
      })
    })
  })
});

export const graphicsLayer = new GraphicsLayer({
  elevationInfo: {
    mode: "relative-to-scene"
  }
});

export const carAnimationLine = [
  [-8238602.859293547, 4969864.952248778],
  [-8238815.118199545,4969527.692694762],
  [-8238946.434317269, 4969325.23432037],
  [-8239114.148472862, 4969052.499709685],
  [-8239211.811770952, 4968881.582326116],
  [-8239395.443323595, 4968927.335310461],
  [-8239473.190457867, 4968907.87431074],
  [-8239473.706961916, 4968939.291353831],
  [-8239416.597913337, 4969157.579122222],
  [-8239294.146937301, 4969568.861017413],
  [-8239229.257272403, 4969952.065061877],
  [-8239165.630443195, 4970216.229375994],
  [-8239127.652516294, 4970337.74032057],
  [-8239061.222742594, 4970701.929770929],
  [-8238339.289580038, 4970272.720051797],
  [-8238544.416662143, 4969947.100761569],
];

export const carAnimationLineSegmentLengths = carAnimationLine.map((position, index) => {
  if (index === 0) {
    return 0;
  }

  const x = carAnimationLine[index][0] - carAnimationLine[index - 1][0];
  const y = carAnimationLine[index][1] - carAnimationLine[index - 1][1];

  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}, 0);

export const carAnimationLineLength = carAnimationLineSegmentLengths.reduce((total, segment) => total + segment, 0);


export const graphicsLayerResources: GeneratorResource[] = [
  { 
    name: "airplane",
    icon: {
      src: "assets/icons/airplane.png"
    },
    symbol: new WebStyleSymbol({
      name: "Airplane_Small_Passenger",
      styleName: "EsriRealisticTransportationStyle"
    }),
    scale: 2
  },
  {
    name: "car",
    icon: {
      src: "assets/icons/car.png"
    },
    symbol: new WebStyleSymbol({
      name: "Ford_Mustang",
      styleName: "EsriRealisticTransportationStyle"
    }),
    scale: 2
  },
  { 
    name: "boat",
    icon: {
      src: "assets/icons/boat.png"
    },
    symbol: new WebStyleSymbol({
      name: "Sailboat_-_Sails_Up",
      styleName: "EsriRealisticTransportationStyle"
    }),
    scale: 2
  },
  { 
    name: "tree",
    icon: {
      src: "assets/icons/tree.png"
    },
    symbol: new WebStyleSymbol({
      name: "Juniperus",
      styleName: "EsriRealisticTreesStyle"
    }),
    scale: 1
  },
];

