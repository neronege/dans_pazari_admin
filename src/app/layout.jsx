import PropTypes from 'prop-types';

// third-party
import 'simplebar-react/dist/simplebar.min.css';

// fonts
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';

// project-imports
import ProviderWrapper from './ProviderWrapper';

export const metadata = {
  title: 'Mantis Next.js Dashboard',
  description:
    'Local Next.js dashboard template built with ReactJS, Material-UI, NextJS, and SWR.',
  keywords:
    'nextjs admin template, material-ui react dashboard template, reactjs admin template, reactjs dashboard, react backend template',
  author: 'Local build'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/third-party/react-table.css" />
      </head>
      <body>
        <ProviderWrapper>{children}</ProviderWrapper>
      </body>
    </html>
  );
}

RootLayout.propTypes = { children: PropTypes.node };
