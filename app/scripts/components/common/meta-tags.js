import React from 'react';
import T from 'prop-types';
import { Helmet } from 'react-helmet';
import { useTheme } from 'styled-components';

function MetaTags({ title, description, children }) {
  const theme = useTheme();

  return (
    <Helmet>
      <title>{title}</title>
      {description ? <meta name='description' content={description} /> : null}
      <meta name='theme-color' content={theme?.color.primary} />

      {description ? (
        <meta name='twitter:description' content={description} />
      ) : null}

      {/* Additional children */}
      {children}
    </Helmet>
  );
}

MetaTags.propTypes = {
  title: T.string,
  description: T.string,
  children: T.node
};

export default MetaTags;
