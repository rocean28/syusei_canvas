import React, { useEffect, useState, useRef } from 'react';
import type { Item } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { env } from '@/config/env';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faSort, faSearch } from '@fortawesome/free-solid-svg-icons';
import { faSort } from '@fortawesome/free-solid-svg-icons';

const ListPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 15;
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [authors, setAuthors] = useState<string[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [searchTitleInput, setSearchTitleInput] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [searchKeywordInput, setSearchKeywordInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const titleDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keywordDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // タイトル入力の監視
  useEffect(() => {
    if (titleDebounceTimer.current) {
      clearTimeout(titleDebounceTimer.current);
    }

    titleDebounceTimer.current = setTimeout(() => {
      setSearchTitle(searchTitleInput);
      setPage(1);
    }, 1000);

    return () => {
      if (titleDebounceTimer.current) {
        clearTimeout(titleDebounceTimer.current);
      }
    };
  }, [searchTitleInput]);

  // キーワード入力の監視
  useEffect(() => {
    if (keywordDebounceTimer.current) {
      clearTimeout(keywordDebounceTimer.current);
    }

    keywordDebounceTimer.current = setTimeout(() => {
      setSearchKeyword(searchKeywordInput);
      setPage(1);
    }, 1000);

    return () => {
      if (keywordDebounceTimer.current) {
        clearTimeout(keywordDebounceTimer.current);
      }
    };
  }, [searchKeywordInput]);

  useEffect(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      author: selectedAuthor,
      month: selectedMonth,
      title: searchTitle,
      keyword: searchKeyword,
      sort: sortOrder,
    });

    // console.log(`${env.apiUrl}/list.php?${params.toString()}`);

    fetch(`${env.apiUrl}/list.php?${params.toString()}`)
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

    // console.log("searchTitle:" + searchTitle);
    // console.log("searchKeyword:" + searchKeyword);
  }, [page, selectedAuthor, selectedMonth, searchTitle, searchKeyword, sortOrder]);

  useEffect(() => {
    fetch(`${env.apiUrl}/filter_options.php`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAuthors(data.authors || []);
          setMonths(data.months || []);
        }
      })
      .catch((err) => {
        console.error('フィルター情報取得エラー:', err);
      });
  }, []);

  return (
    <div className="wrap page-list">
      <Header />
      <div className="main">
        <div className="sort flex items-center gap-10 mb-20 fsz-13">
          {/* 案件名検索 */}
          <div className="search flex items-center gap-5">
            <input
              type="text"
              placeholder="案件名"
              value={searchTitleInput}
              onChange={(e) => setSearchTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchTitle(searchTitleInput);
                  setPage(1);
                }
              }}
              className="title-search"
            />
            {/* <div className="search-icon flex-center">
              <FontAwesomeIcon
                icon={faSearch}
                className="pointer fsz-12"
                onClick={() => {
                  setSearchTitle(searchTitleInput);
                  setPage(1);
                }}
              />
            </div> */}
          </div>

          {/* 修正内容検索 */}
          <div className="search flex items-center gap-5">
            <input
              type="text"
              placeholder="修正内容"
              value={searchKeywordInput}
              onChange={(e) => setSearchKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchKeyword(searchKeywordInput);
                  setPage(1);
                }
              }}
              className="title-search"
            />
            {/* <div className="search-icon flex-center">
              <FontAwesomeIcon
                icon={faSearch}
                className="pointer fsz-12"
                onClick={() => {
                  setSearchKeyword(searchKeywordInput);
                  setPage(1);
                }}
              />
            </div> */}
          </div>
          <select
            value={selectedAuthor}
            onChange={(e) => {
              setSelectedAuthor(e.target.value);
              setPage(1);
            }}
            className="author-filter"
          >
            <option value="">すべての作成者</option>
            {authors.map((author) => (
              <option key={author} value={author}>
                {author}
              </option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setPage(1);
            }}
            className="month-filter"
          >
            <option value="">すべての年月</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>

          {/* <div className="flex-center gap-5 bg-lightgray pointer px-10 py-2 rounded fsz-10">
            <FontAwesomeIcon
              icon={faSearch}
              className="pointer fsz-12"
              onClick={() => {
                setSearchTitle(searchTitleInput);
                setPage(1);
              }}
            />検索
          </div> */}
          <div
            className="flex items-center gap-5 pointer"
            onClick={() => {
              setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
              setPage(1);
            }}
          >
            <FontAwesomeIcon icon={faSort} />
            <span className="fsz-11">{sortOrder === 'asc' ? '古い順' : '新しい順'}</span>
          </div>
          <div className="fsz-14 text-gray mb-2 ml-auto mr-10">
            {total}件
          </div>
        </div>

        <ul className="card-list">
          {items.map((item) => (
            <li className="card-list__item" key={item.id}>
              <a
                href={`${env.appUrl}/${item.id}`}
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
