"use strict";

const fs = require("fs");
const path = require("path");
const R = require("ramda");
const webpack = require("webpack");
const resolve = require("resolve");
const PnpWebpackPlugin = require("pnp-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const TerserPlugin = require("terser-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const InterpolateHtmlPlugin = require("react-dev-utils/InterpolateHtmlPlugin");
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");
const WatchMissingNodeModulesPlugin = require("react-dev-utils/WatchMissingNodeModulesPlugin");
const paths = require("./paths");
const getClientEnvironment = require("./env");
const ModuleNotFoundPlugin = require("react-dev-utils/ModuleNotFoundPlugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const typescriptFormatter = require("react-dev-utils/typescriptFormatter");
const RobotstxtPlugin = require("robotstxt-webpack-plugin");
const SitemapPlugin = require("sitemap-webpack-plugin").default;
const ESLintPlugin = require("eslint-webpack-plugin");

const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";
const shouldInlineRuntimeChunk = false;

const imageInlineSizeLimit = parseInt(
    process.env.IMAGE_INLINE_SIZE_LIMIT || "10000"
);

module.exports = function (webpackEnv = "production") {
    const isEnvDevelopment = webpackEnv === "development";
    const isEnvProduction = webpackEnv === "production";
    const isProdDeployment = R.propEq(
        "REACT_APP_DATABASE",
        "PROD",
        process.env
    );

    const isEnvProductionProfile =
        isEnvProduction && process.argv.includes("--profile");
    const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

    return {
        mode: isEnvProduction
            ? "production"
            : isEnvDevelopment && "development",
        // Stop compilation early in production
        bail: isEnvProduction,
        devtool: "source-map",

        entry: [
            isEnvDevelopment &&
                require.resolve("react-dev-utils/webpackHotDevClient"),

            paths.appIndexJs
        ].filter((x) => x),
        output: {
            path: paths.appBuild,
            pathinfo: isEnvDevelopment,
            filename: isEnvProduction
                ? "static/js/[name].[contenthash:8].js"
                : isEnvDevelopment && "static/js/[name].js",
            chunkFilename: isEnvProduction
                ? "static/js/[name].[contenthash:8].chunk.js"
                : isEnvDevelopment && "static/js/[name].chunk.js",
            publicPath: paths.publicUrlOrPath,
            devtoolModuleFilenameTemplate: isEnvProduction
                ? (info) =>
                      path
                          .relative(paths.appSrc, info.absoluteResourcePath)
                          .replace(/\\/g, "/")
                : isEnvDevelopment &&
                  ((info) =>
                      path
                          .resolve(info.absoluteResourcePath)
                          .replace(/\\/g, "/")),
            globalObject: "this"
        },
        optimization: {
            minimize: isEnvProduction,
            minimizer: [
                // This is only used in production mode
                new TerserPlugin({
                    terserOptions: {
                        // Added for profiling in devtools
                        keep_classnames: isEnvProductionProfile,
                        keep_fnames: isEnvProductionProfile
                    }
                })
            ],
            // Automatically split vendor and commons
            splitChunks: {
                chunks: "all",
                name: false
            },
            // Keep the runtime chunk separated to enable long term caching
            runtimeChunk: {
                name: (entrypoint) => `runtime-${entrypoint.name}`
            }
        },
        resolve: {
            extensions: [".js", ".jsx", ".ts", ".tsx"],
            modules: [
                path.resolve(__dirname, "../src"),
                "node_modules",
                paths.appNodeModules
            ],
            alias: {
                "@root": path.resolve(__dirname, "../src"),
                "@styles": path.resolve(__dirname, "../src/styles"),
                "@comp": path.resolve(__dirname, "../src/components"),
                "@elem": path.resolve(__dirname, "../src/elements"),
                "@config": path.resolve(__dirname, "../src/config"),
                "@store": path.resolve(__dirname, "../src/store"),
                "react-native": "react-native-web",
                // Allows for better profiling with ReactDevTools
                ...(isEnvProductionProfile && {
                    "react-dom$": "react-dom/profiling",
                    "scheduler/tracing": "scheduler/tracing-profiling"
                })
            },
            fallback: {
                stream: require.resolve("stream-browserify")
            }
        },
        resolveLoader: {
            plugins: [PnpWebpackPlugin.moduleLoader(module)]
        },
        module: {
            rules: [
                {
                    test: /\.css$/i,
                    sideEffects: true,
                    use: ["style-loader", "css-loader"],
                    include: path.resolve(__dirname, "../")
                },
                {
                    test: /\.(orc|sco|csd)$/i,
                    use: "raw-loader"
                },
                {
                    test: /.tsx?$/,
                    use: [
                        {
                            loader: "ts-loader",
                            options: { transpileOnly: true }
                        }
                    ]
                },
                {
                    test: /\.(jsx?)$|\.(tsx?)$/i,
                    exclude: path.resolve(__dirname, "../node_modules/"),

                    use: [
                        { loader: "babel-loader", options: { babelrc: true } }
                    ]
                },
                {
                    // "oneOf" will traverse all following loaders until one will
                    // match the requirements. When no loader matches it will fall
                    // back to the "file" loader at the end of the loader list.
                    oneOf: [
                        // "url" loader works like "file" loader except that it embeds assets
                        // smaller than specified limit in bytes as data URLs to avoid requests.
                        // A missing `test` is equivalent to a match.
                        {
                            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                            loader: require.resolve("url-loader"),
                            options: {
                                limit: imageInlineSizeLimit,
                                name: "static/media/[name].[hash:8].[ext]"
                            }
                        },
                        // "file" loader makes sure those assets get served by WebpackDevServer.
                        // When you `import` an asset, you get its (virtual) filename.
                        // In production, they would get copied to the `build` folder.
                        // This loader doesn't use a "test" so it will catch all modules
                        // that fall through the other loaders.
                        {
                            loader: require.resolve("file-loader"),
                            // Exclude `js` files to keep "css" loader working as it injects
                            // its runtime that would otherwise be processed through "file" loader.
                            // Also exclude `html` and `json` extensions so they get processed
                            // by webpacks internal loaders.
                            exclude: [
                                /\.(js|mjs|jsx|ts|tsx|css)$/,
                                /\.(orc|sco|csd)$/i,
                                /\.html$/,
                                /\.json$/
                            ],
                            options: {
                                name: "static/media/[name].[hash:8].[ext]"
                            }
                        }
                        // ** STOP ** Are you adding a new loader?
                        // Make sure to add the new loader(s) before the "file" loader.
                    ]
                }
            ]
        },
        plugins: [
            // Generates an `index.html` file with the <script> injected.
            new HtmlWebpackPlugin(
                Object.assign(
                    {},
                    {
                        inject: true,
                        template: paths.appHtml
                    },
                    isEnvProduction
                        ? {
                              minify: {
                                  removeComments: true,
                                  collapseWhitespace: true,
                                  removeRedundantAttributes: true,
                                  useShortDoctype: true,
                                  removeEmptyAttributes: true,
                                  removeStyleLinkTypeAttributes: true,
                                  keepClosingSlash: true,
                                  minifyJS: true,
                                  minifyCSS: true,
                                  minifyURLs: true
                              }
                          }
                        : undefined
                )
            ),

            isEnvProduction &&
                shouldInlineRuntimeChunk &&
                new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [
                    /runtime-.+[.]js/
                ]),

            new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),

            new ModuleNotFoundPlugin(paths.appPath),

            new webpack.DefinePlugin({
                ...env.stringified,
                "process.platform": `'${process.platform.toString()}'`
            }),
            // This is necessary to emit hot updates (currently CSS only):
            isEnvDevelopment && new webpack.HotModuleReplacementPlugin(),
            isEnvDevelopment && new CaseSensitivePathsPlugin(),
            isEnvDevelopment &&
                new WatchMissingNodeModulesPlugin(paths.appNodeModules),

            isProdDeployment &&
                new RobotstxtPlugin({
                    policy: [
                        {
                            userAgent: "*",
                            disallow: ["/search", "/404"]
                        }
                    ],
                    sitemap: "https://ide.csound.com/sitemap.xml",
                    host: "https://ide.csound.com"
                }),
            isProdDeployment &&
                new SitemapPlugin({
                    base: "https://ide.csound.com",
                    paths: [
                        {
                            path: "/documentation",
                            lastmod: "2021-01-20",
                            priority: 0.1,
                            changefreq: "monthly"
                        },
                        {
                            path: "/editor",
                            lastmod: "2021-01-20",
                            priority: 0.1,
                            changefreq: "monthly"
                        },
                        {
                            path: "/",
                            lastmod: "2021-01-20",
                            priority: 0.7,
                            changefreq: "daily"
                        }
                    ]
                }),
            isEnvProduction &&
                new WebpackManifestPlugin({
                    fileName: "asset-manifest.json",
                    publicPath: paths.publicUrlOrPath,
                    generate: (seed, files, entrypoints) => {
                        const manifestFiles = files.reduce((manifest, file) => {
                            manifest[file.name] = file.path;
                            return manifest;
                        }, seed);
                        const entrypointFiles = entrypoints.main.filter(
                            (fileName) => !fileName.endsWith(".map")
                        );

                        return {
                            files: manifestFiles,
                            entrypoints: entrypointFiles
                        };
                    }
                }),

            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

            isEnvProduction &&
                new WorkboxWebpackPlugin.GenerateSW({
                    maximumFileSizeToCacheInBytes: 5000000,
                    clientsClaim: true,
                    exclude: [/\.map$/, /asset-manifest\.json$/],
                    navigateFallback: paths.publicUrlOrPath + "index.html",
                    navigateFallbackDenylist: [
                        // Exclude URLs starting with /_, as they're likely an API call
                        new RegExp("^/_"),
                        // Exclude any URLs whose last part seems to be a file extension
                        // as they're likely a resource and not a SPA route.
                        // URLs containing a "?" character won't be blacklisted as they're likely
                        // a route with query params (e.g. auth callbacks).
                        new RegExp("/[^/?]+\\.[^/]+$")
                    ]
                }),
            new ForkTsCheckerWebpackPlugin({
                typescript: {
                    enabled: true,
                    build: true,
                    typescriptPath: require.resolve("typescript"),
                    configFile: path.resolve(__dirname, "../tsconfig.json")
                },
                eslint: {
                    files:
                        path.resolve(__dirname, "../src") +
                        "/**/*.{ts,tsx,js,jsx}"
                },
                async: false,
                formatter: isEnvProduction ? typescriptFormatter : undefined
            }),
            new ESLintPlugin({
                // Plugin options
                extensions: ["js", "mjs", "jsx", "ts", "tsx"],
                formatter: require.resolve("react-dev-utils/eslintFormatter"),
                eslintPath: require.resolve("eslint"),
                context: paths.appSrc,
                emitWarning: true,
                emitError: true,
                cache: true,
                cacheLocation: path.resolve(
                    paths.appNodeModules,
                    ".cache/.eslintcache"
                ),
                // ESLint class options
                cwd: paths.appPath,
                resolvePluginsRelativeTo: __dirname,
                baseConfig: {
                    extends: [require.resolve("eslint-config-react-app/base")]
                }
            })
        ].filter((x) => x),
        performance: false
    };
};
