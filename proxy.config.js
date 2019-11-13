const proxy = [
    {
      context: '/api',
      target: 'https://via.placeholder.com',
      pathRewrite: {'^/api' : ''}
    }
  ];
  module.exports = proxy;