const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    components: path.resolve('src/shared/components/index.ts'),
    options: path.resolve('src/options/options.tsx'),
    popup: path.resolve('src/popup/popup.tsx'),
    background: path.resolve('src/scripts/background.ts'),
    constants: path.resolve('src/shared/constants.ts'),
    'content-script': path.resolve('src/scripts/content-script.ts'),
    types: path.resolve('src/shared/types.ts'),
  },
  module: {
    rules: [
      {
        use: 'ts-loader',
        test: /\.tsx?$/,
        exclude: /node_modules/,
      },
      {
        use: ['style-loader', 'css-loader'],
        test: /\.css$/i,
      },
      {
        type: 'asset/resource',
        test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  output: {
    filename: '[name].js',
    path: path.resolve('dist'),
  },
  performance: {
    maxEntrypointSize: 285000,
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('src/static'),
          to: path.resolve('dist'),
        },
      ],
    }),
    ...getHtmlPlugin(['popup', 'options']),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};

function getHtmlPlugin(chunks) {
  return chunks.map(
    (chunk) =>
      new HtmlPlugin({
        title: 'Hume Extension',
        filename: `${chunk}.html`,
        chunks: [chunk],
      })
  );
}
