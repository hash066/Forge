const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    leftPanel: './forge/src/webviews/panels/LeftPanel.tsx',
    rightPanel: './forge/src/webviews/panels/RightPanel.tsx'
  },
  output: {
    path: path.resolve(__dirname, 'forge', 'dist', 'webviews'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
            'style-loader', 
            'css-loader', 
            {
                loader: 'postcss-loader',
                options: {
                    postcssOptions: {
                        plugins: [
                            require('@tailwindcss/postcss'),
                            require('autoprefixer'),
                        ],
                    },
                },
            },
        ]
      }
    ]
  }
};
