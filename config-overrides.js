const webpack = require("webpack");

module.exports = function override(config) {
  // Add polyfills for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    path: require.resolve("path-browserify"),
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    url: require.resolve("url"),
    buffer: require.resolve("buffer"),
    assert: require.resolve("assert"),
    stream: require.resolve("stream-browserify"),
    process: require.resolve("process"),
  };

  // Add plugins to provide process/buffer globals
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: "process",
      Buffer: ["buffer", "Buffer"],
    })
  );

  // Add loader for WebWorkers
  config.module.rules.push({
    test: /pdf\.worker\.(min\.)?js/,
    type: "asset/resource",
    generator: {
      filename: "static/js/[name].[contenthash:8][ext]",
    },
  });

  // Add source-map-loader to handle source maps in dependencies
  config.module.rules.push({
    test: /\.js$/,
    enforce: "pre",
    use: ["source-map-loader"],
  });

  // Ignore warnings from specific modules
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /Critical dependency: the request of a dependency is an expression/,
    /Can't resolve '.*\/pdf\.worker\.entry'/,
  ];

  return config;
};
