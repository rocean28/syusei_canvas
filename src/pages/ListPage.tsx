import React, { useEffect, useState } from 'react';
import type { Item } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { env } from '@/config/env';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faSearch } from '@fortawesome/free-solid-svg-icons';

const ListPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 15;
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    fetch(`${env.apiUrl}/list.php?page=${page}&per_page=${perPage}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setItems(data.items || []);
          setTotal(data.total || 0);
        }
      })
      .catch((err) => {
        console.error('一覧取得エラー:', err);
      });
  }, [page]);

  const authors = Array.from(
    new Set(items.map(item => item.created_by).filter(Boolean))
  );

  const months = Array.from(
    new Set(items.map(item => item.created_at?.slice(0, 7)).filter(Boolean))
  ).sort().reverse(); // 最新の月を先頭に

  const filteredItems = items
  .filter(item =>
    (selectedAuthor === '' || item.created_by === selectedAuthor) &&
    (selectedMonth === '' || item.created_at.startsWith(selectedMonth)) &&
    (searchKeyword === '' || item.title.toLowerCase().includes(searchKeyword.toLowerCase()))
  )
  .sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
  });

  return (
    <div className="wrap page-list">
      <Header />
      <div className="main">
        <div className="sort flex items-center gap-10 mb-20 fsz-13">
          <div className="search flex items-center gap-5">
            <input
              type="text"
              placeholder="案件名"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchKeyword(searchInput);
                }
              }}
              className="title-search"
            />
            <div className="search-icon flex-center">
              <FontAwesomeIcon
                icon={faSearch}
                className="pointer fsz-12"
                onClick={() => setSearchKeyword(searchInput)}
              />
            </div>
          </div>
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="author-filter"
          >
            <option value="">すべての作成者</option>
            {authors.map(author => (
              <option key={author} value={author}>{author}</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-filter"
          >
            <option value="">すべての年月</option>
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <div
            className="flex items-center gap-5 pointer"
            onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
          >
            <FontAwesomeIcon icon={sortOrder === 'asc' ? faArrowUp : faArrowDown} />
            <span className="fsz-11">{sortOrder === 'asc' ? '古い順' : '新しい順'}</span>
          </div>
          <div className="fsz-14 text-gray mb-2 ml-auto mr-10">
            {filteredItems.length}件
          </div>
        </div>
        <ul className="card-list">
          {filteredItems.map((item) => (
            <li className="card-list__item" key={item.id}>
              <a
                href={`${env.appUrl}/view/${item.id}`}
                className="card-list__item-inner"
              >
                <div className="card-list__image mb-5">
                  {item.image ? (() => {
                    const date = new Date(item.created_at);
                    const Y = date.getFullYear().toString();
                    const mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    const src = `${env.serverUrl}/uploads/${Y}/${mm}/${item.id}/${item.image}`;

                    return (
                      <img
                        src={src}
                        alt=""
                        className="object-fit object-cover object-top rounded"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.onerror = null;
                          img.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.textContent = '(˙◁˙)';
                          fallback.className = 'text-lightgray fsz-20';
                          img.parentNode?.appendChild(fallback);
                        }}
                      />
                    );
                  })() : (
                    <div className="text-lightgray fsz-20">(·_·)</div>
                  )}
                </div>
                <div className="card-list__bottom">
                  <div className="mb-5 fsz-14">{item.title}</div>
                  <div className="card-list__info mt-10 fsz-10">
                    <div className="text-gray text-right">{item.created_by}</div>
                    <div className="text-gray text-right">{item.created_at}</div>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
        <div className="pagination mt-20">
          {Array.from({ length: Math.ceil(total / perPage) }, (_, i) => (
            <div
              key={i}
              onClick={() => setPage(i + 1)}
              className={`page-button ${page === i + 1 ? 'is-current' : ''}`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ListPage;
