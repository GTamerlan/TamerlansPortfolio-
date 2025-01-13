const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development', // Use 'production' for optimized builds
  entry: './src/main.js', // Entry point for your JavaScript
  output: {
    filename: 'bundle.js', // Name of the output file
    path: path.resolve(__dirname, 'dist'), // Output directory
    clean: true, // Clean the dist folder before each build
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
        test: /\.(png|jpg|jpeg|gif|svg|glb|gltf|mp3)$/, // Handle static assets
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]', // Keep original file names
        },
      },
      {
        test: /\.css$/, // Handle CSS files
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html', // Your HTML file
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'myterrain', to: 'myterrain' },
        { from: 'Rover', to: 'Rover' },
        { from: 'low_poly_moon', to: 'low_poly_moon' },
        { from: 'rotunda_space_ship', to: 'rotunda_space_ship' },
        // Remove the following line if textures doesn't exist:
        // { from: 'textures', to: 'textures' },
      ],
    }),
  ],
  devServer: {
    static: './dist', // Serve files from the dist folder
    port: 3000, // Development server port
    open: true, // Automatically open the browser
    hot: true, // Enable Hot Module Replacement
  },
  resolve: {
    extensions: ['.js', '.json', '.gltf', '.glb'], // Resolve these extensions
  },
};
