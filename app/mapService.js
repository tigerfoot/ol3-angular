(function() {
'use strict';

/**
 * Map Service
 */
angular
  .module('app')
  .factory('mapService', service);

function service(){
  // check openlayers is available on service instantiation
  // this can be handled with Require later on
  if (!ol) return {};

  var map = {}, //convenience reference
    defaults = {
      zoom: 12,
      startLocation: [7.3442457442483,47.2553496968727],
      extractStylesKml: false,
      popupOffset: [0,0],
      featurePropertiesMap: ['name'],
    },
    zIndex = 9999, 
    popup, 
    selectedFeature,
    searchFeatures = [],
    myZoomToExtentControl;
  
  // public API
  var ms = {
    map: map, // ol.Map
    init: init,
    getFeatures: getFeatures,
    searchFeatures: searchFeatures
  };
  
  return ms;
  
  ///////////////////////////////////////////////////////////
  // helper functions

  function olMapFeatures() {
    var featuresArray = map  //ol.Map
      .getLayers()  //ol.Collection
      .getArray()[1]  //ol.layer.Vector
        .getSource()  //ol.source.KML
          .getFeatures()  //ol.Feature
    return featuresArray;
  }

  function getFeatures() {
    var f = []; 
    olMapFeatures()
      .forEach(function(olFeature, i) {
        var feature = {id: olFeature.getId()};
        f.push(mapFeatureProperties(feature, olFeature));
      });
    return f;
  }

  function unselectFeature(zoom) {
    var undefined;
    selectedFeature = undefined;
    $("#map path").each(function(index, item){
        item.setAttribute("class", "icon");
      });
    if (zoom) 
      zoomToExtent();
  }
  

  
  function init(config){
    var config = angular.extend(defaults, config);

    createMyZoomToExtentControl();
    
    // map initialisation
    map = new ol.Map({
      target: 'map',
      layers: [
        //new ol.layer.Tile({
        //  source: new ol.source.MapQuest({layer: 'osm'})
        //})
      ],
      view: new ol.View({
        center: ol.proj.transform(config.startLocation, 'EPSG:4326', 'EPSG:3857'),
        zoom: config.zoom
      }),
		  controls: ol.control.defaults().extend([
		    new myZoomToExtentControl({tipLabel: "Fit to extent"}),
				new ol.control.ScaleLine()
			])
    });
    
    GeoJsonLoad();
    return map;
  }

  function createMyZoomToExtentControl(){
    /**
     * @constructor
     * @extends {ol.control.Control}
     * @param {Object} opt_options - Control options.
     */
    myZoomToExtentControl = function (opt_options) {

      var options = opt_options || {};

      var button = document.createElement('button');
      button.id = 'zoom-to-extent';
      button.setAttribute("title","Zoom to Extent");

      var span = document.createElement('span');
      
      //span.setAttribute("class", "glyphicon glyphicon-record");
      span.innerHTML = 'E';
      button.appendChild(span);

      var this_ = this;
      var handler = function(e) {
        e.preventDefault(); //cancel click event
        zoomToExtent();
        document.getElementById("zoom-to-extent").disabled = true;
        setTimeout(function() {
          document.getElementById("zoom-to-extent").disabled = false;
        }, 1);
      };

      button.addEventListener('click', handler, true);
      button.addEventListener('touchstart', handler, true);

      var element = document.createElement('div');
      element.className = 'zoom-to-extent ol-zoom-extent ol-unselectable ol-control';
      element.appendChild(button);

      ol.control.Control.call(this, {
        element: element,
        target: options.target
      });

    };
    ol.inherits(myZoomToExtentControl, ol.control.ZoomToExtent);
  }
  
  function zoomToExtent() {
		var bounds = ol.extent.createEmpty();
		
		olMapFeatures()
      .forEach(function(item, i, arr){
        var ext = ol.extent.createEmpty();
        ext = item.getGeometry().getExtent();
        bounds = ol.extent.extend(bounds, ext);
      });
            
    if (bounds) {
      // increase bounds using a tenth of the
      // maximum distance between coordinates
      var incX = Math.abs(bounds[2] - bounds[0]);
      var incY = Math.abs(bounds[3] - bounds[1]);
      var buffer = (incX>incY)? incX: incY;
      var bounds10 = ol.extent.createEmpty();
      ol.extent.buffer(bounds, buffer/5, bounds10);

      var animation = ol.animation.pan({
              easing: eval(ol.easing.inAndOut),
              source: map.getView().getCenter()
      });
      map.beforeRender(animation);

      map.getView().setZoom(12);
      map.getView().setCenter(ol.proj.transform(defaults.startLocation, 'EPSG:4326', 'EPSG:3857'));
    }
};
  


  function GeoJsonLoad(){
    var data = [
    './data/ambulance_np6_01.json',
    './data/ambulance_nomlocal.json',
    './data/ambulance_lieudit.json',
    './data/ambulance_lieucommunes.json',
    './data/ambulance_rueplace.json',
    './data/ambulance_batiments.json',
    ];

    data.forEach(function(dataUrl){

      var vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
          url: dataUrl,
          format: new ol.format.GeoJSON(),
        }),
        style: styleFunction
      });

      // Add vectory layer to map
      map.addLayer(vectorLayer);

      vectorLayer.getSource().on('change', function(evt) {
        var source = evt.target;
        // important for async.
        if (source.getState() === 'ready') {

          if (dataUrl == './data/ambulance_batiments.json'){
            vectorLayer.setVisible(false);
             map.on('postrender',function(){
              if (map.getView().getZoom() >= 18 ){
                vectorLayer.setVisible(true);
              }else{
                vectorLayer.setVisible(false);
              }
//               console.log("postrender ",map.getView().getZoom());
             });
          }

          source.getFeatures().forEach(function(feature){
            var searchText = [];
            var properties = feature.getProperties();
            for (name in properties ){
              if (properties.hasOwnProperty(name) && name !== 'geometry'){
                searchText.push(properties[name].toString());
              }
            }
            searchFeatures.push({
              feature: feature,
              searchText: searchText.join(', ')
            })
          });

        }

      });
    });

    function styleFunction (feature, resolution) {

      function getTextStyle() {
        if (feature.getProperties()) {
          var properties = feature.getProperties();
          if (properties.numero) {
            return new ol.style.Text({
              text: feature.getProperties().numero,
              fill: new ol.style.Fill({color: 'black'})
            })
          } else if (properties.texte) {
            return new ol.style.Text({
              text: feature.getProperties().texte,
              fill: new ol.style.Fill({color: 'black'})
            })
          }
        }
      }

      var image = new ol.style.Circle({
        radius: 5,
        fill: null,
        stroke: new ol.style.Stroke({color: 'red', width: 1})
      });
      var Geostyles = {
        'Point': [new ol.style.Style({
          image: image
        })],
        'LineString': [new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'red',
            width: 1
          }),
          text: getTextStyle()
        })
        ],
        'MultiLineString': [new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'red',
            width: 1
          })
        })],
        'MultiPoint': [new ol.style.Style({
          image: image
        })],
        'MultiPolygon': [new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'yellow',
            width: 1
          }),
          fill: new ol.style.Fill({
            color: 'rgba(255, 255, 0, 0.1)'
          })
        })],
        'Polygon': [new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'blue',
            lineDash: [4],
            width: 3
          }),
          fill: new ol.style.Fill({
            color: 'rgba(0, 0, 255, 0.1)'
          }),
          text: getTextStyle()
        })],
        'GeometryCollection': [new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'magenta',
            width: 2
          }),
          fill: new ol.style.Fill({
            color: 'magenta'
          }),
          image: new ol.style.Circle({
            radius: 10,
            fill: null,
            stroke: new ol.style.Stroke({
              color: 'magenta'
            })
          })
        })],
        'Circle': [new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'red',
            width: 2
          }),
          fill: new ol.style.Fill({
            color: 'rgba(255,0,0,0.2)'
          })
        })]
              };

      return Geostyles[feature.getGeometry().getType()];

    }
  }

}


})();