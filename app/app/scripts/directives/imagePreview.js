'use strict';

angular.module('hearth.directives').service('ImageLib', ['$http', function($http) {

	this.getProportionalSize = function(img, maxWidth, maxHeight) {
		var ratio = 1;
		var width = img.width;
		var height = img.height;

		if (img.width > maxWidth || img.height > maxHeight) {
			var ratioX = (maxWidth / width);
			var ratioY = (maxHeight / height);
			var ratio = Math.min(ratioX, ratioY);
		}

		return {
			width: Math.floor(width * ratio),
			height: Math.floor(height * ratio)
		};
	};

	this.resize = function(img, newSize, outputCanvas) {
		var canvas = document.createElement('canvas');
		canvas.width = newSize.width;
		canvas.height = newSize.height;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0, newSize.width, newSize.height);
		return outputCanvas ? canvas : canvas.toDataURL("image/jpeg");
	};

	this.cropSquareCenter = function(img, size, done) {
		var oh = 0,
			ow = 0;
		var squareSize = Math.min(size.width, size.height);

		if (size.width > size.height) {
			ow = Math.round((size.width - squareSize) / 2);

		} else if (size.width < size.height) {
			oh = Math.round((size.height - squareSize) / 2);
		}

		var canvas = document.createElement('canvas');
		canvas.width = squareSize;
		canvas.height = squareSize;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, ow, oh, squareSize, squareSize, 0, 0, squareSize, squareSize);
		return done(canvas.toDataURL("image/jpeg"));
	};

	this.cropSmart = function(img, size, done) {
		var squareSize = Math.min(size.width, size.height);

		SmartCrop.crop(img, {
			width: squareSize,
			height: squareSize
		}, function(result) {
			var canvas = document.createElement('canvas');
			canvas.width = squareSize;
			canvas.height = squareSize;
			var ctx = canvas.getContext("2d");
			ctx.drawImage(img, result.topCrop.x, result.topCrop.y, result.topCrop.width, result.topCrop.height, 0, 0, result.topCrop.width, result.topCrop.height);
			done(canvas.toDataURL("image/jpeg"));
		});
	};

	this.upload = function(file, uploadUrl, done, doneErr) {
		$http.post(uploadUrl, {
				file_data: file
			})
			.success(done)
			.error(doneErr);
	};
}]);

