import React from 'react';
import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import { glsp, themeVal, media, divide } from '@devseed-ui/theme-provider';
import { reveal } from '@devseed-ui/animation';

import NasaLogo from './nasa-logo';

const appTitle = process.env.APP_TITLE;

const innerSpacingCss = (size) => css`
  gap: ${glsp(themeVal(`layout.gap.${size}`))};
  padding: ${glsp(
    divide(themeVal(`layout.gap.${size}`), 2),
    themeVal(`layout.gap.${size}`)
  )};
`;

const PageHeaderSelf = styled.header`
  ${innerSpacingCss('xsmall')}
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  background: ${themeVal('color.primary')};
  animation: ${reveal} 0.32s ease 0s 1;

  &,
  &:visited {
    color: ${themeVal('color.surface')};
  }

  ${media.smallUp`
    ${innerSpacingCss('xsmall')}
  `}

  ${media.mediumUp`
    ${innerSpacingCss('medium')}
  `}

  ${media.largeUp`
    ${innerSpacingCss('large')}
  `}

  ${media.xlargeUp`
    ${innerSpacingCss('xlarge')}
  `}
`;

const Brand = styled.div`
  a {
    display: grid;
    align-items: center;
    gap: ${glsp(0, 0.5)};

    &,
    &:visited {
      color: inherit;
      text-decoration: none;
    }

    #nasa-logo-neg-mono {
      opacity: 1;
      transition: all 0.32s ease 0s;
    }

    #nasa-logo-pos {
      opacity: 0;
      transform: translate(0, -100%);
      transition: all 0.32s ease 0s;
    }

    &:hover {
      opacity: 1;

      #nasa-logo-neg-mono {
        opacity: 0;
      }

      #nasa-logo-pos {
        opacity: 1;
      }
    }

    svg {
      grid-row: 1 / span 2;
      height: 2.5rem;
      width: auto;
      transform: scale(1.125);
    }

    span:first-of-type {
      font-size: 0.875rem;
      line-height: 1rem;
      font-weight: ${themeVal('type.base.extrabold')};
      text-transform: uppercase;
    }

    span:last-of-type {
      grid-row: 2;
      font-size: 1.25rem;
      line-height: 1.5rem;
      font-weight: ${themeVal('type.base.light')};
      letter-spacing: -0.025em;
    }
  }
`;

function PageHeader() {
  return (
    <PageHeaderSelf>
      <Brand>
        <Link to='/'>
          <NasaLogo />
          <span>Earthdata</span>
          <span>{appTitle}</span>
        </Link>
      </Brand>
    </PageHeaderSelf>
  );
}

export default PageHeader;
