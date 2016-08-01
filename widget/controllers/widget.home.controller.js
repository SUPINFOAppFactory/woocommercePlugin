'use strict';

(function (angular,buildfire) {
    angular
        .module('wooCommercePluginWidget')
        .controller('WidgetHomeCtrl', ['$scope', 'DataStore', 'WooCommerceSDK', 'TAG_NAMES', '$sce', 'LAYOUTS', '$rootScope', 'PAGINATION', 'Buildfire', 'ViewStack',
            function ($scope, DataStore, WooCommerceSDK, TAG_NAMES, $sce, LAYOUTS, $rootScope, PAGINATION, Buildfire, ViewStack) {
                var WidgetHome = this;
                WidgetHome.data = null;
                WidgetHome.sections = [];
                WidgetHome.busy = true;
                WidgetHome.pageNumber = 1;
                //create new instance of buildfire carousel viewer
                WidgetHome.view = null;
                WidgetHome.safeHtml = function (html) {
                    if (html) {
                        var $html = $('<div />', {html: html});
                        $html.find('iframe').each(function (index, element) {
                            var src = element.src;
                            console.log('element is: ', src, src.indexOf('http'));
                            src = src && src.indexOf('file://') != -1 ? src.replace('file://', 'http://') : src;
                            element.src = src && src.indexOf('http') != -1 ? src : 'http:' + src;
                        });
                        return $sce.trustAsHtml($html.html());
                    }
                };

              //Refresh list of items on pulling the tile bar

              buildfire.datastore.onRefresh(function () {
                init(function(err){
                  if(!err){
                    if (!WidgetHome.view) {
                      WidgetHome.view = new Buildfire.components.carousel.view("#carousel", []);
                    }
                    if (WidgetHome.data.content && WidgetHome.data.content.carouselImages) {
                      WidgetHome.view.loadItems(WidgetHome.data.content.carouselImages);
                    } else {
                      WidgetHome.view.loadItems([]);
                    }
                    WidgetHome.sections = [];
                    WidgetHome.busy = false;
                    WidgetHome.pageNumber = 1;
                    WidgetHome.loadMore();
                  }
                });
              });

                WidgetHome.showDescription = function (description) {
                    console.log('Description---------------------------------------', description);
                    if (typeof description != 'undefined')
                        return !((description == '<p>&nbsp;<br></p>') || (description == '<p><br data-mce-bogus="1"></p>') || (description == ''));
                    else
                        return false;
                };
                $rootScope.deviceHeight = window.innerHeight;
                $rootScope.deviceWidth = window.innerWidth || 320;
                $rootScope.backgroundImage = "";
                WidgetHome.loadMore = function () {
                    console.log('>>>>>>>>>>>>>> inside load more widget home controller');
                    if (WidgetHome.busy) return;
                    WidgetHome.busy = true;
                    if (WidgetHome.data.content.storeURL && WidgetHome.data.content.consumerKey && WidgetHome.data.content.consumerSecret)
                        getSections(WidgetHome.data.content.storeURL, WidgetHome.data.content.consumerKey, WidgetHome.data.content.consumerSecret);
                    else
                        WidgetHome.sections = [];
                };

                WidgetHome.showItems = function (slug) {
                    if (WidgetHome.data.design.itemListLayout)
                        ViewStack.push({
                            template: WidgetHome.data.design.itemListLayout,
                            params: {
                                slug: slug,
                                controller: "WidgetItemsCtrl as WidgetItems",
                                shouldUpdateTemplate: true
                            }
                        });
                };

                WidgetHome.goToCart = function () {
                    /*ViewStack.push({
                     template: 'Checkout',
                     params: {
                     url: WidgetHome.data.content.storeURL + '/cart'
                     }
                     });*/
                    if (WidgetHome.data && WidgetHome.data.content && WidgetHome.data.content.storeURL)
                        buildfire.navigation.openWindow(WidgetHome.data.content.storeURL + '/cart', "_system");
                };

                var currentStoreUrl = "";

                var getSections = function (storeURL, consumerKey, consumerSecret) {
                    console.log('<<<<<<<<<<<<<<<<<< inside get section of widget home controller');
                    Buildfire.spinner.show();
                    var success = function (result) {
                            Buildfire.spinner.hide();
                            console.log("********************************", result.data);
                            WidgetHome.sections = WidgetHome.sections.length ? WidgetHome.sections.concat(result.data.product_categories) : result.data.product_categories;
                            WidgetHome.pageNumber = WidgetHome.pageNumber + 1;
                            if (result && result.data && result.data.product_categories && (result.data.product_categories.length == PAGINATION.sectionsCount)) {
                                WidgetHome.busy = false;
                            }
                        }
                        , error = function (err) {
                            Buildfire.spinner.hide();
                            console.error('Error In Fetching category list', err);
                        };
                    WooCommerceSDK.getSections(storeURL, consumerKey, consumerSecret, WidgetHome.pageNumber).then(success, error);
                };

                var initialize = function (storeURL, consumerKey, consumerSecret) {
                    var success = function (response) {
                        getSections(storeURL, consumerKey, consumerSecret);
                    };
                    var error = function (err) {
                        console.error('Error while initializing from widget side: ', err);
                    };
                    WooCommerceSDK.initialize(storeURL, consumerKey, consumerSecret).then(success, error);
                };

                /*
                 * Fetch user's data from datastore
                 */

                var init = function (cb) {
                    var success = function (result) {
                            WidgetHome.data = result.data;
                            if (!WidgetHome.data.design)
                                WidgetHome.data.design = {};
                            if (!WidgetHome.data.content)
                                WidgetHome.data.content = {};
                            if (!WidgetHome.data.settings)
                                WidgetHome.data.settings = {};
                            if (WidgetHome.data.content.storeURL) {
                                currentStoreUrl = WidgetHome.data.content.storeURL;
                            }
                            if (!WidgetHome.data.design.sectionListLayout) {
                                WidgetHome.data.design.sectionListLayout = LAYOUTS.sectionListLayout[0].name;
                            }
                            if (!WidgetHome.data.design.itemListLayout) {
                                WidgetHome.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
                            }
                            console.log("WidgetHome.data.design.backgroundImage", WidgetHome.data.design.itemDetailsBgImage);
                            if (!WidgetHome.data.design.itemDetailsBgImage) {
                                $rootScope.backgroundImage = "";
                            } else {
                                $rootScope.backgroundImage = WidgetHome.data.design.itemDetailsBgImage;
                            }
                            if (WidgetHome.data.content.storeURL && WidgetHome.data.content.consumerKey && WidgetHome.data.content.consumerSecret)
                                initialize(WidgetHome.data.content.storeURL, WidgetHome.data.content.consumerKey, WidgetHome.data.content.consumerSecret);
                            else
                                WidgetHome.sections = [];
                            cb();
                        }
                        , error = function (err) {
                            console.error('Error while getting data', err);
                        cb(err);
                        };
                    DataStore.get(TAG_NAMES.WOOCOMMERCE_INFO).then(success, error);
                };

                var onUpdateCallback = function (event) {
                    setTimeout(function () {
                        if (event && event.tag) {
                            switch (event.tag) {
                                case TAG_NAMES.WOOCOMMERCE_INFO:
                                    WidgetHome.data = event.data;
                                    if (!WidgetHome.data.design)
                                        WidgetHome.data.design = {};
                                    if (!WidgetHome.data.design.sectionListLayout) {
                                        WidgetHome.data.design.sectionListLayout = LAYOUTS.sectionListLayout[0].name;
                                    }
                                    if (!WidgetHome.data.design.itemListLayout) {
                                        WidgetHome.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
                                    }
                                    if (!WidgetHome.data.content.storeURL) {
                                        WidgetHome.sections = [];
                                        currentStoreUrl = "";
                                        WidgetHome.busy = false;
                                    }
                                    if (!WidgetHome.data.design.itemDetailsBgImage) {
                                        $rootScope.backgroundImage = "";
                                    } else {
                                        $rootScope.backgroundImage = WidgetHome.data.design.itemDetailsBgImage;
                                    }
                                    if (WidgetHome.data.content.storeURL && currentStoreUrl != WidgetHome.data.content.storeURL) {
                                        WidgetHome.sections = [];
                                        WidgetHome.busy = false;
                                        WidgetHome.pageNumber = 1;
                                        WidgetHome.loadMore();
                                    }
                                    if (WidgetHome.view) {
                                        WidgetHome.view.loadItems(WidgetHome.data.content.carouselImages);
                                    }

                                    break;
                            }
                            $scope.$digest();
                            $rootScope.$digest();
                        }
                    }, 0);
                };

                /**
                 * DataStore.onUpdate() is bound to listen any changes in datastore
                 */
                DataStore.onUpdate().then(null, null, onUpdateCallback);


                $rootScope.$on("Carousel:LOADED", function () {
                    WidgetHome.view = null;
                    if (!WidgetHome.view) {
                        WidgetHome.view = new buildfire.components.carousel.view("#carousel", [], "WideScreen");
                    }
                    if (WidgetHome.data && WidgetHome.data.content.carouselImages) {
                        WidgetHome.view.loadItems(WidgetHome.data.content.carouselImages, null, "WideScreen");
                    } else {
                        WidgetHome.view.loadItems([]);
                    }
                });

                /*crop image on the basis of width heights*/
                WidgetHome.cropImage = function (url, settings) {
                    var options = {};
                    if (!url) {
                        return "";
                    }
                    else {
                        if (settings.height) {
                            options.height = settings.height;
                        }
                        if (settings.width) {
                            options.width = settings.width;
                        }
                        return buildfire.imageLib.cropImage(url, options);
                    }
                };
                $scope.$on("$destroy", function () {
                    DataStore.clearListener();
                });

                $rootScope.$on('VIEW_CHANGED', function (e, type, view) {
                    if (type === 'POPALL') {
                        WidgetHome.data.content.storeURL = null;
                        WidgetHome.sections = [];
                        WidgetHome.busy = false;
                        WidgetHome.pageNumber = 1;
                        $scope.$digest();
                    }
                    if (type === 'POP') {
                        DataStore.onUpdate().then(null, null, onUpdateCallback);
                    }
                    if (!ViewStack.hasViews()) {
                    // bind on refresh again
                    buildfire.datastore.onRefresh(function () {
                      init(function(err){
                        if(!err){
                          if (!WidgetHome.view) {
                            WidgetHome.view = new Buildfire.components.carousel.view("#carousel", []);
                          }
                          if (WidgetHome.data.content && WidgetHome.data.content.carouselImages) {
                            WidgetHome.view.loadItems(WidgetHome.data.content.carouselImages);
                          } else {
                            WidgetHome.view.loadItems([]);
                          }
                          WidgetHome.sections = [];
                          WidgetHome.busy = false;
                          WidgetHome.pageNumber = 1;
                          WidgetHome.loadMore();
                        }
                      });
                    });
                  }
                });

                init(function(){});
            }]);
})(window.angular, window.buildfire);
