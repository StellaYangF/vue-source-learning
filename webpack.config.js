const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
    entry: path.resolve(__dirname, 'src/index'),
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    devtool: 'source-map',
    resolve: {
        modules: [path.resolve(__dirname), 'node_modules'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'public/index.html')
        })
    ],
}