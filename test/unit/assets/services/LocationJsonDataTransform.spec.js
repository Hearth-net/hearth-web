describe('LocationJsonDataTransform factory', function() {
	var locFactory;

	beforeEach(angular.mock.module('hearth'));

	beforeEach(inject(function(_LocationJsonDataTransform_) {
		locFactory = _LocationJsonDataTransform_;
	}));

	// A simple test to verify the ConversationAux factory exists
	it('should exist', function() {
		expect(locFactory).toBeDefined();
	});

	describe('.getLocationJson()', function() {
		it('should exist', function() {
			expect(locFactory.getLocationJson).toBeDefined();
		});

		it('should return object with correct address data', function() {
			var userDataJson = '{"_id":"5559a2ef393535000b520000","_type":"User","locations":[{"json_data":{"place_id":"ChIJ_ahZRmnFC0cRodjoyxve0zs","coordinates":[14.2273592,50.2794211],"address":"Malovarská 280, 273 24 Velvary, Česká republika","short_address":"Malovarská - Velvary, CZ","formatted_address":"Malovarská 280, 273 24 Velvary, Česká republika"}}],"is_followee":false}'
			var result = locFactory.getLocationJson(userDataJson);
			expect(result.locations[0].address).toEqual("Malovarská 280, 273 24 Velvary, Česká republika");
		});

		it('should return same object when invalid data is passed', function() {
			var userDataJson = '{ bla }';
			var result = locFactory.getLocationJson(userDataJson);
			expect(result).toEqual('{ bla }');
		});
	});

	describe('.insertLocationJson()', function() {
		it('should exist', function() {
			expect(locFactory.insertLocationJson).toBeDefined();
		});

		it('should return object with place_id', function() {
			var userData = {
				'_id': '123456789',
				'locations':[{
					"place_id":"ChIJ_ahZRmnFC0cRodjoyxve0zs",
					"coordinates":[14.2273592,50.2794211],
					"address":"Malovarská 280, 273 24 Velvary, Česká republika",
					"short_address":"Malovarská - Velvary, CZ",
					"formatted_address":"Malovarská 280, 273 24 Velvary, Česká republika"
				}]
			};
			var result = locFactory.insertLocationJson(userData);
			expect(result).toEqual('{"_id":"123456789","locations":[{"json_data":{"place_id":"ChIJ_ahZRmnFC0cRodjoyxve0zs"}}]}');
		});

		it('should throw an error when invalid data is passed', function() {
			var userData = {
				'_id': '123456789',
			};
			expect(function () { locFactory.insertLocationJson(userData); }).toThrow(new Error("An error ocured while parsing object data: Undefined or null entityLocations"));
		});

	});


});
