import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import webpack from "webpack";

const config: webpack.Configuration = {
  entry: {
    "bundle": "./app/main.ts",
    __less: "./style/main.less",
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.less$/,
        use: [MiniCssExtractPlugin.loader, {
          loader: "css-loader",
          options: {
            url: false,
          },
        }, "less-loader"],
      },
      {
        test: /\.ya?ml$/,
        use: "yaml-loader",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js", ".less"],
    extensionAlias: {
      ".js": [".js", ".ts"],
    },
  },
  output: {
    filename: "[name]-dev.js",
    path: path.resolve("docs"),
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "bundle-dev.css",
    }),
  ],
};

export default config;
