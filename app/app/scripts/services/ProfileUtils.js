'use strict';

/**
 * @ngdoc service
 * @name hearth.services.ProfileUtils
 * @description Helper class for all Hearth profiles (user himself, other users, community profiles...)
 */

angular.module('hearth.services').factory('ProfileUtils', ['Karma', 'MottoLength', '$window', function(Karma, MottoLength, $window) {

	var factory = {};

	var PROFILE_TYPES = {
		USER: 'user',
		COMMUNITY: 'community'
	}

	/**
	 *	Function that takes the profile and its type and processes all necessary transforms on it
	 *	so that it can be used without problem
	 *
	 *	@param {Object} paramObject	-	{Object}	profile [required] the object to be transformed
	 *								-	{String}	type [required] [one of PROFILE_TYPES]
	 *	@return {Object} paramObject.profile -	the transformed and ready for use profile object
	 */
	function transformDataForUsage(paramObject) {
		if (!(paramObject && paramObject.profile && paramObject.type && !!(PROFILE_TYPES[paramObject.type.toUpperCase()]))) throw new Error('Insufficient paramObject to transform input data correctly.');
		paramObject.type = paramObject.type.toUpperCase();

		// common for all types
		fillWebs(paramObject.profile);

		// type-specific
		switch (paramObject.type) {
			case PROFILE_TYPES.USER:
				// nothing yet ..
				break;

			case PROFILE_TYPES.COMMUNITY:
				// nothing yet ..
				break;
		}

		return paramObject.profile;
	}

	/**
	 *	Function that takes the profile and its type and processes all necessary transforms on it
	 *	so that it can be successfully saved to server.
	 *
	 *	@param {Object} paramObject	-	{Object}	profile [required] the object to be transformed
	 *								-	{String}	type [required] [one of PROFILE_TYPES]
	 *	@return {Object} paramObject.profile -	the transformed and ready for saving profile object
	 */
	function transformDataForSaving(paramObject) {
		if (!(paramObject && paramObject.profile && paramObject.type && !!(PROFILE_TYPES[paramObject.type.toUpperCase()]))) throw new Error('Insufficient paramObject to transform input data correctly.');
		paramObject.type = paramObject.type.toUpperCase();

		return paramObject.profile;
	}

	// SETUP
	var MAX_MOTTO_LENGTH = MottoLength;

	// FUNCTIONS
	function copyMottoIfNecessary(profile) {
		if (!profile.motto) {
			profile.motto = profile.about || profile.description || '';
			if (profile.motto.length > (MAX_MOTTO_LENGTH)) profile.motto = profile.motto.slice(0, MAX_MOTTO_LENGTH - 3) + '...';
		}
		return profile;
	}

	/**
	 *	@param {Object} entity - the object containing a locations prop to be transformed
	 *	@param {Boolean} fromJson - if true, extracts locations from json_data prop,
	 *		creates and fills the json_data prop otherwise
	 *	@param {Object} opts - {string} prop - property on which to search for locations prop
	 *	@return {Object} transformed entity object
	 */
	function locationJsonHelper(entity, fromJson, opts) {
		if (fromJson && ((typeof entity).toLowerCase() === 'string')) entity = $window.JSON.parse(entity);
		var entityDummy = [entity];
		opts = opts || {};
		if (opts.prop) entityDummy = entity[opts.prop];
		for (var q = entityDummy.length; q--;) {
			if (!(entityDummy[q].locations && entityDummy[q].locations.length)) entityDummy[q].locations = [];
			for (var i = entityDummy[q].locations.length; i--;) {
				entityDummy[q].locations[i] = (fromJson ? entityDummy[q].locations[i].json_data : {
					json_data: (entityDummy[q].locations[i].address_components ? entityDummy[q].locations[i] : {
						place_id: entityDummy[q].locations[i].place_id
					})
				});
			}
		}
		if (!fromJson && ((typeof entity).toLowerCase() === 'object')) entity = $window.JSON.stringify(entity);

		return entity;
	}

	function getLocationJson(entity) {
		return locationJsonHelper(entity, true, this);
	}

	function insertLocationJson(entity) {
		return locationJsonHelper(entity, false, this);
	}

	function fillWebs(profile) {
		if (!profile.webs || !profile.webs.length) profile.webs = [''];
		return profile;
	}

	function splitInterests(profile) {
		profile.interests = (profile.interests ? profile.interests.split(',') : []);
		return profile;
	}

	function joinInterests(profile) {
		// check the structure
		profile.interests = profile.interests || [];
		for (var i = profile.interests.length; i--;) {
			if (profile.interests[i].text) profile.interests[i] = profile.interests[i].text;
		}
		// profile.interests = profile.interests.join(',');
		return profile;
	}

	// FUNCTION EXPOSITION
	factory.transformDataForUsage = transformDataForUsage;
	factory.transformDataForSaving = transformDataForSaving;
	factory.single = {
		copyMottoIfNecessary: copyMottoIfNecessary,
		insertLocationJson: insertLocationJson,
		fillWebs: fillWebs,
		getLocationJson: getLocationJson,
		joinInterests: joinInterests,
		splitInterests: splitInterests
	};
	factory.params = {
		PROFILE_TYPES: PROFILE_TYPES,
		MAX_MOTTO_LENGTH: MAX_MOTTO_LENGTH
	};

	// RETURN
	return factory;
}]);