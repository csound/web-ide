const {
    addBabelPlugin,
    addBabelPreset,
    addWebpackAlias,
    addWebpackPlugin,
    override
} = require("customize-cra");
const SitemapPlugin = require("sitemap-webpack-plugin").default;
const RobotstxtPlugin = require("robotstxt-webpack-plugin");
const path = require("path");
const R = require("ramda");

// https://github.com/itgalaxy/generate-robotstxt
const robotsOpts = {
    policy: [
        {
            userAgent: "*",
            disallow: ["/search", "/404"]
        }
    ],
    sitemap: "https://ide.csound.com/sitemap.xml",
    host: "https://ide.csound.com"
};

const paths = [
    {
        path: "/documentation",
        lastmod: "2020-03-31",
        priority: "0.1",
        changefreq: "monthly"
    },
    {
        path: "/editor",
        lastmod: "2020-03-31",
        priority: "0.1",
        changefreq: "monthly"
    },
    {
        path: "/",
        lastmod: "2020-03-31",
        priority: "0.7",
        changefreq: "daily"
    }
];

module.exports = override(
    addBabelPlugin("emotion"),
    addBabelPreset("@emotion/babel-preset-css-prop"),
    addWebpackAlias({
        ["@root"]: path.resolve(__dirname, "./src"),
        ["@styles"]: path.resolve(__dirname, "./src/styles"),
        ["@comp"]: path.resolve(__dirname, "./src/components"),
        ["@elem"]: path.resolve(__dirname, "./src/elements"),
        ["@config"]: path.resolve(__dirname, "./src/config"),
        ["@store"]: path.resolve(__dirname, "./src/store")
    }),
    R.when(
        R.always(R.propEq("PRODUCTION", "1", process.env)),
        addWebpackPlugin(new SitemapPlugin("https://ide.csound.com", paths))
    ),
    R.when(
        R.always(R.propEq("PRODUCTION", "1", process.env)),
        addWebpackPlugin(new RobotstxtPlugin(robotsOpts))
    )
);