angular.module('hearth.directives').directive('fileModel', ['$parse', '$rootScope', function($parse, $rootScope) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			var model = $parse(attrs.fileModel);
			var modelSetter = model.assign;

			element.bind('change', function() {
				modelSetter(scope, element[0].files[0]);
				if (!scope.$$phase && !$rootScope.$$phase) scope.$apply();
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
	'$timeout', '$parse', '$rootScope', 'ImageLib',
	function($timeout, $parse, $rootScope, ImageLib) {
		return {
			transclude: true,
			replace: true,
			scope: {
				files: "=?",
				uploadResource: "=?",
				fileSizes: "=?",
				limit: "=",
				uploadingNotifier: "&",
				error: "=?",
				getImageSizes: "&",
				limitPixelSize: "=",
				singleFile: "=",
			},
			template: '<div class="image-preview-container"><div class="image-preview image-upload" ng-class="{uploading: uploading}">\
					<input ng-if="singleFile" class="file-upload-input" file-model="picFile" type="file" name="file" accept="image/*" />\
					<input ng-if="!(singleFile)" class="file-upload-input" file-model="picFile" type="file" name="file" accept="image/*" multiple />\
					<div class="file-upload-overlay"></div>\
						<span ng-transclude class="image-preview-content"></span>\
					</div>\
					<div ng-if="showErrors && error.badFormat" class="error animate-show">{{ "ERROR_BAD_IMAGE_FORMAT" | translate:"{formats: \'"+allowedTypes.join(", ")+"\'}" }}</div>\
					<div ng-if="showErrors && error.badSize" class="error animate-show">{{ "ERROR_BAD_IMAGE_SIZE" | translate:"{maxSize: "+limit+"}" }}</div>\
					<div ng-if="showErrors && error.badSizePx" class="error animate-show">{{ "ERROR_BAD_IMAGE_SIZE_PX" | translate:"{minSize: "+limitPixelSize+"}" }}</div>\
					<div ng-if="showErrors && error.uploadError" class="error animate-show">{{ "ERROR_WHILE_UPLOADING" | translate:"{minSize: "+limitPixelSize+"}" }}</div>\
				</div>',
			link: function(scope, el, attrs) {
				scope.allowedTypes = ['JPG', 'JPEG', 'PNG', 'GIF'];
				scope.showErrors = true;
				scope.error = scope.error || {};
				scope.uploading = false;
				console.log(scope.singleFile);

				// preview jen jednoho souboru? Nebo to budeme davat do pole
				if (scope.singleFile) {
					scope.files = scope.files || {};
				} else {
					scope.files = scope.files || [];
				}

				// if we want to show errors outside of directive
				if (angular.isUndefined(scope.error))
					scope.showErrors = false;

				function isInvalidFile(file) {
					var device = detectDevice();
					var imageType = /image.*/;
					if (!file)
						return true;

					if (!device.android) {
						// Since android doesn't handle file types right, do not do this check for phones
						if (!file || !file.type) {
							console.log("File does not have type attribute", file);
							return true;
						}

						if (!file.type.match(imageType)) {
							return scope.error.badFormat = true;
						}
					}

					return false;
				}

				function isInvalidFormat(file, imgFile) {
					var format = imgFile.split(';')[0].split('/')[1].toUpperCase();
					var device = detectDevice();

					// We will change this for an android
					if (device.android) {
						format = file.name.split('.');
						format = format[format.length - 1].toUpperCase();
					}

					if (!~scope.allowedTypes.indexOf(format)) {
						// bad format
						return scope.error.badFormat = true;
					}

					return false;
				}

				function pushResult(data, img) {
					if (scope.singleFile) {
						scope.files = data;
					} else {
						scope.files.push(data);
						scope.fileSizes.push(img.total);
					}
				}

				function handleImageLoad(img, imgFile, limitSize) {
					var resized;

					if (img.width < scope.limitPixelSize || img.height < scope.limitPixelSize)
						return scope.error.badSizePx = true;

					// if there is not upload resource, upload images later
					if (!scope.uploadResource) {
						var size = ImageLib.getProportionalSize(img, $$config.imgMaxPixelSize, $$config.imgMaxPixelSize);

						var canvas = ImageLib.resize(img, size, true);
						return ImageLib.cropSmart(canvas, size, function(resized) {

							resized = ExifRestorer.restore(imgFile.target.result, resized);

							if (resized.split(',').length == 1)
								resized = 'data:image/jpeg;base64,' + resized;
							pushResult({
								file: resized
							}, {
								total: 0
							});
						});
					}

					if (img.width <= $$config.imgMaxPixelSize && img.height <= $$config.imgMaxPixelSize &&
						imgFile.total > (limitSize * 1024 * 1024)
					) {
						return scope.error.badSize = true;
					}

					scope.uploading = true;
					scope.$apply();
					$timeout(function() {

						resized = ImageLib.resize(img, ImageLib.getProportionalSize(img, $$config.imgMaxPixelSize, $$config.imgMaxPixelSize));
						resized = ExifRestorer.restore(imgFile.target.result, resized);
						ImageLib.upload(resized.split(',').pop(), scope.uploadResource, function(res) {
							scope.uploading = false;

							pushResult(res, {
								total: 0
							});
							$('input', el).val("");
						}, function(err) {
							scope.uploading = false;
							scope.error.uploadError = true;
							console.log('Error: ', err);
							$('input', el).val("");
						});
					}, 50);
				}

				function previewImage(el, limitSize) {
					var files = $(".file-upload-input", el)[0].files;
					scope.error = {};
					for (var i = files.length; i--;) {
						if (isInvalidFile(files[i]))
							return false;

						var reader = new FileReader();
						reader.onload = function(e) {
							var imgFile = e.target.result;

							if (!isInvalidFormat(files[i], imgFile)) {

								// this will check image size
								var image = new Image();
								image.src = imgFile;
								return image.onload = function() {
									handleImageLoad(this, e, limitSize);
									scope.$apply();
								};
							}
							scope.$apply();
						};
						reader.readAsDataURL(files[i]);
					}
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

				scope.$watch("uploading", function(val) {
					if (scope.uploadingNotifier)
						scope.uploadingNotifier({
							val: val
						});
				});

				return el.bind('change', function(event) {
					previewImage(el, scope.limit); // 5 mb limit
					if (!scope.$$phase && !$rootScope.$$phase) scope.$apply();
				});
			}
		};
	}
]);