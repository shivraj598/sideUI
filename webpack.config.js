const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background/background.ts',
    sidebar: './src/sidebar/sidebar.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.json',
            transpileOnly: false,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/sidebar/sidebar.html', to: 'sidebar.html' },
        { from: 'src/sidebar/sidebar.css', to: 'sidebar.css' },
        { from: 'src/icons', to: 'icons', noErrorOnMissing: true },
      ],
    }),
  ],
};
