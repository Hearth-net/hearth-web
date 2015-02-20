var $$config;

$$config = {
	apiPath: '/api',
	fbAppId: '1495788017321716', // dev
	modalTemplates: 'templates/modal/',
	templates: 'templates/',
	lengthUnit: 'km',
	defaultLanguage: 'cs',
	defaultUserAvatar: 'images/no-avatar.jpg',
	defaultCommunityAvatar: 'images/no-cm-avatar.jpg',
	sharingEndpoints: {
		facebook: 'https://www.facebook.com/sharer/sharer.php?u=',
		gplus: 'https://plus.google.com/share?url=',
		twitter: 'https://twitter.com/share?url=',
		linkedin: 'http://www.linkedin.com/shareArticle?mini=true&url='
	},
	activitiesIcons: {
		// : "edit_post.png",
		// : "new_post.png",
		// : "new_reply.png",
		// : "resume_post.png",
	},
	features: {
		aboutPage: false,
		searchImage: false,
		german: false,
		follow: true,
		myHearth: true,
		myHearthSearch: true,
		searchTypeahead: true,
		deleteAccount: true,
		uploadFiles: false,
		newCreateEditForm: false
	}
};

// copy data from localConfig
if($$localConfig) {
	for(var key in $$localConfig) $$config[key]=$$localConfig[key];
}
