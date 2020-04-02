const path = require('path');
const resolve = (...args)=> path.resolve(__dirname, ...args);
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: resolve('src', 'index.js'),
    output: {
        filename: '[name].js',
        path: resolve('dist'),
    },
    resolve: {
        extensions: ['.js'],
        modules: [ resolve('source'), resolve('node_modules') ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: resolve('public/index.html'),
        }),
    ]
}