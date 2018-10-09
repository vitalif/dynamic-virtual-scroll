const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    main: [ "babel-polyfill", './main.js' ]
  },
  context: __dirname,
  output: {
    path: __dirname,
    filename: 'dist/[name].js'
  },
  module: {
    rules: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules(?!\/react-toolbox\/components)/
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: true, // default is false
              sourceMap: true,
              importLoaders: 1,
              localIdentName: "[name]--[local]--[hash:base64:8]"
            }
          },
          "postcss-loader"
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
         NODE_ENV: JSON.stringify(process.env.NODE_ENV || "production")
       }
    })
  ],
  performance: {
    maxEntrypointSize: 3000000,
    maxAssetSize: 3000000
  }
};
