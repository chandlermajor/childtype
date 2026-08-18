import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import type { Configuration } from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 通过 --env browser=chrome 或 BROWSER 环境变量控制
const envBrowser = process.env.BROWSER || 'firefox';

const entry: Record<string, string> = {
  app: './src/pages/app.ts',
};

if (envBrowser === 'chrome') {
  entry.background = './src/browser-chrome/background.ts';
} else {
  entry.background = './src/browser-firefox/background.ts';
}

const plugins: any[] = [
  new HtmlWebpackPlugin({
    template: './src/pages/index.html',
    filename: 'index.html',
    chunks: ['app'],
  }),
  new CopyPlugin({
    patterns: [
      {
        from: envBrowser === 'firefox'
          ? './src/browser-firefox/manifest.json'
          : './src/browser-chrome/manifest.json',
        to: 'manifest.json',
      },
      {
        from: './icons',
        to: 'icons',
      },
    ],
  }),
];

const config: Configuration = {
  mode: 'production',
  entry,
  output: {
    path: path.resolve(__dirname, 'build', envBrowser),
    filename: '[name].js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@shared': path.resolve(__dirname, 'src', 'shared'),
      '@lib': path.resolve(__dirname, 'src', 'lib'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: { transpileOnly: true },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins,
  devtool: 'source-map',
};

export default config;
