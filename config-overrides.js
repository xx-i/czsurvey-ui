const path = require('path');
const {
    override,
    addWebpackModuleRule,
    addWebpackAlias,
} = require('customize-cra');

const addLessLoader = require('customize-cra-less-loader');

module.exports = {
    webpack: override(
        addLessLoader({
            lessLoaderOptions: {
                lessOptions: {},
            },
        }),
        addWebpackModuleRule({
            test: /\.svg$/,
            loader: '@svgr/webpack',
        }),
        addWebpackAlias({
            '@': path.resolve(__dirname, 'src'),
        })
    ),
};