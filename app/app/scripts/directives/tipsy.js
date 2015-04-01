'use strict';
/**
 * @ngdoc directive
 * @name hearth.directives.tipsy
 * @description Cool tool for tool tips
 * @restrict A
 */
angular.module('hearth.directives').directive('tipsy', [
    '$timeout',
    function($timeout) {
        return {
            link: function($scope, element, attrs) {
                $timeout(function() {
                    $(element).tipsy({gravity: 's'});
                    $(element).mouseleave(function() {
                        $(element).tipsy("hide");
                        console.log("aaa");
                        
                    });
                });
            }
        }
    }
]);
