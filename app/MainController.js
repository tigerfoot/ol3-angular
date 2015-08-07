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
      onFeatureSelected: onFeatureSelected //override default event handler
  });

  vm.staticTabs = { search: true, details: false };
  vm.features = mapService.getFeatures();
  vm.selectFeature = selectFeature;
  vm.hideFeatures = hideFeatures;
  vm.cancelSearch = cancelSearch;

  vm.search = '';
  vm.searchResults = [];

  vm.find = function (){
      vm.searchResults = [];
      console.log(vm.search);
      if (mapService.searchFeatures.length > 0){
        mapService.searchFeatures.forEach(function(feature){
          if (feature.searchText.toLowerCase().indexOf(vm.search.toLowerCase()) > -1){
            vm.searchResults.push(feature);
          }
        });
      }
      console.log(vm.searchResults.length);
  };

  ///////////////////////////////////////////////////////////
  // map to view interactions

  /**
   * Event handler triggered when a feature is selected
   *
   * @param {Object} feature - feature selected. 
   * 
   * Feature properties are defined by config.featurePropertiesMap.
   */
  function onFeatureSelected(feature) {
    console.log("feature selected", feature);
    // safely run after digest cycle
    // needed to handle list selection 
    $timeout(function(){
      vm.feature = feature;
      selectTab("details");
    });
  }

  /**
   * Activates tab
   *
   * @param {String} key - tab id 
   */
  function selectTab(key){
    if (vm.staticTabs.hasOwnProperty(key))
      vm.staticTabs[key] = true;
  }

  ///////////////////////////////////////////////////////////
  // view to map interactions
  
  // subscribe to event
  $rootScope.$on("global.hide-features", vm.hideFeatures);

  /**
   * Selects a single feature on the map
   *
   * @param {String} id - feature id 
   */
  function selectFeature(feature){
    // mapService.selectFeature(feature, true);
    var coord = feature.getGeometry().getFirstCoordinate();
    console.log(coord);
    $scope.map.getView().setCenter(coord);
    $scope.map.getView().setZoom(19);

  }  
  
  /**
   * Hides features on the map
   *
   * @param {Event} event       - event object
   * @param {Array} features    - feature ids that should be shown
   */
  function hideFeatures(event, features){
    mapService.hideFeatures(features, vm.search);
  };

  /**
   * Cancels search and zoom to extent
   */
  function cancelSearch(){
    var undefined, 
      zoomToExtent = true;
      
    selectTab("search");
    vm.search = "";
    vm.feature = undefined;
    mapService.unselectFeature(zoomToExtent);
  };
}

})();