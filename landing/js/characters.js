;(function(window, config) {
	'use strict';

	const requestApi = window.aeg.requestApi;
	const $ = window.aeg.$;
	const fe = window.aeg.fe;
  const apiPath = config.apiPath;

  const CHAR_FILL = 'character-fill';
  const CHARACTER_FILL_SELECTOR = '[' + CHAR_FILL + ']';
	const CHARACTER_LINK_SELECTOR = '[character-link]';

  const NUMBER_OF_GIFTS_TRANSLATION_SELECTOR = 'translation[rel="NUMBER_OF_GIFTS"]';
  const NUMBER_VARIABLE = '%count%';
  const NUMBER_OF_GIFTS_TRANSLATION = $(NUMBER_OF_GIFTS_TRANSLATION_SELECTOR)[0].innerHTML;
  const ACCEPTABILITY_THRESHOLD = 10;

	var linksUpdated = false;

  // expose fn so that it can be called
  window.marketplaceMasonryInit = init;

  function init({ additionalParams } = {}) {
		// insert post counts into buttons
    fe($(CHARACTER_FILL_SELECTOR), item => {
      const character = item.getAttribute(CHAR_FILL);
      const req = requestApi('GET', apiPath + '/search?counters=true&type=post&character=' + character + (additionalParams ? '&' + additionalParams : ''));
  		req.onload = function() {
        if (req.status === 200) {
          const res = JSON.parse(req.responseText);
          if (!(res && res.counters && res.counters.post)) return console.warn('Failed to load post counters');
          
          // only replace if the number is high enough so that it doesn't discourage users
          if (res.counters.post > ACCEPTABILITY_THRESHOLD) {
						item.innerHTML = NUMBER_OF_GIFTS_TRANSLATION.replace(NUMBER_VARIABLE, res.counters.post);

            updateLinks(additionalParams);
					}
        } else {
          console.error('Failed to fetch item counts for character "' + character + '"');
        }
      }
      req.send();
    });
  }

	// update links with additional params
	function updateLinks(additionalParams) {
		if (linksUpdated || !additionalParams) return false;
		linksUpdated = true;
		fe($(CHARACTER_LINK_SELECTOR), link => {
			// the expectation is that there already is a '?' char in the link
			link.setAttribute('href', link.getAttribute('href') + '&' + additionalParams);
		});
	}

})(window, window.hearthConfig);