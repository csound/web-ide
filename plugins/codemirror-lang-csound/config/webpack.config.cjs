const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isProdBuild = process.env.NODE_ENV === 'production';

module.exports = {
  entry: isProdBuild ? './src/index.ts' : './src/dev.ts',
  experiments: {
    outputModule: true,
  },
  module: {
    rules: [
      {
        test: /\.(grammar|terms|terms\.js)$/,
        use: require.resolve('./lezer-loader.cjs'),
      },
      {
        test: !isProdBuild
          ? /\.tsx?$/
          : function (modulePath) {
              return (
                modulePath.endsWith('.ts') && !modulePath.endsWith('dev.ts')
              );
            },
        use: 'ts-loader',
        exclude: isProdBuild ? /node_modules|dev\.ts/ : /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, '../dist'),
    library: {
      type: 'module',
    },
  },
  externals: isProdBuild
    ? {
        //'@lezer/common': '@lezer/common',
        // codemirror: 'codemirror',
        '@codemirror/commands': '@codemirror/commands',
        '@codemirror/search': '@codemirror/search',
        '@codemirror/language': '@codemirror/language',
        '@codemirror/autocomplete': '@codemirror/autocomplete',
        '@codemirror/view': '@codemirror/view',
        '@codemirror/state': '@codemirror/state',
      }
    : {},
  ...(isProdBuild
    ? {}
    : {
        devtool: 'source-map',
        mode: 'development',
        devServer: {
          static: './dist',
          hot: false,
        },
      }),

  plugins: isProdBuild
    ? []
    : [
        new HtmlWebpackPlugin({
          template: 'dev/index.html',
          title: 'Development',
        }),
      ],
};
