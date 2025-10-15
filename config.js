// Configuration for Facebook API and other services
module.exports = {
    facebook: {
        appId: process.env.FACEBOOK_APP_ID || '2671280679876995',
        appSecret: process.env.FACEBOOK_APP_SECRET || 'aae1bb4d157b6956b97f0c5dd6f7a1a1',
        redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/auth/facebook/callback',
        scope: 'pages_show_list',
        version: 'v19.0'
    },
    server: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development'
    }
};
