(function() {
  'use strict';

/**
 * Map Service
 */
angular
  .module('app')
  .factory('geolocationService', service);

function service(){
  var geolocation;
  var map;
  // check openlayers is available on service instantiation
  // this can be handled with Require later on
  if (!ol) return {};

  function init(vmap){

    map = vmap;
    // Geolocation Control
    geolocation = new ol.Geolocation(/** @type {olx.GeolocationOptions} */ ({
      projection: map.getView().getProjection(),
                                                                                trackingOptions: {
                                                                                  maximumAge: 10000,
                                                                                enableHighAccuracy: true,
                                                                                timeout: 600000
                                                                                }
    }));


    // change center and rotation before render
    map.beforeRender(function(map, frameState) {
      if (frameState !== null) {
        var gp = geolocation.getPosition();
        var view = frameState.viewState;
        if ( gp ){
          view.center = gp;
        }
      }
      return true; // Force animation to continue
    });

  }

  // postcompose callback
  function render() {
    map.render();
  }


  function setTracking(){
    geolocation.setTracking(true); // Start position tracking
    map.on('postcompose', render);
    map.render();
  }

  return {setTracking: setTracking, init: init};

}

})();

