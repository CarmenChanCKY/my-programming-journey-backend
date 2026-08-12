const path = require("path");
const nodeExternals = require("webpack-node-externals");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
  mode: "production",
  target: "node",
  context: path.resolve(__dirname, "../../scripts"),
  entry: "./create-admin.ts",
  externals: [nodeExternals({ modulesDir: path.resolve(__dirname, "../../node_modules") })],
  output: {
    path: path.resolve(__dirname, "../../dist"),
    filename: "create-admin.js",
  },
  resolve: {
    plugins: [new TsconfigPathsPlugin({ configFile: path.resolve(__dirname, "../../tsconfig.json") })],
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: "ts-loader",
        options: {
          configFile: path.resolve(__dirname, "../../tsconfig.json"),
          transpileOnly: true,
        },
      },
    ],
  },
};