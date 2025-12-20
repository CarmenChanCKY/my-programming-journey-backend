const path = require("path");
const nodeExternals = require("webpack-node-externals");
const WebpackShellPluginNext = require("webpack-shell-plugin-next");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV,
  devtool: "inline-source-map",
  target: "node",
  context: path.resolve(__dirname, "src"),
  entry: "src/index.ts",
  watch: process.env.NODE_ENV === "development",
  externals: [nodeExternals()],
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    publicPath: "dist",
  },
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
    extensions: [".ts", ".tsx", ".js"],
  },
  plugins: [
    new WebpackShellPluginNext({
      onBuildEnd: { scripts: ["npm run run:dev"] },
    }),
  ],
  module: {
    rules: [{ test: /\.tsx?$/, exclude: /node_modules/, loader: "ts-loader" }],
  },
};
