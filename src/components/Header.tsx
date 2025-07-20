import React from 'react';
import { env } from '@/config/env';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListUl, faPlus } from '@fortawesome/free-solid-svg-icons';

const Header: React.FC = () => {

  return (
    <header className="header">
      <div className="header__left flex gap-30 items-center">
        <h1 className="header__logo">
          <a href={`${env.appUrl}/`} className="header__logo-link">修正指示Canvas</a>
        </h1>
      </div>
      <nav className="header__nav flex items-center gap-10">
        <a href={`${env.appUrl}/list/`} className="header__nav-link flex-center gap-5 btn-lightgray">
          <div className="fsz-16">
            <FontAwesomeIcon icon={faListUl} />
          </div>
        </a>
        <a href={`${env.appUrl}/create`} className="header__nav-link btn-new">
          <FontAwesomeIcon icon={faPlus} />新規作成
        </a>
      </nav>
    </header>
  );
};

export default Header;
