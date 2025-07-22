const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/main.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './public')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader, {
            loader: "css-loader",
            options: {
              url: false,
            },
          },
          'less-loader'
        ]
      },
      {
        test: /\.ya?ml$/,
        use: "yaml-loader",
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset', // 100kb 이하면 자동으로 base64 인라인, 크면 파일로
        parser: {
          dataUrlCondition: {
            maxSize: 100 * 1024 // 100kb
          }
        }
      },
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'styles.css' }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      API_URI: JSON.stringify(
        process.env.NODE_ENV === 'production'
          ? 'https://api-v2.matedevdao.workers.dev'
          : 'http://localhost:8082'
      )
    })
  ],
  devServer: {
    static: './public',
    historyApiFallback: true,
    client: {
      overlay: false,
      logging: 'none'
    },
    open: true
  },
  mode: 'development'
};
