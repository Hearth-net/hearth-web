;(function(window, config) {
	'use strict'

	var request = window.aeg.request,
		$ = window.aeg.$,
		fe = window.aeg.fe,
		formatDate = window.aeg.formatDate;

	var posts = [],
		postsSectionWrapperSelector = '[blog-post-section-wrapper]',
		postsElementWrapperSelector = '[blog-posts-wrapper]',
		postsElementWrapper = $(postsElementWrapperSelector);

	// If posts element wrapper is not present on the page, kill all blog posts processing
	if (postsElementWrapper && postsElementWrapper.length) {
		postsElementWrapper = postsElementWrapper[0];
	} else {
		return false;
	}

	var req = request('GET', 'https://blog.hearth.net/feed/');
	req.onload = function(data) {
		if (req.status === 200) {
			posts = req.responseText;
			// console.log('BLOG POSTS: ', posts);
			fillBlogPosts({posts: posts, limit: config.blogPostLimit});
		} else {
			blogPostsError(req);
		}
	}
	req.send();

	/**
	 *	- {String} posts - the string that comes from the server
	 *	- {Int} limit - the limit of posts to show
	 */
	function fillBlogPosts(params) {
		params = params || {};
		if (!(params.posts && params.posts.length)) return false;

		var parser = new DOMParser();
		var postsFragment = parser.parseFromString(params.posts, 'text/xml');

		var posts = postsFragment.querySelectorAll('item');

		if (!posts.length) return blogPostsError();

		if (posts.length < config.blogPostLimit) params.limit = posts.length;
		for (var i = 0;i < params.limit;i++) {
			appendBlogPost({post: posts[i]});
		}
	}

	function appendBlogPost(params) {
		if (!(params && params.post)) throw new TypeError('Trying to append an undefined blog post.');

		var standaradizedPost = document.createElement('div');
		standaradizedPost.className = 'flex-div flex-1 blog-block';

		var title = params.post.querySelector('title'),
			link = params.post.querySelector('link'),
			text = params.post.querySelector('description'),
			pubDate = params.post.querySelector('pubDate');

		var formattedPubDate = formatDate(new Date(pubDate.innerHTML));

		standaradizedPost.innerHTML = ""
			// + "<div class='blog-img-wrapper'><div class='blog-img' id='image-blog-1'></div></div>"
			+ (formattedPubDate ? '<div class="text-muted">' + formattedPubDate + '</div>' : '')
			+ (title && title.innerHTML ? '<h3>' + title.innerHTML + '</h3>' : '')
			+ (text && text.innerHTML ? '<p>' + text.innerHTML.replace('<![CDATA[', '').replace(']]>', '') + '</p>' : '')
			+ (link && link.childNodes.length ? '<a target="_blank" href="' + link.childNodes[0].nodeValue + '" class="display-block margin-top-medium color-primary">Přečíst na blogu</a>' : '');

		postsElementWrapper.appendChild(standaradizedPost);
	}

	function blogPostsError(req) {
		console.log('Blog posts request failed.' + (req ? ' Returned status of ' + req.status : ''));

		// hide the whole blog posts wrapper
		fe($(postsSectionWrapperSelector), function(el) { el.style.display = 'none'; });
	}

})(window, window.hearthConfig);