'use strict';

/**
 * @ngdoc service
 * @name hearth.services.ConversationAux
 * @description functions and cache for conversations
 */

angular.module('hearth.services').factory('ConversationAux', ['$q', 'Conversations', '$location', 'ActionCableSocketWrangler', 'ActionCableChannel', '$injector', '$rootScope', '$state', 'Messenger', '$timeout', function($q, Conversations, $location, ActionCableSocketWrangler, ActionCableChannel, $injector, $rootScope, $state, Messenger, $timeout) {

	var inited
	var processingRunning

	const ACTION_NEW_CONVERSATION = 'created'
	const ACTION_NEW_MESSAGE = 'created'
	const ACTION_CONVERSATION_READ = 'read'
	const ACTION_CONVERSATION_UNREAD = 'unread'
	const ACTION_CONVERSATION_ARCHIVED = 'archived'
	const ACTION_CONVERSATION_DELETED = 'deleted'

	const MESSAGE_LIMIT = 15

	// list of conversations shown in the conversations column
	const conversationList = []

	const conversationGetLimit = 8
	var conversationListLoading
	var conversationListLoaded
	var conversationFilter = {}
	var conversationGetBuffer = []
	var socketReinitCounter = 0

	// TODO delete later
	var convListErrorThrowed

	var FILTER_ARCHIVE = 'archived'

	const factory = {
		addConversationToList,
		addConversationParticipants,
		deserializeConversation,
		init,
		getFirstConversationIdIfAny,
		getLastMessageTime,
		handleEvent,
		loadConversation,
		loadConversationMessages,
		loadConversations,
		MESSAGE_LIMIT,
		removeConversationFromList
	}

	return factory

	///////////////

	/**
	 *	Function that starts the socket and optionally enables further processing of socket events
	 *	This is to prevent the loading of conversations etc prior to first visiting the conversations screen, i.e. running MessagesCtrl
	 *
	 *	In orderUser has to be logged in prior to calling this
	 *
	 *	- {Boolean} enableProcessing - value telling whether or not to enable processing of socket events
	 */
	function init(paramObject = {}) {
		var token = {
			token: $.cookie('authToken')
		}
		if (token.token) {
			// optionally enable processing of socket events
			if (paramObject.enableProcessing) processingRunning = true

			// only ever create socket connection once
			if (inited) return true
			inited = true

			var consumer = new ActionCableChannel('MessagesChannel', token)
			consumer.subscribe(handleEvent)

			// ActionCableSocketWrangler doesn't expose $websocket onOpen and onClose callbacks,
			// so we set up a watch on its states to achieve the same thing .. less efficiently
			$rootScope.$watch(function() {
				return ActionCableSocketWrangler.connecting
			}, function(newValue, oldValue) {
				if (newValue === false && !ActionCableSocketWrangler.disconnected) {
					// Here the define the logic that should happen after losing the socket connection
					// and starting it up again - i.e. we should try to get information that we might
					// have missed during our time offline
					socketReinitCounter++
					if (socketReinitCounter > 1) reinitMessaging()
				}
			})

			return true
		}
		return false
	}

	/**
	 *	@param {Object} socketEvent - event coming from socket with one the following actions:
	 *		- archived, deleted, created, read, unread
	 */
	function handleEvent(socketEvent) {
		if (typeof socketEvent == 'undefined') return Messenger.setUnreadCount(0);
		if (socketEvent.unread !== void 0) Messenger.setUnreadCount(socketEvent.unread);

		if (!processingRunning) return void 0

		switch (socketEvent.action) {
			case ACTION_NEW_CONVERSATION:
			case ACTION_NEW_MESSAGE:
				return handleNewConversationOrMessage(socketEvent)
			case ACTION_CONVERSATION_READ:
				return handleConversationReadStatus(socketEvent, true)
			case ACTION_CONVERSATION_UNREAD:
				return handleConversationReadStatus(socketEvent, false)
			case ACTION_CONVERSATION_ARCHIVED:
				return handleConversationArchived(socketEvent)
			case ACTION_CONVERSATION_DELETED:
				return handleConversationDeleted(socketEvent)
		}
	}

	function handleNewConversationOrMessage(socketEvent) {
		if (socketEvent.conversation && socketEvent.conversation.last_message) {
			if (socketEvent.conversation.last_message.first_message) {
				// check if not a duplicate conversation, i. e. new conversation created by myself
				for (var i = 0, l = conversationList.length; i < l; i++) {
					if (conversationList[i]._id === socketEvent.conversation._id) return false
				}

				$timeout(() => $rootScope.$emit('newConversationAdded', socketEvent.conversation))
				deserializeConversation(socketEvent.conversation)
				return conversationList.unshift(socketEvent.conversation)
			} else {
				var conv
				var isSystemMessageConcerningMyOwnAction = (socketEvent.conversation.last_message.system_data && socketEvent.conversation.last_message.system_data.target && socketEvent.conversation.last_message.system_data.target._id == $rootScope.loggedUser._id)
				for (var i = conversationList.length; i--;) {
					if (conversationList[i]._id === socketEvent.conversation._id) {
						conv = conversationList.splice(i, 1)[0]
						// update the required properties
						if (socketEvent.conversation.last_message && !socketEvent.conversation.last_message.verb) conv.last_message = socketEvent.conversation.last_message
						conv.read = socketEvent.conversation.read
						conv.participants = socketEvent.conversation.participants
						conv.participants_count = socketEvent.conversation.participants_count
						// if the found conversation already has 'messages' prop, append the new message to it
						if (conv.messages && conv.messages.length) {
							// before pushing to messages array check for possible duplicates if the message is from my precious self
							var allowPush = true
							if (socketEvent.conversation.last_message.author && (socketEvent.conversation.last_message.author._id === $rootScope.loggedUser._id || socketEvent.conversation.last_message.author._type === 'Community')) {
								for (var i = conv.messages.length; i--;) {
									if (conv.messages[i]._id === socketEvent.conversation.last_message._id) {
										allowPush = false
										break
									}
								}
							}
							if (allowPush) {
								conv.messages.push(socketEvent.conversation.last_message)
								$rootScope.$emit('messageAddedToConversation', {conversation: conv})
							}
						}
						break
					}
				}
				if (isSystemMessageConcerningMyOwnAction) return true
				if (conv) return conversationList.unshift(conv)
			}
		}
	}

	function handleConversationReadStatus(socketEvent, readStatus) {
		if (socketEvent.conversation) {
			for (var i = 0, l = conversationList.length; i < l; i++) {
				if (conversationList[i]._id === socketEvent.conversation._id) return conversationList[i].read = readStatus
			}
		}
		return false
	}

	function handleConversationArchived(socketEvent) {
		if (socketEvent.conversation) {
			if (conversationFilter.current === FILTER_ARCHIVE) {
				return addConversationToList({
					conversation: socketEvent.conversation,
					index: 0
				})
			}
			return removeConversationFromList(socketEvent.conversation._id)
		}
		return false
	}

	function handleConversationDeleted(socketEvent) {
		return removeConversationFromList(socketEvent.conversation._id)
	}

	/**
	 *	adds conversation title, maxAvatarCount, titlePersons and titleDetail
	 */
	function deserializeConversation(conversation) {
		if (conversation && conversation._id) {
			conversation.maxAvatarCount = (conversation.participants_count > 4) ? 3 : 4 // print 4 avatars max or only 3 avatars and 4th will be +X counter
			// if it is post reply conversation, add post type
			if (!conversation.title && conversation.post && conversation.post.title) {
				conversation.title = conversation.post.title
        conversation.post.type_code = $injector.get('PostAux').getPostTypeCode(conversation.post.author_type, conversation.post.type, conversation.post.exact_type)
			}
			// if there is no title, build it from its first at most 3 participants
			if (conversation.participants.length) {
				conversation.titlePersons = []
				for (var i = 0; i < 2 && i < conversation.participants.length; i++) {
					conversation.titlePersons.push(conversation.participants[i].name)
				}
				conversation.titlePersons = conversation.titlePersons.join(', ')
			}
			conversation.titleDetail = conversation.title || conversation.titlePersons
		}
		return conversation
	}

	/**
	 *	- {Object} conversation - conversation to add to the list
	 *	- {Int} index - the index to which to add the conversation
	 *	@return index to which the conversation has been added or false if not added
	 */
	function addConversationToList(paramObject) {
		if (!paramObject.conversation) return false
		// check if not a duplicate conversation, i. e. new conversation created by myself
		for (var i = 0, l = conversationList.length; i < l; i++) {
			if (conversationList[i]._id === paramObject.conversation._id) return false
		}

		deserializeConversation(paramObject.conversation)
		if (paramObject.index > conversationList.length) paramObject.index = conversationList.length
		conversationList.splice(paramObject.index, 0, paramObject.conversation)
		return paramObject.index
	}

	/**
	 *	- {Object} conversation - the conversation to which to add participants
	 *	@return {Promise} resolves into conversation enhanced with its participants
	 */
	function addConversationParticipants(paramObject = {}) {
		if (!paramObject.conversation) throw new Error('Conversation required for adding participants')
		return $q(function(resolve, reject) {
			Conversations.getParticipants({
				id: paramObject.conversation._id
			}, res => {
				paramObject.conversation.allParticipants = res.participants
				resolve(paramObject.conversation)
			}, reject)
		})
	}

	function getLastMessageTime(conversation) {
		if (!conversation) throw new TypeError('Conversation must be an object')
		if (!conversation.messages || !conversation.messages.length) return conversation.last_message.created_at
		return conversation.messages[conversation.messages.length - 1].created_at
	}

	/**
	 *	Function to be run after retrieving fallen socket connection
	 */
	function reinitMessaging() {
		// First reload the conversation list. Then check all conversations '.message' with the last
		// message in '.messages' and if it doesn't match, delete the '.messages' prop
		// TODO: change deleting for some flag
		loadConversations({
			socketReinit: true
		})
	}

	/**
	 *	@param {Int} conversationId
	 *	@param {Object} paramObject	- {Boolean} redirectIfActiveWindow
	 *	@return {Object}	- {Array} removed - the removed conversation
	 *						- {Int} index - the index from which the conversation has been removed
	 */
	function removeConversationFromList(conversationId, paramObject) {
		if (paramObject) {
			if (paramObject.redirectIfActiveWindow) {
				// wait a cycle so that the conversation is really removed before taking any action
				$timeout(() => $rootScope.$broadcast('conversationRemoved', {id: conversationId}))
			}
		}
		for (var i = conversationList.length; i--;) {
			if (conversationList[i]._id === conversationId) return {
				removed: conversationList.splice(i, 1),
				index: i
			}
		}

		return {
			removed: [],
			index: void 0
		}
	}

	/**
	 *	@param {Int} id [optional] - id of the conversation to resolve, or first conversation found
	 *	@return $q promise - resolves into conversation if found (locally or remote), else rejects
	 */
	function loadConversation(id) {
		return $q((resolve, reject) => {
			if (!id) return resolve(conversationListLoaded && conversationList.length ? conversationList[0] : false)
			for (var i = 0, l = conversationList.length; i < l; i++) {
				if (conversationList[i]._id === id) {
					if (conversationList[i].messages && conversationList[i].messages.length) {
						return resolve(conversationList[i])
					} else {
						return loadConversationMessages({
							conversation: conversationList[i]
						}).then(resolve)
					}
				}
			}
			Conversations.get({
				id: id
			}, conversation => {
				loadConversationMessages({
					conversation: conversation
				}).then(conversation => {
					resolve(conversation)
				})
			}, reject)
		})
	}

	/**
	 *	Function that either fetches new conversation messages for given conversationId and resolves messages Array
	 *	OR is given a conversation object and extends it with conversation messages on property 'messages'
	 *
	 *	- {Int} conversationId [required (if not 'conversation')]
	 *	- {Object} conversation [required (if not 'conversationId')] (has to have property '_id')
	 *	- {Boolean} prepend [default = false] i.e. append by default (only applicable if conversation object supplied)
	 *	- {Object} params - parametres for $resource.getMessages call
	 *	@return {$q Promise} that resolves into [array of messages || conversation extended with property 'messages']
	 */
	function loadConversationMessages(paramObject = {}) {
		// only add limit if we don't fetch newer messages
		var defaults = {}
		paramObject.params = paramObject.params || {}
		if (!paramObject.params.newer) defaults.limit = MESSAGE_LIMIT
		var params = angular.extend(paramObject.params, defaults)
		return $q((resolve, reject) => {
			if (paramObject.conversationId) {
				params.id = paramObject.conversationId
			} else if (paramObject.conversation && paramObject.conversation._id) {
				params.id = paramObject.conversation._id
			} else {
				// if no conversation ID specified, do not proceed further
				console.error('THIS SHOULD NOT BE CALLED LIKE THIS!')
				return resolve(false)
			}
			Conversations.getMessages(params, res => {
				var result
				if (paramObject.conversationId) {
					result = res.messages
				} else {
					result = paramObject.conversation
					if (!(result.messages && result.messages.length)) {
						result.messages = res.messages
					} else {
						Array.prototype[paramObject.prepend ? 'unshift' : 'push'].apply(result.messages, res.messages)
					}
				}
				if (!paramObject.prepend && paramObject.conversation) updateConversationInfo(paramObject)
				resolve(result)
			}, reject)
		})
	}

	/**
	 *	Returns last conversation message that is not system-message
	 *	- {Object} conversation - has to have property 'messages' with at least one message
	 *	@return {Object} message || false
	 */
	function getLastUserMessage(paramObject = {}) {
		if (!(paramObject.conversation && paramObject.conversation.messages && paramObject.conversation.messages.length)) return false
		for (var i = paramObject.conversation.messages.length - 1; i >= 0; i--) {
			if (paramObject.conversation.messages[i].author) return paramObject.conversation.messages[i]
		}
		return false
	}

	/**
	 *	Updates last conversation text
	 *	- {Object} conversation - has to have property 'messages' with at least one message
	 */
	function updateConversationInfo(paramObject = {}) {
		if (!(paramObject.conversation && paramObject.conversation.messages && paramObject.conversation.messages.length)) return false
		var lastMessage = getLastUserMessage(paramObject)
		if (lastMessage) paramObject.conversation.message = lastMessage
	}

	/**
	 *	- {Boolean} wipe [optional] - remove all items from the conversation list before adding new
	 *	- {Boolean} socketReinit [optional] - if true, removes the '.messages' prop if last message_id
	 *											doesn't match the '.message' message_id. If there are any convevrsations
	 *	- {Int} limit [optional] - how many should be fetched
	 *	- {Int} offset [optional] - how many should be skipped
	 *	- {String} filterType [optional] - filter - type
	 *	- {String} post_id [optional] - filter - only conversations about a specific marketplace post
	 *	- {Boolean} prepend [optional] - if TRUE - the fetched conversations shall be prepended to the list, instead of appending
	 *
	 *	@return {Promise} resolves into {conversations: Array, thatsAllFolks: Boolean}
	 */
	function loadConversations(paramObject = {}) {
		return $q(function(resolve, reject) {

			if (conversationListLoading) return conversationGetBuffer.push([resolve, reject])

			conversationListLoading = true
			var limit = (paramObject.socketReinit && conversationList.length ? conversationList.length : (paramObject.limit || conversationGetLimit))
			var params = {
				limit: limit,
				offset: paramObject.offset || 0
			}
			if (paramObject.filterType) {
				params[paramObject.filterType] = true
				conversationFilter.current = paramObject.filterType
			}
			if (paramObject.post_id) params.post_id = paramObject.post_id
			if (paramObject.community_id) params.community_id = paramObject.community_id
			Conversations.get(params, res => {
				conversationListLoading = false
				conversationListLoaded = true
				if (!res.conversations) return reject(false)
				var conversationsCount = res.conversations.length

				// either clean up the conversation list
				// or run the socketReinit procedure
				// or remove possible duplicates
				if (paramObject.wipe) {
					conversationList.length = 0
				} else if (paramObject.socketReinit) {
					socketReinitProcedure(res)
				} else {
					removeDuplicates({
						source: conversationList,
						target: res.conversations,
						comparator: '_id'
					})
				}
				if (!paramObject.socketReinit) conversationList[paramObject.prepend ? 'unshift' : 'push'].apply(conversationList, res.conversations)

				for (var i = conversationGetBuffer.length; i--;) {
					conversationGetBuffer[i][0]({
						conversations: conversationList,
						thatsAllFolks: conversationsCount < limit
					})
				}

				$rootScope.$emit('conversationListChanged', { conversationList })

				return resolve({
					conversations: conversationList,
					thatsAllFolks: conversationsCount < limit
				})
			}, err => {
				for (var i = conversationGetBuffer.length; i--;) {
					conversationGetBuffer[i][1](err)
				}
				return reject(err)
			})
		})
	}

	/**
	 *	@param {Object} res - resolve of request for new conversation list
	 */
	function socketReinitProcedure(res) {
		var dict = {}
		for (var i = res.conversations.length; i--;) {
			dict[res.conversations[i]._id] = res.conversations[i]
		}
		for (var i = conversationList.length; i--;) {
			// mark the exising conversations with a flag so that we can prepend the nonexistant ones to the conversationList later
			if (dict[conversationList[i]._id]) dict[conversationList[i]._id].alreadyPresent = true

			// take care of non-up-to-date conversations
			if (conversationList[i].messages && dict[conversationList[i]._id] && conversationList[i].messages[conversationList[i].messages.length - 1]._id !== dict[conversationList[i]._id].last_message._id) {
				// TODO this hack can be removed with the introduction of flag instead of plain .messages deletion
				// It basically just checks that we dont delete the conversation that we have opened
				if ($state.params.id === conversationList[i]._id) {
					loadConversationMessages({
						conversation: conversationList[i],
						params: {
							newer: getLastMessageTime(conversationList[i])
						}
					}).then(conversation => {
						$rootScope.$emit('messageAddedToConversation', { conversation })
					})
				} else {
					delete conversationList[i].messages
				}
			}
		}
		// prepend conversations that are not yet in the list, i.e. new conversations
		for (var i = res.conversations.length; i--;) {
			if (!res.conversations[i].alreadyPresent) conversationList.unshift(res.conversations[i])
		}
	}

	/**
	 *	Strips 'target' of items existing in 'source'.
	 *	Decision of existence is based on the given comparator (=property name)
	 *
	 *	- {Array} source
	 *	- {Array} target
	 *	- {String} comparator
	 *	@return void 0
	 */
	function removeDuplicates(paramObject) {
		var map = {}
		// create map
		for (var i = paramObject.source.length; i--;) {
			map[paramObject.source[i][paramObject.comparator]] = true
		}
		// remove existing entries from target
		for (var i = paramObject.target.length; i--;) {
			if (map[paramObject.target[i][paramObject.comparator]]) paramObject.target.splice(i, 1)
		}
		return
	}

	function getFirstConversationIdIfAny() {
		checkConversationListValidity(conversationList)
		if (conversationList && conversationList.length) {
			for (var i = 0, l = conversationList.length; i < l; i++) {
				if (conversationList[i] && conversationList[i]._id) return conversationList[i]._id
			}
		}
		return ''
	}

	function checkConversationListValidity(list) {
		if (convListErrorThrowed) return
		var listCopy = JSON.parse(JSON.stringify(list))
		if (listCopy && listCopy.length && !listCopy[0]) {
			convListErrorThrowed = true
			throw new Error('conversationList contents are invalid. Contents: "' + JSON.stringify(list) + '".')
		}
	}

}])