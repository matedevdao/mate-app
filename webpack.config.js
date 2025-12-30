const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/main.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, process.env.NODE_ENV === 'production' ? './public' : './public-dev')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, {
            loader: "css-loader",
            options: {
              url: false,
            },
          }
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
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      '@tanstack/react-query': path.resolve(__dirname, 'node_modules/@tanstack/react-query'),
      '@react-native-async-storage/async-storage': false,
    },
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'styles.css' }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      APP_NAME: JSON.stringify('Mate'),
      WALLET_CONNECT_PROJECT_ID: JSON.stringify('faa5a33f9f8688fcb9bc3c412e6a8ddb'),
      API_BASE_URI: JSON.stringify(
        process.env.NODE_ENV === 'production'
          ? 'https://api-v2.matedevdao.workers.dev'
          : 'http://localhost:8081'
      ),
      NFT_API_BASE_URI: JSON.stringify(
        process.env.NODE_ENV === 'production'
          ? 'https://nft-api.matedevdao.workers.dev'
          : 'http://localhost:8082'
      ),
      VAPID_PUBLIC_KEY: JSON.stringify(
        process.env.VAPID_PUBLIC_KEY || ''
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
