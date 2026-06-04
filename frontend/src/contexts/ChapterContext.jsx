import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ChapterContext = createContext(null);

export function ChapterProvider({ children }) {
  const { apiRequest } = useAuth();
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);

  const fetchChapters = async () => {
    const { status, data } = await apiRequest('/api/v1/chapters/', 'GET', null, false);
    if (status === 200) {
      setChapters(data);
      if (data.length > 0) {
        const savedSlug = localStorage.getItem('active_chapter_slug');
        const matched = data.find(c => c.slug === savedSlug);
        selectChapter(matched || data[0]);
      }
    }
  };

  const selectChapter = (chapter) => {
    setActiveChapter(chapter);
    if (chapter) {
      localStorage.setItem('active_chapter_slug', chapter.slug);
    } else {
      localStorage.removeItem('active_chapter_slug');
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);

  return (
    <ChapterContext.Provider value={{
      chapters,
      activeChapter,
      selectChapter,
      refreshChapters: fetchChapters
    }}>
      {children}
    </ChapterContext.Provider>
  );
}

export function useChapter() {
  return useContext(ChapterContext);
}
