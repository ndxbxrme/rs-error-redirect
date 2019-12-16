(function() {
  var angular, moduleName;

  moduleName = 'rs-error-redirect';

  angular = window.angular || require('angular');

  angular.module(moduleName, ['rs-storage', 'rs-auth']).provider('errorRedirect', function() {
    return {
      $get: function($state, $timeout, $q, $injector, storage) {
        return {
          request: function(config) {
            var auth, defer, token;
            defer = $q.defer();
            if (/^\/api\//.test(config.url)) {
              token = storage.get('token');
              if (token && new Date(token.expires) > new Date()) {
                config.headers.Authorization = 'Bearer ' + token.accessToken;
                defer.resolve(config);
              } else {
                auth = $injector.get('auth');
                auth.refreshToken(token).then(function(newToken) {
                  config.headers.Authorization = newToken.accessToken;
                  return defer.resolve(config);
                });
              }
            } else {
              defer.resolve(config);
            }
            return defer.promise;
          },
          response: function(res) {
            if (res.data === 'unauthorized') {
              res.status = 401;
              $state.go('login');
            }
            return res;
          },
          responseError: function(rejection) {
            if (rejection.status === 401) {
              $timeout(function() {
                return $state.go('login');
              });
            }
            return rejection;
          }
        };
      }
    };
  }).config(function($httpProvider) {
    return $httpProvider.interceptors.unshift('errorRedirect');
  }).run(function($transitions, $timeout, $http, auth) {
    return $transitions.onBefore({}, function(trans) {
      var ref;
      auth.refreshLogin(trans._deferred, (ref = trans.$to().data) != null ? ref.auth : void 0);
      return trans.promise;
    });
  });

  module.exports = moduleName;

}).call(this);

//# sourceMappingURL=index.js.map
