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
        { from: '1u_cubesat', to: '1u_cubesat' },
        { from: 'chess_logo', to: 'chess_logo' },
        { from: 'Classroom', to: 'Classroom' },
        { from: 'FinalTerrain', to: 'FinalTerrain' },
        { from: 'low_poly_moon', to: 'low_poly_moon' },
        { from: 'low_poly_satellite', to: 'low_poly_satellite' },
        { from: 'lowpoly_space_scene', to: 'lowpoly_space_scene' },
        { from: 'mars_one_mission_-_base', to: 'mars_one_mission_-_base' },
        { from: 'myterrain', to: 'myterrain' },
        { from: 'nasa_rover', to: 'nasa_rover' },
        { from: 'rotunda_space_ship', to: 'rotunda_space_ship' },
        { from: 'Rover', to: 'Rover' },
        { from: 'rover_model_project', to: 'rover_model_project' },
        { from: 'showdown_environment_brawl_stars', to: 'showdown_environment_brawl_stars' },
        { from: 'sky_pano_-_milkyway', to: 'sky_pano_-_milkyway' },
        { from: 'space_exploration_wlp_series_8', to: 'space_exploration_wlp_series_8' },
        { from: 'star', to: 'star' },
        { from: 'terrain', to: 'terrain' },
        { from: 'roversound.mp3', to: 'roversound.mp3' }, // Add the sound file
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
