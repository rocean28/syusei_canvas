import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { env } from '@/config/env';
import RequireAuth from '@/components/RequireAuth';
import LoginPage from '@/pages/LoginPage';
import Editor from '@/pages/Editor';
import ListPage from '@/pages/ListPage';

const AppRouter = () => {
  return (
    <Router basename={env.basePath}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/create"
          element={
            <RequireAuth>
              <Editor mode="create" />
            </RequireAuth>
          }
        />
        <Route
          path="/edit/:id"
          element={
            <RequireAuth>
              <Editor mode="edit" />
            </RequireAuth>
          }
        />
        <Route
          path="/:id"
          element={
            <RequireAuth>
              <Editor mode="view" />
            </RequireAuth>
          }
        />
        <Route
          path="/list"
          element={
            <RequireAuth>
              <ListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Editor mode="create" />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;