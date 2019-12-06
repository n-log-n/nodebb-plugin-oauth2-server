var Promise = module.parent.parent.require("bluebird"), 
    nodebbDB = module.parent.parent.require("./database"),
    db = {
      get: Promise.promisify(nodebbDB.get),
      setObject: Promise.promisify(nodebbDB.setObject),
      getObject: Promise.promisify(nodebbDB.getObject),
      delObject: Promise.promisify(nodebbDB.delete)
    };

var prefix = {
  client: 'plugins:oauthserver',
  authCode: 'plugins:oauthserver_data:authcodes:',
  token: 'plugins:oauthserver_data:tokens:',
  user: 'plugins:oauthserver_data:users:'
};

module.exports.getAccessToken = function(bearerToken) {
  return db.getObject(prefix["token"] + bearerToken)
    .then(function(token) {
      if (!token) {
        return;
      }
      token.accessTokenExpiresAt = new Date(token.accessTokenExpiresAt); 

      return token;
    });
};

module.exports.getAuthorizationCode = function(code) {
    return db.getObject(prefix["authCode"] + code).then(function(data){
      data.expiresAt = new Date(data.expiresAt);
      return data;
    });
};

module.exports.revokeAuthorizationCode = function(code) {
    return { expiresAt: new Date(new Date() / 2)};
};

module.exports.getClient = function(clientId, clientSecret) {
  return db.get(prefix["client"]).then(function(clients) {
      clients = JSON.parse(clients);
      var client = undefined;
      
      for (var i in clients){
        if (clients[i].public == clientId){
          client = clients[i];
          break;
        }
      }
      
      if (!client) {
        return;
      }      
      return {
        clientId: client.public,
        grants: ['authorization_code'],
        redirectUris: [client.callback]
      };
    });
};

module.exports.getRefreshToken = function(bearerToken) {
  return db.hgetall(prefix["token"] + bearerToken)
    .then(function(token) {
      if (!token) {
        return;
      }

      return {
        clientId: token.clientId,
        expires: token.refreshTokenExpiresOn,
        refreshToken: token.accessToken,
        userId: token.userId
      };
    });
};

module.exports.saveAuthorizationCode = function(authCode, client, user) {
  var data = {
    authorizationCode: authCode.authorizationCode,
    expiresAt: authCode.expiresAt,
    redirectUri: authCode.redirectUri,
    scope: authCode.scope,
    client: client,
    user: user
  };
  
  return Promise.all([
    db.setObject(prefix["authCode"] + data.authorizationCode, data),
  ]).return(data);
};

module.exports.saveToken = function(token, client, user) {
  var data = {
    accessToken: token.accessToken,
    accessTokenExpiresAt: new Date(new Date().getTime() + 5000*60),
    client: JSON.stringify(client),
    refreshToken: token.refreshToken,
    refreshTokenExpiresAt: token.refreshTokenExpiresAt,
    user: user
  };

  return Promise.all([
    db.setObject(prefix["token"] + token.accessToken, data),
    db.setObject(prefix["token"] + token.refreshToken, data)
  ]).return(data);
};