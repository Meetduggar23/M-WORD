/* eslint-disable react-refresh/only-export-components -- hooks co-located with their UI */
/* ============================================================
   DocumentBrainProvider — keeps an on-device index of the live
   document. Rebuilds are debounced and skipped entirely when the
   content fingerprint is unchanged (incremental by fingerprint).
   ============================================================ */

import React, { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { DocIndex, buildIndex } from './indexer';

interface BrainState {
  index: DocIndex;
  indexing: boolean;
}

const EMPTY_INDEX: DocIndex = { chunks: [], weights: new Map(), idf: new Map(), builtAt: 0, fingerprint: 0 };

const BrainContext = createContext<BrainState>({ index: EMPTY_INDEX, indexing: false });

export const DocumentBrainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { document: doc } = useDocumentEngine();
  const [index, setIndex] = useState<DocIndex>(EMPTY_INDEX);
  const [indexing, setIndexing] = useState(false);
  const indexRef = useRef<DocIndex>(EMPTY_INDEX);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!doc) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setIndexing(true);
    timerRef.current = window.setTimeout(() => {
      const next = buildIndex(doc, indexRef.current);
      indexRef.current = next;
      setIndex(next);
      setIndexing(false);
    }, 400);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [doc]);

  const value = useMemo(() => ({ index, indexing }), [index, indexing]);
  return <BrainContext.Provider value={value}>{children}</BrainContext.Provider>;
};

export function useDocumentBrain(): BrainState {
  return useContext(BrainContext);
}
