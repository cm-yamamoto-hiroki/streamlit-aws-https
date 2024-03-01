const { Authenticator } = require('cognito-at-edge');

const authenticator = new Authenticator({
  // Replace these parameter values with those of your own environment
  region: '', // user pool region, ex) "us-east-1"
  userPoolId: '', // user pool ID, ex) "us-east-1_XXXXXXXXX"
  userPoolDomain: '', // user pool domain, ex) "xxxxxxxxxxx.auth.us-east-1.amazoncognito.com"
  userPoolAppId: '', // user pool app client ID, ex) "xxxxxxxxxxxxxxxxxxxxxxxxxx"
});

exports.handler = async (request) => authenticator.handle(request);