moduleName = 'rs-error-redirect'
angular = window.angular or require 'angular'
angular.module moduleName, [
  'rs-storage'
  'rs-auth'
]
.provider 'errorRedirect', ->
  $get: ($state, $timeout, $q, $injector, storage) ->
    request: (config) ->
      defer = $q.defer()
      if /^\/api\//.test config.url
        token = storage.get 'token'
        if token and new Date(token.expires) > new Date()
          config.headers.Authorization = 'Bearer ' + token.accessToken
          defer.resolve config
        else
          auth = $injector.get 'auth'
          auth.refreshToken token
          .then (newToken) ->
            config.headers.Authorization = newToken.accessToken
            defer.resolve config
      else
        defer.resolve config
      defer.promise
    response: (res) ->
      if res.data is 'unauthorized'
        res.status = 401
        $state.go 'login'
      res
    responseError: (rejection) ->
      if rejection.status is 401
        $timeout ->
          $state.go 'login'
      rejection
.config ($httpProvider) ->
  $httpProvider.interceptors.unshift 'errorRedirect'
.run ($transitions, $timeout, $http, auth) ->
  $transitions.onBefore {}, (trans) ->
    auth.refreshLogin trans._deferred, trans.$to().data?.auth
    trans.promise
module.exports = moduleName