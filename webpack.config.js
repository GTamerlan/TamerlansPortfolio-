const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development', // Use 'production' for optimized builds
  entry: './src/main.js', // Entry point for your JavaScript
  output: {
    filename: 'bundle.js', // Name of the bundled file
    path: path.resolve(__dirname, 'dist'), // Output directory
    clean: true, // Clean the output directory before each build
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Transpile JavaScript files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/, // Handle CSS files
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(gltf|glb)$/, // Handle GLTF/GLB model files
        type: 'asset/resource',
        generator: {
          filename: 'assets/models/[name][ext]', // Output directory for models
        },
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|mp3)$/, // Handle image and audio files
        type: 'asset/resource',
        generator: {
          filename: 'assets/media/[name][ext]', // Output directory for images/audio
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html', // Use your existing HTML file
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './myterrain', to: './myterrain' },
        { from: './Rover', to: './Rover' },
        { from: './low_poly_moon', to: './low_poly_moon' },
        { from: './rotunda_space_ship', to: './rotunda_space_ship' },
        { from: './low_poly_satellite', to: './low_poly_satellite' },
        // Add additional directories as needed
      ],
    }),
  ],
  devServer: {
    static: './dist', // Serve files from the dist directory
    port: 3000, // Development server port
    open: true, // Automatically open the browser
    hot: true, // Enable Hot Module Replacement
  },
  resolve: {
    extensions: ['.js', '.json', '.gltf', '.glb'], // Resolve these extensions
  },
};
