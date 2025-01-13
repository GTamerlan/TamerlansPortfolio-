const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  // Entry point for your application
  entry: './src/index.js',

  // Output configuration
  output: {
    filename: 'bundle.js', // Output JS file
    path: path.resolve(__dirname, 'dist'), // Output directory
    clean: true, // Cleans the output directory before every build
  },

  // Development mode
  mode: 'development', // Change to 'production' for production builds

  // Module rules for loaders
  module: {
    rules: [
      {
        test: /\.js$/, // Transpile .js files with Babel
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(gltf|png|jpe?g|svg|mp3|wav)$/, // Handle assets like GLTF, images, audio
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]', // Output all assets to 'assets/' folder
        },
      },
    ],
  },

  // Plugins
  plugins: [
    // Plugin to copy static files
    new CopyWebpackPlugin({
      patterns: [
        { from: 'Rover', to: 'Rover' }, // Copy 'Rover' folder to 'dist/Rover'
        { from: 'low_poly_satellite', to: 'low_poly_satellite' }, // Copy 'low_poly_satellite' to 'dist/low_poly_satellite'
        { from: 'myterrain', to: 'myterrain' }, // Copy 'myterrain' to 'dist/myterrain'
      ],
    }),
  ],

  // Development server for local testing
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'), // Serve files from 'dist' folder
    },
    port: 3000, // Local server port
    open: true, // Automatically open the browser
    hot: true, // Enable Hot Module Replacement (HMR)
  },

  // Resolve extensions
  resolve: {
    extensions: ['.js'], // Resolve these extensions
  },
};
