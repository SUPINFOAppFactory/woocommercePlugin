'use strict';

(function (angular) {
  angular.module('wooCommercePluginContent', ['ngRoute', 'ui.tinymce', 'ui.bootstrap', 'ui.sortable'])
    //injected ngRoute for routing
    .config(['$routeProvider', function ($routeProvider) {
      $routeProvider
        .when('/', {
          templateUrl: 'templates/home.html',
          controllerAs: 'ContentHome',
          controller: 'ContentHomeCtrl'
        })
        .otherwise('/');
    }])
})(window.angular);