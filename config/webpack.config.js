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
const paths = require("./paths");
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");
const getClientEnvironment = require("./env");
const ModuleNotFoundPlugin = require("react-dev-utils/ModuleNotFoundPlugin");
const ForkTsCheckerWebpackPlugin = require("react-dev-utils/ForkTsCheckerWarningWebpackPlugin");
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
                : "static/js/[name].js",
            chunkFilename: isEnvProduction
                ? "static/js/[name].[contenthash:8].chunk.js"
                : "static/js/[name].chunk.js",
            publicPath: paths.publicUrlOrPath,
            devtoolModuleFilenameTemplate: isEnvProduction
                ? (info) =>
                      path
                          .relative(paths.appSrc, info.absoluteResourcePath)
                          .replace(/\\/g, "/")
                : (info) =>
                      path
                          .resolve(info.absoluteResourcePath)
                          .replace(/\\/g, "/")
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
                history: process.cwd() + "/node_modules/history",
                "react-native": "react-native-web",
                react: process.cwd() + "/node_modules/react",
                "react-dom": process.cwd() + "/node_modules/react-dom",
                "react-router": process.cwd() + "/node_modules/react-router",
                "react-router-dom":
                    process.cwd() + "/node_modules/react-router-dom",
                "@emotion/react":
                    process.cwd() + "/node_modules/@emotion/react",
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
            strictExportPresence: true,
            rules: [
                {
                    enforce: "pre",
                    exclude: /@babel(?:\/|\\{1,2})runtime/,
                    test: /\.(js|mjs|jsx|ts|tsx|css)$/,
                    loader: require.resolve("source-map-loader")
                },
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

            new webpack.IgnorePlugin({
                resourceRegExp: /^\.\/locale$/,
                contextRegExp: /moment$/
            }),

            isEnvProduction &&
                new WorkboxWebpackPlugin.InjectManifest({
                    dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
                    exclude: [/\.map$/, /asset-manifest\.json$/, /LICENSE/],
                    // Bump up the default maximum size (2mb) that's precached,
                    // to make lazy-loading failure scenarios less likely.
                    // See https://github.com/cra-template/pwa/issues/13#issuecomment-722667270
                    maximumFileSizeToCacheInBytes: 10 * 1024 * 1024
                }),
            new ForkTsCheckerWebpackPlugin({
                async: isEnvDevelopment,
                typescript: {
                    typescriptPath: resolve.sync("typescript", {
                        basedir: paths.appNodeModules
                    }),
                    configOverwrite: {
                        compilerOptions: {
                            sourceMap: isEnvProduction
                                ? shouldUseSourceMap
                                : isEnvDevelopment,
                            skipLibCheck: true,
                            inlineSourceMap: false,
                            declarationMap: false,
                            noEmit: true,
                            incremental: true,
                            tsBuildInfoFile: paths.appTsBuildInfoFile
                        }
                    },
                    context: paths.appPath,
                    diagnosticOptions: {
                        syntactic: true
                    },
                    mode: "write-references"
                    // profile: true,
                },
                issue: {
                    // This one is specifically to match during CI tests,
                    // as micromatch doesn't match
                    // '../cra-template-typescript/template/src/App.tsx'
                    // otherwise.
                    include: [
                        { file: "../**/src/**/*.{ts,tsx}" },
                        { file: "**/src/**/*.{ts,tsx}" }
                    ],
                    exclude: [
                        { file: "**/src/**/__tests__/**" },
                        { file: "**/src/**/?(*.){spec|test}.*" },
                        { file: "**/src/setupProxy.*" },
                        { file: "**/src/setupTests.*" }
                    ]
                },
                logger: {
                    infrastructure: "silent"
                }
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
                resolvePluginsRelativeTo: __dirname
            })
        ].filter((x) => x),
        performance: false
    };
};
