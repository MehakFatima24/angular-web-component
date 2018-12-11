(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
$( document ).ready(function() {
    console.log( "ready!" );
    const Ventana = require('@sugarcrm/ventana');
    const SugarApi = Ventana.getInstance({
        serverUrl: 'https://staging.rtlabs.co.uk:44375/rest/v11_1',
        platform: 'portal',
        clientID: 'sugar',
    });
    // console.log(SugarApi.getMetadata());
   var cred =
    // Fetch `Accounts` records
    console.log(SugarApi.login({
      username: "admin",
      password: "admin"
    }));

});

},{"@sugarcrm/ventana":2}],2:[function(require,module,exports){
/*
 * Copyright (c) 2017 SugarCRM Inc. Licensed by SugarCRM under the Apache 2.0 license.
 */

var _instance;
var _methodsToRequest = {
        'read': 'GET',
        'update': 'PUT',
        'create': 'POST',
        'delete': 'DELETE'
    };
var _baseActions = ['read', 'update', 'create', 'delete'];
var _refreshTokenSuccess = function(c) {c();};
var _bulkQueues = { };
var _state = { };
var underscore = require('underscore');
/**
 * Represents AJAX error.
 *
 * See Jquery/Zepto documentation for details.
 * @see  http://api.jquery.com/jQuery.ajax/
 * @see  http://zeptojs.com/#$.ajax
 *
 * @class HttpError
 */
var HttpError = function(request, textStatus, errorThrown) {

    request = request || {};
    request.xhr = request.xhr || {};

    /**
     * AJAX request that caused the error.
     *
     * @member {HttpError} request
     * @memberof HttpError
     * @instance
     */
    this.request = request;

    /**
     * XHR status code.
     *
     * @member {string} status
     * @memberof HttpError
     * @instance
     */
    this.status = request.xhr.status;

    /**
     * XHR response text.
     *
     * @member {string} responseText
     * @memberof HttpError
     * @instance
     */
    this.responseText = request.xhr.responseText;

    /**
     * String describing the type of error that occurred.
     *
     * Possible values (besides null) are `"timeout"`, `"error"`, `"abort"`, and
     *   `"parsererror"`.
     * @member {string} textStatus
     * @memberof HttpError
     * @instance
     */
    this.textStatus = textStatus;

    /**
     * Textual portion of the HTTP status when HTTP error occurs.
     *
     * For example, `"Not Found"` or `"Internal Server Error"`.
     * @member {string} errorThrown
     * @memberof HttpError
     * @instance
     */
    this.errorThrown = errorThrown;

    // The response will not be always a JSON string

    if (typeof(this.responseText) === 'string' && this.responseText.length > 0) {
        try {
            var contentType = this.request.xhr.getResponseHeader('Content-Type');
            if (contentType && (contentType.indexOf('application/json') === 0)) {
                this.payload = JSON.parse(this.responseText);
                /**
                 * Error code.
                 *
                 * Additional failure information. See SugarCRM REST API
                 * documentation for a full list of error codes.
                 * @member {string} code
                 * @memberof HttpError
                 * @instance
                 */
                this.code = this.payload.error;

                /**
                 * Error message.
                 *
                 * Localized message appropriate for display to end user.
                 * @member {string} message
                 * @memberof HttpError
                 * @instance
                 */
                this.message = this.payload.error_message;
            }
        }
        catch (e) {
            // Ignore this error
        }
    }
};

underscore.extend(HttpError.prototype, {

    /**
     * Returns string representation of HTTP error.
     *
     * @return {string} HTTP error as a string.
     * @memberof HttpError
     * @instance
     */
    toString: function() {
        return 'HTTP error: ' + this.status +
            '\ntype: ' + this.textStatus +
            '\nerror: ' + this.errorThrown +
            '\nresponse: ' + this.responseText +
            '\ncode: ' + this.code +
            '\nmessage: ' + this.message;
    }

});

/**
 * Represents AJAX request.
 *
 * Encapsulates XHR object and AJAX parameters.
 *
 * @class HttpRequest
 */
var HttpRequest = function(params, debug) {
    /**
     * Request parameters.
     *
     * See Jquery/Zepto documentation for details.
     *
     * - http://api.jquery.com/jQuery.ajax/
     * - http://zeptojs.com/#$.ajax
     *
     * @member {Object} params
     * @memberof HttpRequest
     * @instance
     */
    this.params = params; // TODO: Consider cloning

    /**
     * Flag indicating that a request must output debug information.
     *
     * @member {boolean} debug
     * @memberof HttpRequest
     * @instance
     */
    this.debug = debug;

    /**
     * The state object is used to store global enviroment conditions that may
     * be relevant when processing this request but would not be passed to the
     * server.
     *
     * @member {Object} state
     * @memberof HttpRequest
     * @instance
     */
    this.state = {};
};

underscore.extend(HttpRequest.prototype, {

    /**
     * Executes AJAX request.
     *
     * @param {string} token OAuth token. Must not be supplied for login
     *   type requests.
     * @param {string} mdHash current private metadata hash, used to
     *   validate the client metadata against the server.
     * @param {string} upHash Current User preferences hash, used to
     *   validate the client user pref data against the server.
     * @memberof HttpRequest
     * @instance
     */
    execute: function(token, mdHash, upHash) {
        if (token) {
            this.params.headers = this.params.headers || {};
            this.params.headers['OAuth-Token'] = token;
        }
        if (mdHash) {
            this.params.headers = this.params.headers || {};
            this.params.headers['X-Metadata-Hash'] = mdHash;
        }
        if (upHash) {
            this.params.headers = this.params.headers || {};
            this.params.headers['X-Userpref-Hash'] = upHash;
        }

        //The state object is used to store global enviroment conditions that may be relevent
        //when processing this request but would not be passed to the server.
        this.state = underscore.extend(this.state, _state);

        if (this.debug) {
            console.log('====== Ajax Request Begin ======');
            console.log(this.params.type + ' ' + this.params.url);
            var parsedData = this.params.data ? JSON.parse(this.params.data) : null;
            if (parsedData && parsedData.password) parsedData.password = '***';
            console.log('Payload: ', this.params.data ? parsedData : 'N/A');
            var p = $.extend({}, this.params);
            delete p.data;
            console.log('params: ', p);
            console.log('====== Request End ======');
        }

        /**
         * XmlHttpRequest object.
         *
         * @member {XMLHttpRequest} xhr
         * @memberof HttpRequest
         * @instance
         */
        this.xhr = $.ajax(this.params);
    }
});

/**
 * Fake jqXHR object because bulk calls do not have their own individual XHR
 * requests.
 *
 * @param {object} result object returned from the BulkAPI
 * @param {string|number} [result.status=200] The response status.
 * @param {Object} [result.status=200] The response headers.
 * @param {Object} [result.contents={}] The response contents.
 * @param {HttpRequest} parentReq bulk API request that this request is a part of.
 */
var bulkXHR = function(result, parentReq) {
    var contents = result.contents || {};

    this.status = result.status || 200;
    this.statusText = result.status_text || '';
    this.responseText = underscore.isObject(contents) ? JSON.stringify(contents) : contents;
    this.readyState = 4;
    this._parent = parentReq.xhr;
    this.headers = result.headers;
};

underscore.extend(bulkXHR.prototype, {
    isResolved: function() {
        return this._parent.isResolved();
    },
    getResponseHeader: function(h) {
        return this.headers[h];
    },
    getAllResponseHeaders: function() {
        return underscore.reduce(this.headers, function(str, value, key) {
            return str.concat(key + ': ' + value + '\n');
        }, '');
    }
});

/**
 * The SugarCRM JavaScript API allows users to interact with SugarCRM instance
 * via its REST interface.
 *
 * Most Sugar API methods accept `callbacks` object:
 * ```
 * {
 *     success: function(data) {},
 *     error: function(error) {},
 *     complete: function() {},
 * }
 * ```
 *
 * @param {Object} args The configuration parameters for the instance.
 * @param {string} [args.serverUrl='/rest/v10'] Sugar REST URL end-point.
 * @param {string} [args.platform=''] Platform name ("portal", "mobile", etc.).
 * @param {Object} [args.keyValueStore] Reference to key/value store provider used
 *   to read/save auth token from/to. It must implement three methods:
 *   ```
 *   set: void function(String key, String value)
 *   get: String function(key)
 *   cut: void function(String key)
 *   ```
 *   The authentication tokens are kept in memory if the key/value store is not
 *   specified.
 * @param {number} [args.timeout] Request timeout in seconds.
 * @param {Function} [args.defaultErrorHandler] The default error handler.
 * @param {string} [args.clientID='sugar'] The clientID for oAuth.
 * @param {boolean} [args.disableBulkApi]
 * @param {Function} [args.externalLoginUICallback] The callback to be called if
 *  external login is activated.
 *
 * @class Api
 */
function SugarApi(args) {
    var _serverUrl,
        _platform,
        _keyValueStore,
        _clientID,
        _timeout,
        _refreshingToken,
        _defaultErrorHandler,
        _externalLogin,
        _allowBulk,
        _externalLoginUICallback = null,
        _accessToken = null,
        _refreshToken = null,
        _downloadToken = null,
        // request queue
        // used to support multiple request while in refresh token loop
        _rqueue = [],
        // dictionary of currently executed requests (keys are IDs)
        _requests = {},
        // request unique ID (counter)
        _ruid = 0;

    // if no key/value store is provided, the auth token is kept in memory
    _keyValueStore = args && args.keyValueStore;
    _serverUrl = (args && args.serverUrl) || '/rest/v10';
    // there will only be a fallback default error handler if provided here
    _defaultErrorHandler = (args && args.defaultErrorHandler) || null;
    _platform = (args && args.platform) || '';
    _clientID = (args && args.clientID) || 'sugar';
    _timeout = ((args && args.timeout) || 30) * 1000;
    _externalLogin = false;
    _allowBulk = !(args && args.disableBulkApi);

    if (args && args.externalLoginUICallback && underscore.isFunction(args.externalLoginUICallback)) {
        _externalLoginUICallback = args.externalLoginUICallback;
    }

    if (_keyValueStore) {
        if (!$.isFunction(_keyValueStore.set) ||
            !$.isFunction(_keyValueStore.get) ||
            !$.isFunction(_keyValueStore.cut))
        {
            throw new Error('Failed to initialize Sugar API: key/value store provider is invalid');
        }

        var init = function() {
            _accessToken = _keyValueStore.get('AuthAccessToken');
            _refreshToken = _keyValueStore.get('AuthRefreshToken');
            _downloadToken = _keyValueStore.get('DownloadToken');
        };

        if ($.isFunction(_keyValueStore.initAsync)) {
            _keyValueStore.initAsync(init);
        } else {
            init();
        }

        if ($.isFunction(_keyValueStore.on)) {
            _keyValueStore.on('cache:clean', function(callback) {
                callback(['AuthAccessToken', 'AuthRefreshToken', 'DownloadToken']);
            });
        }
    }

    _refreshingToken = false;

    var _resetAuth = function(data) {
        // data is the response from the server
        if (data) {
            _accessToken = data.access_token;
            _refreshToken = data.refresh_token;
            _downloadToken = data.download_token;
            if (_keyValueStore) {
                _keyValueStore.set('AuthAccessToken', _accessToken);
                _keyValueStore.set('AuthRefreshToken', _refreshToken);
                _keyValueStore.set('DownloadToken', _downloadToken);
            }
        } else {
            _accessToken = null;
            _refreshToken = null;
            _downloadToken = null;
            if (_keyValueStore) {
                _keyValueStore.cut('AuthAccessToken');
                _keyValueStore.cut('AuthRefreshToken');
                _keyValueStore.cut('DownloadToken');
            }
        }
    };

    var _handleErrorAndRefreshToken = function(self, request, callbacks) {
        return function(xhr, textStatus, errorThrown) {
            var error = new HttpError(request, textStatus, errorThrown);
            var onError = function() {
                // Either regular request failed or token refresh failed
                // Call original error callback
                if (!_rqueue.length || self.refreshingToken(request.params.url)) {
                    if (callbacks.error) {
                        callbacks.error(error);
                    }
                    else if ($.isFunction(self.defaultErrorHandler)) {
                        self.defaultErrorHandler(error);
                    }
                } else {
                    // Token refresh failed
                    // Call original error callback for all queued requests
                    for (var i = 0; i < _rqueue.length; ++i) {
                        if (_rqueue[i]._oerror) _rqueue[i]._oerror(error);
                    }
                }
                // duplicated due to other types of authentication
                self.setRefreshingToken(false);
            };

            var r, refreshFailed = true;
            if (self.needRefreshAuthToken(request.params.url, error.code)) {
                //If we were unloading the queue when we got another 401, we should stop before we get into a loop
                if (request._dequeuing) {
                    if (request._oerror) request._oerror(error);
                    //The tokens we have are bad, nuke them.
                    self.resetAuth();
                    return;
                }
                _rqueue.push(request);

                self.setRefreshingToken(true);

                var refreshCallbacks = {
                    complete: function() {

                        // Call original complete callback for all queued requests
                        // only if token refresh failed
                        // In case of requests succeed, complete callback is called by ajax lib
                        if (refreshFailed) {
                            r = _rqueue.shift();
                            while (r) {
                                if (r._ocomplete) {
                                    r._ocomplete.call(this, r);
                                }
                                r = _rqueue.shift();
                            }
                        }
                    },
                    success: function() {
                        self.setRefreshingToken(false);
                        refreshFailed = false;
                        _refreshTokenSuccess(function() {
                            // Repeat original requests
                            r = _rqueue.shift();
                            while (r) {
                                r._dequeuing = true;
                                r.execute(self.getOAuthToken());
                                r = _rqueue.shift();
                            }
                        });
                    },
                    error: onError
                };

                if (!('crosstab' in window) || !crosstab.supported) {
                    self.login(null, {refresh: true}, {
                        complete: refreshCallbacks.complete,
                        success: refreshCallbacks.success,
                        error: refreshCallbacks.error
                    });
                    return;
                }

                crosstab(function() {
                    crosstab.on('auth:refresh:complete', function(event) {
                        var status = event.data;
                        switch (status) {
                            case 'success':
                                refreshCallbacks.success();
                                break;
                            case 'error':
                                refreshCallbacks.error();
                                break;
                            case 'complete':
                                refreshCallbacks.complete();
                                crosstab.off('auth:refresh:complete');
                                break;
                        }
                    });

                    crosstab.broadcastMaster('auth:refresh');
                });

            } else if (self.needQueue(request.params.url)) {
                // Queue subsequent request to execute it after token refresh completes
                _rqueue.push(request);
            } else if (_externalLogin && error.status == 401 && error.payload &&
                error.payload.url && error.payload.platform == _platform
            ) {
                self.handleExternalLogin(request, error, onError);
            } else {
                onError();
            }
        };
    };

    return {
        /**
         * Client Id for oAuth.
         *
         * @type {string}
         * @memberOf Api
         * @instance
         */
        clientID: _clientID,

        /**
         * URL of Sugar REST end-point.
         *
         * @type {string}
         * @memberOf Api
         * @instance
         */
        serverUrl: _serverUrl,

        /**
         * Default fallback HTTP error handler. Used when api.call
         * is not supplied with an error: function in callbacks parameter.
         *
         * @type {Function}
         * @memberOf Api
         * @instance
         */
        defaultErrorHandler: _defaultErrorHandler,

        /**
         * Request timeout (in milliseconds).
         *
         * @type {number}
         * @memberOf Api
         * @instance
         */
        timeout: _timeout,

        /**
         * Flag indicating if API should run in debug mode (console debugging
         * of API calls).
         *
         * @type {boolean}
         * @memberOf Api
         * @instance
         */
        debug: false,

        /**
         * Aborts a request by ID.
         *
         * @param {string} id Request ID
         * @memberOf Api
         * @instance
         */
        abortRequest: function(id) {
            var request = _requests[id];

            if (request) {
                request.aborted = true;
                if (request.xhr) {
                    request.xhr.aborted = true;
                    request.xhr.abort();
                }
            }
        },

        /**
         * Gets request by ID.
         *
         * @param {string} id Request ID
         * @memberOf Api
         * @instance
         */
        getRequest: function(id) {
            return _requests[id];
        },

        /**
         * Sets the callback to be triggered after a token refresh occurs.
         *
         * @param callback function to be called
         * @memberOf Api
         * @instance
         */
        setRefreshTokenSuccessCallback: function(callback) {
            if (underscore.isFunction(callback))
                _refreshTokenSuccess = callback;
        },

        /**
         * Makes AJAX call via jQuery/Zepto AJAX API.
         *
         * @param {string} method CRUD action to make (read, create, update,
         *   delete) are mapped to corresponding HTTP verb: GET, POST, PUT, DELETE.
         * @param {string} url resource URL.
         * @param {FormData|Object} [data] Request body contents. If not given as FormData,
         *   will be stringified into JSON.
         * @param {Object} [callbacks] callbacks object.
         * @param {Object} [options] options for request that map
         *   directly to the jquery/zepto Ajax options.
         * @return {HttpRequest} AJAX request.
         * @memberOf Api
         * @instance
         */
        call: function(method, url, data, callbacks, options) {
            var request,
                args,
                type = _methodsToRequest[method],
                self = this,
                token = this.getOAuthToken();

            options = options || {};
            callbacks = callbacks || {};

            // by default use json headers
            var params = {
                type: type,
                dataType: 'json',
                headers: {},
                timeout: options.timeout || this.timeout,
                contentType: 'application/json'
            };

            // if we dont have a url from options take arg url
            if (!options.url) {
                params.url = url;
            }

            if (callbacks.success) {
                params.success = function(data, status) {
                    request.status = (data && data.status) ? data.status : status;
                    callbacks.success(data, request);
                };
            }

            params.complete = function() {

                _requests[request.uid] = null;

                // Do not call complete callback if we are in token refresh loop
                // We'll call complete callback once the refresh completes
                if (!_refreshingToken && callbacks.complete) {
                    callbacks.complete(request);
                }
            };

            //Process the iframe transport request
            if (options.iframe === true) {
                if (token) {
                    data = data || {};
                    data['OAuth-Token'] = token;
                    params.data = data;
                }
            } else {
                // set data for create, update, and delete
                if (data && (method == 'create' || method == 'update' || method == 'delete')) {
                    if (data instanceof FormData) {
                        params.data = data;
                    } else {
                        params.data = JSON.stringify(data);
                    }
                }
            }

            // Don't process data on a non-GET request.
            if (params.type !== 'GET') {
                params.processData = false;
            }

            // Clients may override any of AJAX options.
            request = new HttpRequest(underscore.extend(params, options), this.debug);
            params.error = _handleErrorAndRefreshToken(self, request, callbacks);
            // Keep original error and complete callback for token refresh loop
            request._oerror = callbacks.error;
            request._ocomplete = callbacks.complete;

            //add request to requests hash
            request.uid = _ruid++;
            _requests[request.uid] = request;

            args = [
                token,
                options.skipMetadataHash ? null : this.getMetadataHash(),
                options.skipMetadataHash ? null : this.getUserprefHash()
            ];
            // Login request doesn't need auth token
            if (this.isLoginRequest(url)) {
                request.execute();
            } else if (this.isAuthRequest(url)) {
                request.execute(token);
            } else if (params.bulk && _allowBulk) {
                var bulkQueue = _bulkQueues[params.bulk] || [];
                if (!_bulkQueues[params.bulk]) {
                    _bulkQueues[params.bulk] = bulkQueue;
                }
                bulkQueue.push({
                    request: request,
                    args: args
                });
            } else {
                request.execute.apply(request, args);
            }

            return request;
        },

        /**
         * Begins a BulkAPI request. Previous uses of call() should have
         * options.bulk set to an ID.
         *
         * Calling triggerBulkCall with the same ID will combine all the
         * previously queued requests into a single bulk call.
         * @param {number|string} bulkId The id of the bulk request.
         * @memberOf Api
         * @instance
         */
        triggerBulkCall: function(bulkId) {
            if (!_allowBulk) {
                return;
            }

            bulkId = bulkId || true;
            var queue = _bulkQueues[bulkId],
                requests = [],
                version = underscore.last(this.serverUrl.split('/'));

            if (!queue) {
                //TODO log an error here
                return;
            }
            underscore.each(queue, function(r) {
                var params = r.request.params,
                    args = r.args,
                    token = args[0],
                    mdHash = args[1],
                    upHash = args[2];

                if (token) {
                    params.headers = params.headers || {};
                    params.headers['OAuth-Token'] = token;
                }
                if (mdHash) {
                    params.headers = params.headers || {};
                    params.headers['X-Metadata-Hash'] = mdHash;
                }
                if (upHash) {
                    params.headers = params.headers || {};
                    params.headers['X-Userpref-Hash'] = upHash;
                }
                //Url needs to be trimmed down to the version number.
                if (!underscore.isEmpty(params.url)) {
                    params.url = version + params.url.substring(this.serverUrl.length);
                }

                requests.push(params);
            }, this);
            this.call('create', this.buildURL('bulk'), {requests: requests}, {
                success: function(o, parentReq) {
                    underscore.each(queue, function(r, i) {
                        var request = r.request,
                            result = o[i],
                            contents = result.contents || {},
                            xhr = new bulkXHR(result, parentReq);
                        request.xhr = xhr;

                        if (request.aborted === true || contents.error) {
                            request.status = 'error';
                            if (underscore.isFunction(request.params.error)) {
                                request.params.error.call(request.params, request, 'error', xhr.statusText);
                            }
                        }
                        else {
                            if (underscore.isFunction(request.params.success)) {
                                request.params.success.call(request.params, contents, 'success');
                            }
                        }
                        if (underscore.isFunction(request.params.complete)) {
                            request.params.complete.call(request.params, request);
                        }
                    });
                }
            });
            _bulkQueues[bulkId] = null;
        },

        /**
         * Clears the bulk call queue.
         *
         * @memberOf Api
         * @instance
         */
        clearBulkQueue: function() {
            _bulkQueues = {};
        },

        /**
         * Builds URL based on module name action and attributes of the format
         * rooturl/module/id/action.
         *
         * The `attributes` hash must contain `id` of the resource being
         * actioned upon for record CRUD and `relatedId` if the URL is build for
         * relationship CRUD.
         *
         * @param {string} module module name.
         * @param {string} action CRUD method.
         * @param {Object} [attributes] object of resource being
         *   actioned upon, e.g. `{name: "bob", id:"123"}`.
         * @param {Object} [params] URL parameters.
         * @return {string} URL for specified resource.
         * @memberOf Api
         * @instance
         */
        buildURL: function(module, action, attributes, params) {
            params = params || {};
            var parts = [];
            var url;
            parts.push(this.serverUrl);

            if (module) {
                parts.push(module);
            }

            if ((action != 'create') && attributes && attributes.id) {
                parts.push(attributes.id);
            }

            if (attributes && attributes.link && action != 'file') {
                parts.push('link');
                if (underscore.isString(attributes.link)) {
                    parts.push(attributes.link);
                }
            }

            if (action && $.inArray(action, _baseActions) === -1) {
                parts.push(action);
            }

            if (attributes) {
                if (attributes.relatedId) {
                    parts.push(attributes.relatedId);
                }

                if (action == 'file' && attributes.field) {
                    parts.push(attributes.field);
                    if (attributes.fileId) {
                        parts.push(attributes.fileId);
                    }
                } else if (action === 'collection' && attributes.field) {
                    parts.push(attributes.field);
                }
            }

            url = parts.join('/');

            // URL parameters
            // remove nullish params
            underscore.each(params, function(value, key) {
                if (value === null || value === undefined) {
                    delete params[key];
                }
            });

            params = $.param(params);
            if (params.length > 0) {
                url += '?' + params;
            }

            return url;
        },

        /**
         * Builds a file resource URL.
         *
         * The `attributes` hash must contain the following properties:
         *
         *     {
         *         module: module name
         *         id: record id
         *         field: Name of the file field in the given module (optional).
         *     }
         *
         * Example 1:
         *
         *     var url = app.api.buildFileURL({
         *        module: 'Contacts',
         *        id: '123',
         *        field: 'picture'
         *     });
         *
         *     // Returns:
         *     'http://localhost:8888/sugarcrm/rest/v10/Contacts/123/file/picture?format=sugar-html-json&platform=base'
         *
         * The `field` property is optional. If omitted the method returns a
         * URL for a list of file resources.
         *
         * Example 2:
         *
         *     var url = app.api.buildFileURL({
         *        module: 'Contacts',
         *        id: '123'
         *     });
         *
         *     // Returns:
         *     'http://localhost:8888/sugarcrm/rest/v10/Contacts/123/file?platform=base'
         *
         * @param {Object} attributes Hash with file information.
         * @param {Object} [options] URL options hash.
         * @param {boolean} [options.htmlJsonFormat] Flag indicating if
         *   `sugar-html-json` format must be used (`true` by default if
         *   `field` property is specified).
         * @param {boolean} [options.passDownloadToken] Flag indicating if
         *   download token must be passed in the URL (`false` by default).
         * @param {boolean} [options.deleteIfFails] Flag indicating if
         *   related record should be marked deleted:1 if file operation
         *   unsuccessful.
         * @param {boolean} [options.keep] Flag indicating if the temporary
         *   file should be kept when issuing a `GET` request to the
         *   `FileTempApi` (it is cleaned up by default).
         * @return {string} URL for the file resource.
         * @memberOf Api
         * @instance
         */
        buildFileURL: function(attributes, options) {
            var params = {};
            options = options || {};
            // We only concerned about the format if build URL for an actual file resource
            if (attributes.field && (options.htmlJsonFormat !== false)) {
                params.format = 'sugar-html-json';
            }

            if (options.deleteIfFails === true) {
                params.delete_if_fails = true;
            }

            if (options.passDownloadToken) {
                params.download_token = this.getDownloadToken();
            }

            if (!underscore.isUndefined(options.forceDownload)) {
                params.force_download = (options.forceDownload) ? 1 : 0;
            }

            if (options.cleanCache === true) {
                params[(new Date()).getTime()] = 1;
            }

            if (options.platform !== undefined) {
                params.platform = options.platform;
            } else if (_platform) {
                params.platform = _platform;
            }

            if (options.keep === true) {
                params.keep = 1;
            }

            return this.buildURL(attributes.module, 'file', attributes, params);
        },

        /**
         * Returns the current access token.
         *
         * @return {string} The current access token.
         * @memberOf Api
         * @instance
         */
        getOAuthToken: function() {
            return _keyValueStore ? _keyValueStore.get('AuthAccessToken') || _accessToken : _accessToken;
        },

        /**
         * Returns the current refresh token.
         *
         * @return {string} The current refresh token.
         * @memberOf Api
         * @instance
         */
        getRefreshToken: function() {
            return _keyValueStore ? _keyValueStore.get('AuthRefreshToken') || _refreshToken : _refreshToken;
        },

        /**
         * Returns the current download token.
         *
         * @return {string} The current download token.
         * @memberOf Api
         * @instance
         */
        getDownloadToken: function() {
            return _keyValueStore ? _keyValueStore.get('DownloadToken') || _downloadToken : _downloadToken;
        },

        /**
         * Returns the current metadata hash.
         *
         * @return {string} The current metadata hash
         * @memberOf Api
         * @instance
         */
        getMetadataHash: function() {
            return _keyValueStore ? _keyValueStore.get('meta:hash') : null;
        },

        /**
         * Gets the user preference hash for use in checking state of change.
         *
         * @return {string} The user preference hash set from a /me response.
         * @memberOf Api
         * @instance
         */
        getUserprefHash: function() {
            return _keyValueStore ? _keyValueStore.get('userpref:hash') : null;
        },

        /**
         * Fetches metadata.
         *
         * @param {Objec} [options] Options to decide what to get from
         *   the server.
         * @param {Array} [options.types] Metadata types to fetch.
         *   E.g.: `['vardefs','detailviewdefs']`
         * @param {Array} [options.modules] Module names to fetch.
         *   E.g.: `['accounts','contacts']`
         * @param {Object} [options.callbacks] callback object.
         * @param {Object} [options.public=false] Pass `true` to get the
         *   public metadata.
         * @param {Object} [options.params] Extra params to send to the
         *   request.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        getMetadata: function(options) {

            if (underscore.isString(options)) {
                console.warn('`Api::getMetadata` has changed signature ' +
                    'and will drop support for the old signature in a future release. Please update your code.');

                var oldOpt = arguments[4] || {};
                options = {
                    types: arguments[1],
                    modules: arguments[2],
                    callbacks: arguments[3],
                    public: oldOpt.getPublic,
                    params: oldOpt.params,
                };
            }

            options = options || {};
            var params = options.params || {};

            if (options.types) {
                params.type_filter = options.types.join(',');
            }

            if (options.modules) {
                params.module_filter = options.modules.join(',');
            }

            if (_platform) {
                params.platform = _platform;
            }

            var method = 'read';

            if (options.public) {
                method = 'public';
            } else {
                options.callbacks = options.callbacks || {};
                options.callbacks.success = underscore.wrap(options.callbacks.success, function (success, data, status) {
                    if (data) {
                        this._serverInfo = data.server_info;
                    }

                    if (success) {
                        success(data, status);
                    }
                });
            }

            params.module_dependencies = 1;

            var url = this.buildURL('metadata', method, null, params);
            return this.call(method, url, null, options.callbacks);
        },

        /**
         * Executes CRUD on records.
         *
         * @param {string} method operation type: create, read, update, or delete.
         * @param {string} module module name.
         * @param {Object} data request object. If it contains id, action,
         *   link, etc., URI will be adjusted accordingly.
         * If methods parameter is 'create' or 'update', the data object will be put in the request body payload.
         * @param {Object} [params] URL parameters.
         * @param {Object} [callbacks] callback object.
         * @param {Object} [options] request options.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        records: function(method, module, data, params, callbacks, options) {
            var url = this.buildURL(module, method, data, params);
            return this.call(method, url, data, callbacks, options);
        },

        /**
         * Executes CRUD on relationships.
         *
         * The data paramerer represents relationship information:
         * <pre>
         * {
         *    id: record ID
         *    link: relationship link name
         *    relatedId: ID of the related record
         *    related: object that contains request payload (related record or relationship fields)
         * }
         * </pre>
         *
         * @param {string} method operation type: create, read, update, or delete.
         * @param {string} module module name.
         * @param {Object} data object with relationship information.
         * @param {Object} [params] URL parameters.
         * @param {Object} [callbacks] callback object.
         * @param {Object} [options] request options.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        relationships: function(method, module, data, params, callbacks, options) {
            var url = this.buildURL(module, null, data, params);
            return this.call(method, url, data.related, callbacks, options);
        },

        /**
         * Fetches a collection field.
         *
         * @param {string} module Module name.
         * @param {Object} data object containing information to build the url.
         * @param {string} data.field The name of the collection field to fetch.
         * @param {string} data.id The name of the bean id the collection field
         *   belongs to.
         * @param {Object} [params] URL parameters.
         * @param {Object} [callbacks] callback object.
         * @param {Object} [options] request options.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        collection: function(module, data, params, callbacks, options) {
            var url = this.buildURL(module, 'collection', data, params);
            return this.call('read', url, null, callbacks, options);
        },

        /**
         * Marks/unmarks a record as favorite.
         *
         * @param {string} module Module name.
         * @param {string} id Record ID.
         * @param {boolean} favorite Flag indicating if the record must be marked as favorite.
         * @param {Object} [callbacks] Callback object.
         * @param {Object} [options] request options.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        favorite: function(module, id, favorite, callbacks, options) {
            var action = favorite ? 'favorite' : 'unfavorite';
            var url = this.buildURL(module, action, { id: id });
            return this.call('update', url, null, callbacks, options);
        },

        /**
         * Subscribe/unsubscribe a record changes.
         *
         * @param {string} module Module name.
         * @param {string} id Record ID.
         * @param {boolean} followed Flag indicates if wants to subscribe
         *   the record changes.
         * @param {Object} [callbacks] Callback object.
         * @param {Object} [options] request options.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        follow: function(module, id, followed, callbacks, options) {
            callbacks = callbacks || {};
            options = options || {};
            var method = followed ? 'create' : 'delete',
                action = followed ? 'subscribe' : 'unsubscribe',
                url = this.buildURL(module, action, { id: id });
            return this.call(method, url, null, callbacks, options);
        },

        /**
         * Loads an enum field's options using the enum API.
         *
         * @param {string} module Module name.
         * @param {string} field Name of enum field.
         * @param {Object} [callbacks] Callback object
         * @param {Object} [options] Options object
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        enumOptions: function(module, field, callbacks, options) {
            var url = this.buildURL(module + '/enum/' + field);
            return this.call('read', url, null, callbacks, options);
        },

        /**
         * Calls API requests in bulk.
         *
         * @param {Object} data Object with requests array.
         * @param {Object} callbacks
         * @param {Object} [options] Options object.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        bulk: function(data, callbacks, options) {
            var url = this.buildURL('bulk');
            return this.call('create', url, data, callbacks, options);
        },

        /**
         * Given a url, attempts to download a file.
         *
         * @param {string} url url to call
         * @param {Object} [callbacks] Callback object
         * @param {Object} [options] Options object
         *  - iframe: jquery element upon which to attach the iframe for download
         *    if not specified we must fall back to window.location.href
         * @memberOf Api
         * @instance
         */
        fileDownload: function(url, callbacks, options) {
            callbacks = callbacks || {};
            options = options || {};
            var internalCallbacks = {};

            internalCallbacks.success = function(data) {
                // start the download with the "iframe" hack
                if (options.iframe) {
                    options.iframe.prepend('<iframe class="hide" src="' + url + '"></iframe>');
                } else {
                    window.location.href = url;
                }
                if (underscore.isFunction(callbacks.success)) {
                    callbacks.success.apply(arguments);
                }
            };

            if (underscore.isFunction(callbacks.error)) {
                internalCallbacks.error = callbacks.error;
            }

            if (underscore.isFunction(callbacks.complete)) {
                internalCallbacks.complete = callbacks.complete;
            }

            // ping to make sure we have our token, then make an iframe and download away
            return this.call('read', this.buildURL('ping'), {}, internalCallbacks, {processData: false});
        },

        /**
         * This function uses native XMLHttpRequest to download File/Blob data from an endpoint.
         * jQuery ajax struggles with Blob data, so this adds a Sugar-friendly way to do it.
         *
         * @param {String} url The URL to use for the XMLHttpRequest
         * @param {Function} [callback] An optional callback function to call at the end of onload
         */
        xhrDownloadFile: function(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';

            xhr.onload = function() {
                var fileName = '';
                var disposition;
                var fileNameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                var matches;
                var contentType;
                var blob;
                var URL;
                var downloadUrl;
                var aEl;

                if (this.status === 200) {
                    disposition = xhr.getResponseHeader('Content-Disposition');
                    contentType = xhr.getResponseHeader('Content-Type');

                    if (disposition && disposition.indexOf('attachment') !== -1) {
                        matches = fileNameRegex.exec(disposition);

                        if (matches != null && matches[1]) {
                            fileName = matches[1].replace(/['"]/g, '');
                        }
                    }

                    if (typeof File === 'function') {
                        blob = new File([this.response], fileName, {
                            type: contentType
                        });
                    } else {
                        blob = new Blob([this.response], {
                            type: contentType
                        });
                    }

                    if (typeof window.navigator.msSaveBlob !== 'undefined') {
                        // this lets us work around IE's HTML7007 blob issue
                        window.navigator.msSaveBlob(blob, fileName);
                    } else {
                        URL = window.URL || window.webkitURL;
                        downloadUrl = URL.createObjectURL(blob);

                        if (fileName) {
                            // set up an anchor Element to take advantage of the download attribute
                            aEl = document.createElement('a');
                            aEl.download = fileName;
                            aEl.target = '_blank';
                            aEl.href = downloadUrl;
                            // appends the anchor element to the dom
                            document.body.appendChild(aEl);
                            // clicks the actual anchor link to begin download process
                            aEl.click();
                        } else {
                            window.location = downloadUrl;
                        }

                        // perform cleanup of removing the anchor element from the DOM
                        // as well as revoking the ObjectURL to prevent minor memory leak
                        setTimeout(function () {
                            URL.revokeObjectURL(downloadUrl);
                        }, 100);
                    }

                    if (underscore.isFunction(callback)) {
                        callback(fileName);
                    }
                }
            };

            xhr.setRequestHeader('OAuth-Token', this.getOAuthToken());
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.send();
        },

        /**
         * Executes CRUD on a file resource.
         *
         * @param {string} method operation type: create, read, update, or delete.
         * @param {Object} data object with file information.
         * <pre>
         * {
         *   module: module name
         *   id: model id
         *   field: Name of the file-type field.
         * }
         * </pre>
         * The `field` property is optional. If not specified, the API fetches the file list.
         * @param {Object} [$files] jQuery/Zepto DOM elements that carry the files to upload.
         * @param {Object} [callbacks] callback object.
         * @param {Object} [options] Request options hash.
         * See {@link Api#buildFileURL} function for other options.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        file: function(method, data, $files, callbacks, options) {
            let ajaxParams = {
                processData: false,
                contentType: false,
            };

            let fd = new FormData();

            // first we check if there was anything sent at all
            if (data.field && $files) {
                let attachedFile = $files[0];
                // then we check if we really have files to work with
                if (!underscore.isUndefined(attachedFile) && attachedFile.files && attachedFile.files.length) {
                    fd.append(data.field, attachedFile.files[0]);
                }
            }

            options = options || {};
            options.htmlJsonFormat = false;

            if (options.deleteIfFails !== false) {
                options.deleteIfFails = true;
            }

            callbacks.success = underscore.wrap(callbacks.success, function(success, data) {
                if (data.error && underscore.isFunction(callbacks.error)) {
                    callbacks.error(data);
                } else if (underscore.isFunction(success)) {
                    success(data);
                }
            });

            return this.call(method, this.buildFileURL(data, options), fd, callbacks, ajaxParams);
        },

        /**
         * Fetches the total amount of records for a given module.
         *
         * Example 1:
         *
         *     app.api.count('Contacts', null, {
         *         success: function(data) {
         *             console.log('Total number of Contacts:' +
         *                 data.record_count);
         *         }
         *     });
         *
         * Example 2:
         *
         *     app.api.count('Accounts', null,
         *         {
         *             success: function(data) {
         *                 console.log('Total number of "B" Accounts:' +
         *                     data.record_count);
         *             }
         *         },
         *         {
         *             filter: [{'name': {'$starts': 'B'}}]
         *         }
         *     );
         *
         * Example 3:
         *
         *     app.api.count('Accounts',
         *         {
         *             id: 'abcd',
         *             link: 'cases'
         *         },
         *         {
         *             success: function(data) {
         *                 console.log('Total number of "B" cases related' +
         *                     'to "abcd" account:' + data.record_count);
         *             }
         *         },
         *         {
         *             filter: [{'name': {'$starts': 'B'}}]
         *         }
         *     );
         *
         * @param {string} module Module to fetch the count for.
         * @param {Object} [data] Data object containing relationship
         *   information.
         * @param {string} [data.link] The link module name.
         * @param {string} [data.id] The id of the model.
         * @param {function} [callbacks] Callback functions.
         * @param {Object} [options] URL options hash.
         * @param {Object} [options.filter] If supplied, the count of
         *   filtered records will be returned, instead of the total number
         *   of records.
         * @return {HttpRequest} Result of {@link Api#call}.
         * @memberOf Api
         * @instance
         */
        count: function(module, data, callbacks, options) {
            options = options || {};
            var url = this.buildURL(module, 'count', data, options);

            return this.call('read', url, null, callbacks);
        },

        /**
         * Triggers a file download of the exported records.
         *
         * @param {Object} params Download parameters.
         * @param {string} params.module Module name.
         * @param {Array} params.uid Array of record ids to request export.
         * @param {jQuery} $el JQuery selector to element.
         * @param {Object} [callbacks] Various callbacks.
         * @param {Function} [callbacks.success] Called on success.
         * @param {Function} [callbacks.error] Called on failure.
         * @param {Function} [callbacks.complete] Called when finished.
         * @param {Object} [options] Request options hash.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        exportRecords: function(params, $el, callbacks, options) {
            var self = this;
            var recordListUrl = this.buildURL(params.module, 'record_list');

            options = options || {};

            return this.call(
                'create',
                recordListUrl,
                {'records': params.uid},
                {
                    success: function(response) {
                        params = underscore.omit(params, ['uid', 'module']);
                        if (options.platform !== undefined) {
                            params.platform = options.platform;
                        } else if (_platform) {
                            params.platform = _platform;
                        }

                        self.fileDownload(
                            self.buildURL(response.module_name, 'export', {relatedId: response.id}, params),
                            callbacks,
                            { iframe: $el }
                        );
                    }
                }
            );
        },

        /**
         * Searches for specified query.
         *
         * @param {Object} params Properties.
         * @param {string} params.q Query.
         * @param {string} [params.module_list] Comma-separated module list.
         * @param {string} [params.fields] Comma-separated list of fields.
         * @param {number} [params.max_num] Max number of records to return.
         * @param {number} [params.offset] Initial offset into the results.
         * @param {Object} callbacks Hash with success and error callbacks.
         * @param {Function} callbacks.success Function called on success.
         *   Takes one argument.
         * @param {Function} callbacks.error Function called on failure.
         *   Takes one argument.
         * @param {Object} [options] Request options.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        search: function(params, callbacks, options) {
            options = options || {};
            //FIXME: This is a temporary change. SC-4253 will set it back to
            //'search' once BR-2367 will be merged.
            var data = null;
            if (options.data) {
                data = options.data;
                delete options.data;
            }
            var method = 'read';
            if (options.fetchWithPost) {
                method = 'create';
            }
            var endpoint = options.useNewApi ? 'globalsearch' : 'search';
            var url = this.buildURL(null, endpoint, null, params);

            return this.call(method, url, data, callbacks, options);
        },

        /**
         * Performs login.
         *
         * Credentials:
         * <pre>
         *     username: user's login name or email,
         *     password: user's password in clear text
         * </pre>
         *
         * @param {Object} credentials user credentials.
         * @param {Object} [data] extra data to be passed in login request
         *   such as client user agent, etc.
         * @param {Object} [callbacks] callback object.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        login: function(credentials, data, callbacks) {
            var payload, success, error, method, url, self = this;

            credentials = credentials || {};
            callbacks = callbacks || {};

            success = function(data) {
                _resetAuth(data);
                if (_externalLogin) {
                    self.setRefreshingToken(false);
                    _refreshTokenSuccess(
                        function() {
                            // Repeat original requests
                            var r = _rqueue.shift();
                            while (r) {
                                r._dequeuing = true;
                                r.execute(self.getOAuthToken());
                                r = _rqueue.shift();
                            }
                        }
                    );
                }
                if (callbacks.success) callbacks.success(data);
            };

            error = function(error) {
                _resetAuth();
                if (callbacks.error) callbacks.error(error);
            };

            if (data && data.refresh) {
                payload = underscore.extend({
                    grant_type: 'refresh_token',
                    client_id: this.clientID,
                    client_secret: '',
                    refresh_token: this.getRefreshToken(),
                    platform: _platform ? _platform : 'base'
                }, data);
            } else {
                payload = underscore.extend({
                    grant_type: 'password',
                    username: credentials.username,
                    password: credentials.password,
                    client_id: this.clientID,
                    platform: _platform ? _platform : 'base',
                    client_secret: ''
                }, data);
                payload.client_info = data;
            }

            method = 'create';
            url = this.buildURL('oauth2', 'token', payload, {
                platform: _platform
            });
            return this.call(method, url, payload, {
                success: success,
                error: error,
                complete: callbacks.complete
            });
        },

        /**
         * Executes CRUD on user profile.
         *
         * @param {string} method Operation type: read or update (reserved for
         *   future use).
         * @param {Object} [data] user Profile object.
         * @param {Object} [params] URL parameters.
         * @param {Object} [callbacks] Callback object.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        me: function(method, data, params, callbacks) {
            var url = this.buildURL('me', method, data, params);
            return this.call(method, url, data, callbacks);
        },

        /**
         * Makes a call to the CSS Api.
         *
         * @param {string} Platform
         * @param {Object} ThemeName
         * @param {Object} [callbacks] Callback object.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        css: function(platform, themeName, callbacks) {
            var params = {
                platform: platform,
                themeName: themeName
            };
            var url = this.buildURL('css', 'read', {}, params);
            return this.call('read', url, {}, callbacks);
        },

        /**
         * Performs logout.
         *
         * @param {Object} [callbacks] Callback object.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        logout: function (callbacks, options) {

            callbacks = callbacks || {};

            var payload = {
                token: this.getOAuthToken(),
                refresh_token: this.getRefreshToken(),
            };

            // Stock sidecar sends refresh token on logout
            // 6.7.x doesn't support it. See [NOMAD-2891]/[SI 72054]
            // TODO remove this once we drop support on 6.x on Nomad
            if (this._serverInfo && this._serverInfo.version.charAt(0) === '6') {
                delete payload.refresh_token;
            }

            var url = this.buildURL('oauth2', 'logout', payload);

            var originalComplete = callbacks.complete;
            callbacks.complete = function () {
                _resetAuth();
                if (originalComplete) originalComplete();
            };

            return this.call('create', url, payload, callbacks, options);
        },

        /**
         * Pings the server.
         *
         * The request doesn't send metadata hash by default.
         * Pass `false` for "skipMetadataHash" option to override this behavior.
         * @param {string} [action] Optional ping operation.
         *   Currently, Sugar REST API supports "whattimeisit" only.
         * @param {Object} [callbacks] callback object.
         * @param {Object} [options] request options.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        ping: function(action, callbacks, options) {
            return this.call(
                'read',
                this.buildURL('ping', action, null, {
                    platform: _platform
                }),
                null,
                callbacks,
                underscore.extend({
                    skipMetadataHash: true
                }, options || {})
            );
        },

        /**
         * Performs signup.
         *
         * TODO: The signup action needs another endpoint to allow a guest to signup
         *
         * @param {Object} contactData user profile.
         * @param {Object} [data] extra data to be passed in login request
         *   such as client user agent, etc.
         * @param {Object} [callbacks] callback object.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        signup: function(contactData, data, callbacks) {
            var payload = contactData;
            payload.client_info = data;

            var method = 'create';
            var url = this.buildURL('Leads', 'register', payload);
            return this.call(method, url, payload, callbacks);
        },


        /**
         * Verifies password.
         *
         * @param {Object} password The password to verify
         * @param {Object} [callbacks] Callback object.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        verifyPassword: function(password, callbacks) {
            var payload = {
                password_to_verify: password
            };
            var method = 'create'; //POST so we don't require query params
            var url = this.buildURL('me/password', method);
            return this.call(method, url, payload, callbacks);
        },

        /**
         * Updates password.
         *
         * @param {Object} password The new password
         * @param {Object} password The new password
         * @param {Object} [callbacks] Callback object.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        updatePassword: function(oldPassword, newPasword, callbacks) {
            var payload = {
                new_password: newPasword,
                old_password: oldPassword
            };
            var method = 'update';
            var url = this.buildURL('me/password', method);
            return this.call(method, url, payload, callbacks);
        },

        /**
         * Fetches server information.
         *
         * @param {Object} [callbacks] callback object.
         * @return {HttpRequest} The AJAX request.
         * @memberOf Api
         * @instance
         */
        info: function(callbacks) {
            var url = this.buildURL('ServerInfo');
            return this.call('read', url, null, callbacks);
        },

        /**
         * Checks if API instance is currently authenticated.
         *
         * @return {boolean} `true` if authenticated, `false` otherwise.
         * @memberOf Api
         * @instance
         */
        isAuthenticated: function() {
            return typeof(this.getOAuthToken()) === 'string' && this.getOAuthToken().length > 0;
        },

        /**
         * Clears authentication tokens.
         *
         * @memberOf Api
         * @instance
         */
        resetAuth: function() {
            _resetAuth();
        },

        /**
         * Checks if authentication token can and needs to be refreshed.
         *
         * @param {string} url URL of the failed request.
         * @param {string} errorCode Failure code.
         * @return {boolean} `true` if the OAuth2 access token can be refreshed, `false` otherwise.
         * @instance
         * @memberOf Api
         * @private
         */
        needRefreshAuthToken: function(url, errorCode) {
            return (!_refreshingToken) &&
                (typeof(this.getRefreshToken()) === 'string' && this.getRefreshToken().length > 0) &&
                (!this.isAuthRequest(url)) &&    // must not be auth request
                (errorCode === 'invalid_grant');    // means access token got expired or invalid
        },

        /**
         * Checks if we need to queue a request while token refresh is in
         * progress.
         *
         * @param {string} url
         * @return {boolean} `true` if we need to queue the request
         * @private
         * @memberOf Api
         * @instance
         */
        needQueue: function(url) {
            return _refreshingToken && !this.isAuthRequest(url);    // must not be auth request
        },

        /**
         * Checks if the request is authentication request.
         *
         * It could be either login (including token refresh) our logout request.
         * @param {string} url
         * @return {boolean} `true` if this is an authentication request,
         *   `false` otherwise.
         * @memberOf Api
         * @instance
         */
        isAuthRequest: function(url) {
            return new RegExp('\/oauth2\/').test(url);
        },

        /**
         * Checks if request is a login request.
         *
         * @param {string} url
         * @return {boolean} `true` if this is a login request, `false`
         *   otherwise.
         * @memberOf Api
         * @instance
         */
        isLoginRequest: function(url) {
            return new RegExp('\/oauth2\/token').test(url);
        },

        /**
         * Checks if the request is the refresh token request
         * @param {string} url url of the request to check
         * @return {boolean} `true` if the request is the refresh token request,
         *   `false` otherwise
         * @memberOf Api
         * @private
         */
        refreshingToken: function(url) {
            return _refreshingToken && this.isAuthRequest(url);    // must be auth request
        },

        /**
         * Sets a flag indicating that this API instance is in the process
         * of authentication token refresh.
         *
         * @param {boolean} flag Flag indicating if token refresh is in
         * progress (`true`).
         * @instance
         * @memberOf Api
         * @private
         */
        setRefreshingToken: function(flag) {
            _refreshingToken = flag;
        },

        /**
         * Handles login with an external provider.
         *
         * @param {HttpRequest} request The request to trigger.
         * @param {Object} error The error object with at least the
         *   `payload` property.
         * @param {Function} onError The function to call in case of Error
         *   during the login request.
         * @memberOf Api
         * @instance
         */
        handleExternalLogin: function(request, error, onError) {
            var self = this;

            if (!self.isLoginRequest(request.params.url)) {
                _rqueue.push(request);
            }
            // don't try to reauth again from here
            self.setRefreshingToken(true);

            $(window).on('message', function(event) {
                if (!event.originalEvent.origin || event.originalEvent.origin !== window.location.origin) {
                    // this is not our message, ignore it
                    return;
                }
                $(window).on('message', null);
                var authData = $.parseJSON(event.originalEvent.data);
                var loginFailed = !authData || !authData.access_token;

                if (loginFailed) {
                    onError();
                }
                self.setRefreshingToken(false);
                _resetAuth(authData);
                if (loginFailed) {
                    // No success actions needed on failure. Proceed causes an infinite loop.
                    return;
                }
                _refreshTokenSuccess(
                    function() {
                        // Repeat original requests
                        var r = _rqueue.shift();
                        while (r) {
                            r.execute(self.getOAuthToken());
                            r = _rqueue.shift();
                        }
                    }
                );
            });
            if (underscore.isFunction(_externalLoginUICallback)) {
                _externalLoginUICallback(error.payload.url, '_blank',
                    'width=600,height=400,centerscreen=1,resizable=1');
            }
        },

        /**
         * Returns `true` when using an external login provider.
         *
         * @return {boolean} `true` when we are using an external
         *   login provider, `false` otherwise.
         * @memberOf Api
         * @instance
         */
        isExternalLogin: function() {
            return _externalLogin;
        },

        /**
         * Sets a flag indicating that external login prodecure is used.
         *
         * This means that 401 errors would contain external URL that we should use for authentication.
         * @param {Boolean} flag Flag indicating if external login is in effect
         * @memberOf Api
         * @instance
         */
        setExternalLogin: function(flag) {
            _externalLogin = flag;
        },

        /**
         * Sets a function as external login UI callback.
         *
         * @param {Function} callback
         * @memberOf Api
         * @instance
         */
        setExternalLoginUICallback: function(callback) {
            if (underscore.isFunction(callback)) {
                _externalLoginUICallback = callback;
            }
        },

        /**
         * Retrieve a property from the current state.
         *
         * @param {string} key
         * @return {Mixed}
         * @memberOf Api
         * @instance
         */
        getStateProperty: function(key) {
            return _state[key];
        },

        /**
         * Set a property of the current state. The current state will be attached to all
         * api request objects when they are sent. Modifications to the state after the request is sent
         * but before the request completes will not affect that requests state.
         *
         * States should be used to track conditions or parameters that should be applied to all requests made
         * regardless of their source.
         *
         * @param {string} key
         * @param {*} value
         * @memberOf Api
         * @instance
         */
        setStateProperty: function(key, value) {
            _state[key] = value;
        },

        /**
         * Removes the given key from the current state.
         *
         * @param {string} key
         * @memberOf Api
         * @instance
         */
        clearStateProperty: function(key) {
            delete _state[key];
        },

        /**
         * Clears the current API request state object.
         *
         * @memberOf Api
         * @instance
         */
        resetState: function() {
            _state = {};
        }
    };
}

/**
 * Ventana module allows you to get an instance of the {@link Api} class.
 *
 * @module @sugarcrm/ventana
 */
module.exports = {
    /**
     * Gets an instance of a {@link Api Sugar API class}.
     *
     * @param {Object} args The required arguments to instanciate the Sugar API class.
     * @return {Api} An instance of Sugar API class.
     */
    getInstance: function(args) {
        return _instance || this.createInstance(args);
    },

    /**
     * Creates a new instance of a {@link Api Sugar API class}.
     *
     * @param {Object} args The required arguments to instanciate the Sugar API class.
     * @return {Api} A new instance of Sugar API class.
     */
    createInstance: function(args) {
        _instance = new SugarApi(args);

        if (!('crosstab' in window) || !crosstab.supported) {
            return _instance;
        }

        // this event should only be triggered on master tab and if
        // crosstab library is loaded
        crosstab(function() {
            crosstab.on('auth:refresh', underscore.bind(function() {

                // prevents concurrent events from multiple tabs asking for a
                // refresh token
                if (this._runningRefreshToken) {
                    return;
                }
                this._runningRefreshToken = true;

                var self = this;

                this.login(null, { refresh: true }, {
                    complete: function() {
                        crosstab.broadcast('auth:refresh:complete', 'complete');
                    },
                    success: function() {
                        delete self._runningRefreshToken;
                        crosstab.broadcast('auth:refresh:complete', 'success');
                    },
                    error: function() {
                        delete self._runningRefreshToken;
                        crosstab.broadcast('auth:refresh:complete', 'error');
                    }
                });
            }, _instance));
        });

        return _instance;
    },

    /**
     * The HttpError class.
     *
     * @type {HttpError}
     */
    HttpError: HttpError,

    /**
     * The HttpRequest class.
     *
     * @type {HttpRequest}
     */
    HttpRequest: HttpRequest
};

},{"underscore":3}],3:[function(require,module,exports){
(function (global){
//     Underscore.js 1.9.1
//     http://underscorejs.org
//     (c) 2009-2018 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` (`self`) in the browser, `global`
  // on the server, or `this` in some virtual machines. We use `self`
  // instead of `window` for `WebWorker` support.
  var root = typeof self == 'object' && self.self === self && self ||
            typeof global == 'object' && global.global === global && global ||
            this ||
            {};

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype;
  var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

  // Create quick reference variables for speed access to core prototypes.
  var push = ArrayProto.push,
      slice = ArrayProto.slice,
      toString = ObjProto.toString,
      hasOwnProperty = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var nativeIsArray = Array.isArray,
      nativeKeys = Object.keys,
      nativeCreate = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for their old module API. If we're in
  // the browser, add `_` as a global object.
  // (`nodeType` is checked to ensure that `module`
  // and `exports` are not HTML elements.)
  if (typeof exports != 'undefined' && !exports.nodeType) {
    if (typeof module != 'undefined' && !module.nodeType && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.9.1';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      // The 2-argument case is omitted because we’re not using it.
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  var builtinIteratee;

  // An internal function to generate callbacks that can be applied to each
  // element in a collection, returning the desired result — either `identity`,
  // an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value) && !_.isArray(value)) return _.matcher(value);
    return _.property(value);
  };

  // External wrapper for our callback generator. Users may customize
  // `_.iteratee` if they want additional predicate/iteratee shorthand styles.
  // This abstraction hides the internal-only argCount argument.
  _.iteratee = builtinIteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // Some functions take a variable number of arguments, or a few expected
  // arguments at the beginning and then a variable number of values to operate
  // on. This helper accumulates all remaining arguments past the function’s
  // argument length (or an explicit `startIndex`), into an array that becomes
  // the last argument. Similar to ES6’s "rest parameter".
  var restArguments = function(func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function() {
      var length = Math.max(arguments.length - startIndex, 0),
          rest = Array(length),
          index = 0;
      for (; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }
      switch (startIndex) {
        case 0: return func.call(this, rest);
        case 1: return func.call(this, arguments[0], rest);
        case 2: return func.call(this, arguments[0], arguments[1], rest);
      }
      var args = Array(startIndex + 1);
      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest;
      return func.apply(this, args);
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var shallowProperty = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  var has = function(obj, path) {
    return obj != null && hasOwnProperty.call(obj, path);
  }

  var deepGet = function(obj, path) {
    var length = path.length;
    for (var i = 0; i < length; i++) {
      if (obj == null) return void 0;
      obj = obj[path[i]];
    }
    return length ? obj : void 0;
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object.
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = shallowProperty('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  var createReduce = function(dir) {
    // Wrap code that reassigns argument variables in a separate function than
    // the one that accesses `arguments.length` to avoid a perf hit. (#1991)
    var reducer = function(obj, iteratee, memo, initial) {
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      if (!initial) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    };

    return function(obj, iteratee, memo, context) {
      var initial = arguments.length >= 3;
      return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
    };
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var keyFinder = isArrayLike(obj) ? _.findIndex : _.findKey;
    var key = keyFinder(obj, predicate, context);
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = restArguments(function(obj, path, args) {
    var contextPath, func;
    if (_.isFunction(path)) {
      func = path;
    } else if (_.isArray(path)) {
      contextPath = path.slice(0, -1);
      path = path[path.length - 1];
    }
    return _.map(obj, function(context) {
      var method = func;
      if (!method) {
        if (contextPath && contextPath.length) {
          context = deepGet(context, contextPath);
        }
        if (context == null) return void 0;
        method = context[path];
      }
      return method == null ? method : method.apply(context, args);
    });
  });

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null || typeof iteratee == 'number' && typeof obj[0] != 'object' && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(v, index, list) {
        computed = iteratee(v, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null || typeof iteratee == 'number' && typeof obj[0] != 'object' && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(v, index, list) {
        computed = iteratee(v, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection.
  _.shuffle = function(obj) {
    return _.sample(obj, Infinity);
  };

  // Sample **n** random values from a collection using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    var sample = isArrayLike(obj) ? _.clone(obj) : _.values(obj);
    var length = getLength(sample);
    n = Math.max(Math.min(n, length), 0);
    var last = length - 1;
    for (var index = 0; index < n; index++) {
      var rand = _.random(index, last);
      var temp = sample[index];
      sample[index] = sample[rand];
      sample[rand] = temp;
    }
    return sample.slice(0, n);
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    var index = 0;
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, key, list) {
      return {
        value: value,
        index: index++,
        criteria: iteratee(value, key, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior, partition) {
    return function(obj, iteratee, context) {
      var result = partition ? [[], []] : {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (has(result, key)) result[key]++; else result[key] = 1;
  });

  var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (_.isString(obj)) {
      // Keep surrogate pair characters together
      return obj.match(reStrSymbol);
    }
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = group(function(result, value, pass) {
    result[pass ? 0 : 1].push(value);
  }, true);

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null || array.length < 1) return n == null ? void 0 : [];
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null || array.length < 1) return n == null ? void 0 : [];
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, Boolean);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    output = output || [];
    var idx = output.length;
    for (var i = 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        // Flatten current level of array or arguments object.
        if (shallow) {
          var j = 0, len = value.length;
          while (j < len) output[idx++] = value[j++];
        } else {
          flatten(value, shallow, strict, output);
          idx = output.length;
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = restArguments(function(array, otherArrays) {
    return _.difference(array, otherArrays);
  });

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // The faster algorithm will not work with an iteratee if the iteratee
  // is not a one-to-one function, so providing an iteratee will disable
  // the faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted && !iteratee) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = restArguments(function(arrays) {
    return _.uniq(flatten(arrays, true, true));
  });

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      var j;
      for (j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = restArguments(function(array, rest) {
    rest = flatten(rest, true, true);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  });

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices.
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = restArguments(_.unzip);

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values. Passing by pairs is the reverse of _.pairs.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions.
  var createPredicateIndexFinder = function(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  };

  // Returns the first index on an array-like that passes a predicate test.
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions.
  var createIndexFinder = function(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
          i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
          length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    if (!step) {
      step = stop < start ? -1 : 1;
    }

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Chunk a single array into multiple arrays, each containing `count` or fewer
  // items.
  _.chunk = function(array, count) {
    if (count == null || count < 1) return [];
    var result = [];
    var i = 0, length = array.length;
    while (i < length) {
      result.push(slice.call(array, i, i += count));
    }
    return result;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments.
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = restArguments(function(func, context, args) {
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var bound = restArguments(function(callArgs) {
      return executeBound(func, bound, context, this, args.concat(callArgs));
    });
    return bound;
  });

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder by default, allowing any combination of arguments to be
  // pre-filled. Set `_.partial.placeholder` for a custom placeholder argument.
  _.partial = restArguments(function(func, boundArgs) {
    var placeholder = _.partial.placeholder;
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  });

  _.partial.placeholder = _;

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = restArguments(function(obj, keys) {
    keys = flatten(keys, false, false);
    var index = keys.length;
    if (index < 1) throw new Error('bindAll must be passed function names');
    while (index--) {
      var key = keys[index];
      obj[key] = _.bind(obj[key], obj);
    }
  });

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = restArguments(function(func, wait, args) {
    return setTimeout(function() {
      return func.apply(null, args);
    }, wait);
  });

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var timeout, context, args, result;
    var previous = 0;
    if (!options) options = {};

    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };

    var throttled = function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };

    throttled.cancel = function() {
      clearTimeout(timeout);
      previous = 0;
      timeout = context = args = null;
    };

    return throttled;
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;

    var later = function(context, args) {
      timeout = null;
      if (args) result = func.apply(context, args);
    };

    var debounced = restArguments(function(args) {
      if (timeout) clearTimeout(timeout);
      if (immediate) {
        var callNow = !timeout;
        timeout = setTimeout(later, wait);
        if (callNow) result = func.apply(this, args);
      } else {
        timeout = _.delay(later, wait, this, args);
      }

      return result;
    });

    debounced.cancel = function() {
      clearTimeout(timeout);
      timeout = null;
    };

    return debounced;
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  _.restArguments = restArguments;

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
    'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  var collectNonEnumProps = function(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  };

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`.
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object.
  // In contrast to _.map it returns an object.
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = _.keys(obj),
        length = keys.length,
        results = {};
    for (var index = 0; index < length; index++) {
      var currentKey = keys[index];
      results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  // The opposite of _.object.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`.
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, defaults) {
    return function(obj) {
      var length = arguments.length;
      if (defaults) obj = Object(obj);
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!defaults || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s).
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test.
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Internal pick helper function to determine if `obj` has key `key`.
  var keyInObj = function(value, key, obj) {
    return key in obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = restArguments(function(obj, keys) {
    var result = {}, iteratee = keys[0];
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      if (keys.length > 1) iteratee = optimizeCb(iteratee, keys[1]);
      keys = _.allKeys(obj);
    } else {
      iteratee = keyInObj;
      keys = flatten(keys, false, false);
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  });

  // Return a copy of the object without the blacklisted properties.
  _.omit = restArguments(function(obj, keys) {
    var iteratee = keys[0], context;
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
      if (keys.length > 1) context = keys[1];
    } else {
      keys = _.map(flatten(keys, false, false), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  });

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq, deepEq;
  eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // `null` or `undefined` only equal to itself (strict comparison).
    if (a == null || b == null) return false;
    // `NaN`s are equivalent, but non-reflexive.
    if (a !== a) return b !== b;
    // Exhaust primitive checks
    var type = typeof a;
    if (type !== 'function' && type !== 'object' && typeof b != 'object') return false;
    return deepEq(a, b, aStack, bStack);
  };

  // Internal recursive comparison function for `isEqual`.
  deepEq = function(a, b, aStack, bStack) {
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN.
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
      case '[object Symbol]':
        return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError, isMap, isWeakMap, isSet, isWeakSet.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), Safari 8 (#1929), and PhantomJS (#2236).
  var nodelist = root.document && root.document.childNodes;
  if (typeof /./ != 'function' && typeof Int8Array != 'object' && typeof nodelist != 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return !_.isSymbol(obj) && isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    return _.isNumber(obj) && isNaN(obj);
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, path) {
    if (!_.isArray(path)) {
      return has(obj, path);
    }
    var length = path.length;
    for (var i = 0; i < length; i++) {
      var key = path[i];
      if (obj == null || !hasOwnProperty.call(obj, key)) {
        return false;
      }
      obj = obj[key];
    }
    return !!length;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  // Creates a function that, when passed an object, will traverse that object’s
  // properties down the given `path`, specified as an array of keys or indexes.
  _.property = function(path) {
    if (!_.isArray(path)) {
      return shallowProperty(path);
    }
    return function(obj) {
      return deepGet(obj, path);
    };
  };

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    if (obj == null) {
      return function(){};
    }
    return function(path) {
      return !_.isArray(path) ? obj[path] : deepGet(obj, path);
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

  // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped.
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // Traverses the children of `obj` along `path`. If a child is a function, it
  // is invoked with its parent as context. Returns the value of the final
  // child, or `fallback` if any child is undefined.
  _.result = function(obj, path, fallback) {
    if (!_.isArray(path)) path = [path];
    var length = path.length;
    if (!length) {
      return _.isFunction(fallback) ? fallback.call(obj) : fallback;
    }
    for (var i = 0; i < length; i++) {
      var prop = obj == null ? void 0 : obj[path[i]];
      if (prop === void 0) {
        prop = fallback;
        i = length; // Ensure we don't continue iterating.
      }
      obj = _.isFunction(prop) ? prop.call(obj) : prop;
    }
    return obj;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offset.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    var render;
    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var chainResult = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return chainResult(this, func.apply(_, args));
      };
    });
    return _;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return chainResult(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return chainResult(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return String(this._wrapped);
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define == 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}());

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
