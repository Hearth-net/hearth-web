'use strict';

angular.module('hearth.directives').service('fileUpload', ['$http', function ($http) {
    this.uploadFileToUrl = function(file, uploadUrl, done, doneErr){
        var fd = new FormData();
        fd.append('file', file);
        $http.post(uploadUrl, fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        })
        .success(done)
        .error(doneErr);
    };
}]);

angular.module('hearth.directives').directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

/**
 * @ngdoc directive
 * @name hearth.directives.imagePreview
 * @description
 * @restrict A
 */

angular.module('hearth.directives').directive('imagePreview', [
	'$timeout', '$parse', '$rootScope', 'fileUpload',
	function($timeout, $parse, $rootScope, fileUpload) {
		return {
			transclude: true,
			replace: true,
			scope: {
				files: "=?",
				uploadResource: "=?",
				fileSizes: "=?",
				limit: "=",
				error: "=?",
				getImageSizes: "&",
				limitPixelSize: "=",
				singleFile: "=",
			},
			template: '<div class="image-preview-container"><div class="image-preview image-upload" ng-class="{uploading: uploading}">'
						+ '<input class="file-upload-input" file-model="picFile" type="file"' + ' name="file" ' + 'accept="image/*" capture>' 
						+ '<div class="file-upload-overlay"></div>' 
						+ '<span ng-transclude class="image-preview-content"></span>' 
						+ '</div>'
	                    + '<div ng-if="showErrors && error.badFormat" class="error animate-show">{{ "ERROR_BAD_IMAGE_FORMAT" | translate:"{formats: \'"+allowedTypes.join(", ")+"\'}" }}</div>'
	                    + '<div ng-if="showErrors && error.badSize" class="error animate-show">{{ "ERROR_BAD_IMAGE_SIZE" | translate:"{maxSize: "+limit+"}" }}</div>'
	                    + '<div ng-if="showErrors && error.badSizePx" class="error animate-show">{{ "ERROR_BAD_IMAGE_SIZE_PX" | translate:"{minSize: "+limitPixelSize+"}" }}</div>'
	                    + '<div ng-if="showErrors && error.uploadError" class="error animate-show">{{ "ERROR_WHILE_UPLOADING" | translate:"{minSize: "+limitPixelSize+"}" }}</div>'
						+'</div>',
			link: function(scope, el, attrs) {
				scope.allowedTypes = ['JPG', 'JPEG', 'PNG', 'GIF'];
				scope.showErrors = true;
				scope.error = scope.error || {};
				scope.uploading = false;

				// preview jen jednoho souboru? Nebo to budeme davat do pole
				if(scope.singleFile) {
					scope.files = scope.files || {};
				} else {
					scope.files = scope.files || [];
				}

				// if we want to show errors outside of directive
				if(angular.isUndefined(scope.error))
					scope.showErrors = false;


				function previewImage(el, limitSize) {
					var file = $(el).find(".file-upload-input")[0].files[0],
						imageType = /image.*/,
						device = detectDevice();
					
					scope.error = {};

					if (!device.android) { // Since android doesn't handle file types right, do not do this check for phones
						if(!file.type)
							console.log("File does not have type attribute", file);

						if (!file.type.match(imageType)) {
							return scope.error.badFormat = true;
						}
					}

					var reader = new FileReader();
					reader.onload = function(e) {
						var format = e.target.result.split(';')[0].split('/')[1].toUpperCase();

						// We will change this for an android
						if (device.android) {
							format = file.name.split('.');
							format = format[format.length - 1].toUpperCase();
						}

						// if the picture has right format and is its size is in limit
						if ((!!~ scope.allowedTypes.indexOf(format)) && e.total < (limitSize * 1024 * 1024)) {
							var src = e.target.result;

							// very nasty hack for android
							// This actually injects a small string with format into a temp image.
							if (device.android) {
								src = src.split(':');
								if (src[1].substr(0, 4) == 'base') {
									src = src[0] + ':image/' + format.toLowerCase() + ';' + src[1];
								}
							}
						}

						if (!~scope.allowedTypes.indexOf(format)) {
							// bad format
							scope.error.badFormat = true;
						} else if (e.total > (limitSize * 1024 * 1024)) {
							// bad size of this one image
							scope.error.badSize = true;
						} else if(scope.getImageSizes && scope.getImageSizes() + e.total > $$config.maxImagesSize* 1024 * 1024) {
							// bad size of all images together
							scope.error.badSizeAll = true;
						} else {

							// this will check image size
							var image = new Image();
							image.src = e.target.result;

							return image.onload = function() {

								if(this.width < scope.limitPixelSize || this.height < scope.limitPixelSize) {
									scope.error.badSizePx = true;
								} else {

									// if there is upload resource, upload images immidiatelly
									if(scope.uploadResource) {

								    	scope.uploading = true;
										var file = scope.picFile;
										fileUpload.uploadFileToUrl(file, scope.uploadResource, function(res) {
									    	scope.uploading = false;
					
											if(scope.singleFile) {
												scope.files = res;
											} else {
												scope.files.push(res);
												scope.fileSizes.push(e.total);
											}
										}, function(err) {
									    	scope.uploading = false;
											scope.error.uploadError = true;
											console.log('Error: ', err);
										});
									} else {
										if(scope.singleFile) {
											scope.files = {file:src};
										} else {
											scope.files.push({file:src});
											scope.fileSizes.push(e.total);
										}
									}
									
								}
								scope.$apply();
							};
						}
						scope.$apply();
					};
					reader.readAsDataURL(file);
				}

				// Detect client's device
				function detectDevice() {
					var ua = navigator.userAgent;
					var brand = {
						apple: ua.match(/(iPhone|iPod|iPad)/),
						blackberry: ua.match(/BlackBerry/),
						android: ua.match(/Android/),
						microsoft: ua.match(/Windows Phone/),
						zune: ua.match(/ZuneWP7/)
					}
					return brand;
				}

				return el.bind('change', function(event) {
					return scope.$apply(function() {
						previewImage(el, scope.limit); // 5 mb limit
					});
				});
			}
		};
	}
]);