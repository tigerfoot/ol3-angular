(function() {
'use strict';

/**
 * Main Controller
 */
angular
  .module('app')
  .controller('mainController', Controller);

Controller.$inject = [
    'mapService', 
    '$timeout', 
    '$rootScope',
    '$scope'
];

function Controller(mapService, $timeout, $rootScope, $scope) {
  var vm = this;

  // map initialisation
  $scope.map = mapService.init({
      extractStylesKml: false,
      popupOffset: [-4,-43],
      featurePropertiesMap: ['name'], //override default mapping
  });

  vm.staticTabs = { search: true, details: false };
  vm.features = mapService.getFeatures();
  vm.cancelSearch = cancelSearch;
  vm.selectFeature = selectFeature;

  vm.search = '';
  vm.searchResults = [];

  vm.find = function (){
      vm.searchResults = [];
      if (mapService.searchFeatures.length > 0){
        mapService.searchFeatures.forEach(function(feature){
          if (feature.searchText.toLowerCase().indexOf(vm.search.toLowerCase()) > -1){
            vm.searchResults.push(feature);
          }
        });
      }
  };


  // subscribe to event
  $rootScope.$on("global.hide-features", vm.hideFeatures);

  /**
   * Selects a single feature on the map
   *
   * @param {String} id - feature id 
   */
  function selectFeature(feature){
    var formatter = new ol.format.GeoJSON();
    var coord = turf.centroid(formatter.writeFeatureObject(feature)).geometry.coordinates;
    console.log(coord);
    $scope.map.getView().setCenter(coord);
    $scope.map.getView().setZoom(19);

  }  
  

  /**
   * Cancels search and zoom to extent
   */
  function cancelSearch(){
    vm.search = "";
    vm.searchResults = [];
    vm.feature = undefined;
  };
}

})();