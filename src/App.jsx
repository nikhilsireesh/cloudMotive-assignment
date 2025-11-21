// App.jsx
// Modern React PDF Viewer with Text Highlighting
// Features: PDF rendering, text extraction, phrase highlighting, responsive design
// Dependencies: pdfjs-dist, react, react-dom
// Install: npm install pdfjs-dist

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import './App.css';

// Configuration
const PDF_CONFIG = {
  url: '/Maersk-Q2-2025.pdf',
  scale: 1.15,
  workerSrc: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js',
  cdnSrc: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.min.js'
};

// Search phrases configuration
const SEARCH_PHRASES = {
  1: {
    canonical: 'EBITDA of USD 2.3 bn',
    variations: [
      'ebitda of usd 2.3 bn',
      'ebitda of usd 2.3bn',
      'ebitda usd 2.3 bn',
      'ebitda 2.3 bn',
      'ebitda of 2.3 bn',
      '2.3 bn'
    ],
    pageHint: 3
  },
  2: {
    canonical: 'Ocean revenue increased by 2.4%',
    variations: [
      'ocean revenue increased by 2.4%',
      'revenue increased by 2.4%',
      'ocean revenue increased',
      'increased by 2.4%',
      '2.4%'
    ],
    pageHint: 5
  },
  3: {
    canonical: 'Gain on sale of non-current assets',
    variations: [
      'gain on sale of non-current assets',
      'gain on sale',
      'non-current assets',
      'sale of assets',
      '25 208'
    ],
    pageHint: 15
  }
};

export default function App() {
  const viewerRef = useRef(null);
  const pageTextBoxesRef = useRef({});
  
  const [state, setState] = useState({
    pdfjsLoaded: false,
    pdfDoc: null,
    loading: true,
    error: null,
    currentHighlight: null
  });
  
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Load PDF.js from CDN
  useEffect(() => {
    const script = document.createElement('script');
    script.src = PDF_CONFIG.cdnSrc;
    script.onload = () => updateState({ pdfjsLoaded: true });
    script.onerror = () => updateState({ error: 'Failed to load PDF.js library' });
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [updateState]);

  // Load and render PDF
  useEffect(() => {
    if (!state.pdfjsLoaded) return;

    const loadAndRenderPDF = async () => {
      try {
        updateState({ loading: true, error: null });
        
        const pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) {
          throw new Error('PDF.js library not loaded');
        }

        // Configure worker
        if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_CONFIG.workerSrc;
        }

        const loadingTask = pdfjsLib.getDocument({ url: PDF_CONFIG.url });
        const doc = await loadingTask.promise;
        
        updateState({ pdfDoc: doc });
        
        if (!viewerRef.current) return;
        viewerRef.current.innerHTML = '';
        
        await renderPDFPages(doc, pdfjsLib);
        updateState({ loading: false });
        
      } catch (err) {
        console.error('Error loading PDF:', err);
        updateState({ 
          error: `Failed to load PDF: ${err.message}`,
          loading: false 
        });
      }
    };

    loadAndRenderPDF();
  }, [state.pdfjsLoaded, updateState]);

  // Render PDF pages
  const renderPDFPages = async (doc, pdfjsLib) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const measureCanvas = document.createElement('canvas');
    const mctx = measureCanvas.getContext('2d');

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: PDF_CONFIG.scale });

      // Create page container
      const pageContainer = document.createElement('div');
      pageContainer.className = 'page-container';
      pageContainer.dataset.pageNumber = pageNum;
      pageContainer.style.width = `${viewport.width}px`;
      pageContainer.style.height = `${viewport.height}px`;

      // Create and setup canvas
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.className = 'pdf-canvas';
      pageContainer.appendChild(canvas);

      // Create text layer
      const textLayer = document.createElement('div');
      textLayer.className = 'text-layer';
      pageContainer.appendChild(textLayer);

      viewer.appendChild(pageContainer);

      // Render page
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport }).promise;

      // Extract text content
      await extractTextContent(page, viewport, pageNum, pdfjsLib, mctx, textLayer);
    }
  };

  // Extract text content from page
  const extractTextContent = async (page, viewport, pageNum, pdfjsLib, measureContext, textLayer) => {
    const textContent = await page.getTextContent();
    pageTextBoxesRef.current[pageNum] = [];

    textContent.items.forEach(item => {
      const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const x = transform[4];
      const y = transform[5];
      const fontHeight = Math.hypot(transform[1], transform[0]);
      
      measureContext.font = `${fontHeight}px sans-serif`;
      const metrics = measureContext.measureText(item.str || '');
      
      const textBox = {
        str: item.str || '',
        left: x,
        top: y - fontHeight,
        width: metrics.width,
        height: fontHeight,
        pageNumber: pageNum
      };
      
      pageTextBoxesRef.current[pageNum].push(textBox);
      
      // Create selectable text span
      const span = document.createElement('span');
      span.textContent = item.str;
      span.className = 'text-span';
      span.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y - fontHeight}px;
        font-size: ${fontHeight}px;
        opacity: 0;
        white-space: pre;
        pointer-events: none;
      `;
      textLayer.appendChild(span);
    });
  };

  // Utility functions
  const clearHighlights = useCallback(() => {
    document.querySelectorAll('.highlight').forEach(element => element.remove());
    updateState({ currentHighlight: null });
  }, [updateState]);

  const createHighlight = useCallback((pageNumber, rect) => {
    clearHighlights();
    
    const pageContainer = document.querySelector(`.page-container[data-page-number="${pageNumber}"]`);
    if (!pageContainer) return false;
    
    const highlight = document.createElement('div');
    highlight.className = 'highlight';
    highlight.style.cssText = `
      position: absolute;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
    `;
    
    pageContainer.appendChild(highlight);
    updateState({ currentHighlight: { pageNumber, rect } });
    
    // Smooth scroll to highlighted content
    pageContainer.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'nearest'
    });
    
    return true;
  }, [clearHighlights, updateState]);

  // Enhanced search algorithm
  const findPhrase = useCallback((referenceNumber) => {
    const config = SEARCH_PHRASES[referenceNumber];
    if (!config) return null;

    const pages = pageTextBoxesRef.current;
    const pagesToSearch = config.pageHint ? [config.pageHint] : Object.keys(pages).map(p => parseInt(p));
    
    console.log(`Searching for reference [${referenceNumber}] in pages:`, pagesToSearch);
    
    for (const pageNum of pagesToSearch) {
      const boxes = pages[pageNum];
      if (!boxes || boxes.length === 0) continue;
      
      console.log(`Searching page ${pageNum} with ${boxes.length} text boxes`);
      
      // Build complete page text for pattern matching
      const pageText = boxes.map(box => box.str).join(' ').toLowerCase();
      
      // Try each variation
      for (const variation of config.variations) {
        const normalizedVariation = variation.toLowerCase();
        const index = pageText.indexOf(normalizedVariation);
        
        if (index !== -1) {
          console.log(`Found "${variation}" on page ${pageNum}`);
          
          // Find the text boxes that contain this phrase
          const matchingBoxes = findMatchingTextBoxes(boxes, normalizedVariation);
          
          if (matchingBoxes.length > 0) {
            const boundingRect = calculateBoundingRect(matchingBoxes);
            return { page: pageNum, rect: boundingRect };
          }
        }
      }
    }
    
    console.log(`No matches found for reference [${referenceNumber}]`);
    return null;
  }, []);
  
  // Helper function to find matching text boxes
  const findMatchingTextBoxes = (boxes, searchText) => {
    const matchingBoxes = [];
    let currentText = '';
    let currentBoxes = [];
    
    for (let i = 0; i < boxes.length; i++) {
      currentText += boxes[i].str.toLowerCase();
      currentBoxes.push(boxes[i]);
      
      if (currentText.includes(searchText)) {
        return currentBoxes;
      }
      
      // Sliding window - remove old boxes if text gets too long
      if (currentText.length > searchText.length * 3) {
        currentText = currentText.substring(boxes[Math.max(0, i - 10)].str.length);
        currentBoxes = currentBoxes.slice(1);
      }
    }
    
    return matchingBoxes;
  };
  
  // Helper function to calculate bounding rectangle
  const calculateBoundingRect = (boxes) => {
    if (boxes.length === 0) return { left: 0, top: 0, width: 0, height: 0 };
    
    let minLeft = Infinity;
    let minTop = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;
    
    boxes.forEach(box => {
      minLeft = Math.min(minLeft, box.left);
      minTop = Math.min(minTop, box.top);
      maxRight = Math.max(maxRight, box.left + box.width);
      maxBottom = Math.max(maxBottom, box.top + box.height);
    });
    
    return {
      left: minLeft,
      top: minTop,
      width: maxRight - minLeft,
      height: maxBottom - minTop
    };
  };

  // Unified reference click handler
  const handleReferenceClick = useCallback((referenceNumber) => {
    if (state.loading) {
      alert('Please wait for the PDF to finish loading.');
      return;
    }
    
    console.log(`Clicked reference [${referenceNumber}]`);
    
    // Debug: log page content
    const config = SEARCH_PHRASES[referenceNumber];
    if (config && config.pageHint) {
      const pages = pageTextBoxesRef.current;
      const pageText = pages[config.pageHint]?.map(box => box.str).join('') || '';
      console.log(`Page ${config.pageHint} text sample:`, pageText.substring(0, 200));
    }
    
    const found = findPhrase(referenceNumber);
    
    if (!found) {
      const searchTerms = config ? config.variations.join(', ') : 'unknown terms';
      alert(`Reference [${referenceNumber}] not found.\n\nSearched for: ${searchTerms}\n\nThe text may be formatted differently or located on a different page.`);
      return;
    }
    
    console.log(`[${referenceNumber}] Found on page ${found.page}:`, found.rect);
    
    const success = createHighlight(found.page, found.rect);
    if (!success) {
      alert(`Could not create highlight on page ${found.page}. Please try again.`);
    }
  }, [state.loading, findPhrase, createHighlight]);

  // Memoized reference links
  const ReferenceLink = useMemo(() => ({ number, children }) => (
    <span 
      onClick={() => handleReferenceClick(number)}
      className="reference-link"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleReferenceClick(number)}
      aria-label={`Highlight reference ${number}`}
    >
      {children}
    </span>
  ), [handleReferenceClick]);

  if (state.error) {
    return (
      <div className="app-root error-state">
        <div className="error-message">
          <h2>Error Loading PDF</h2>
          <p>{state.error}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <div className="pdf-section">
        {state.loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading PDF...</p>
          </div>
        )}
        <div ref={viewerRef} className="pdf-viewer" />
      </div>

      <div className="analysis-section">
        <header className="analysis-header">
          <h2>Analysis</h2>
          {state.currentHighlight && (
            <div className="highlight-indicator">
              Currently highlighting page {state.currentHighlight.pageNumber}
            </div>
          )}
        </header>
        
        <div className="analysis-content">
          <p className="analysis-summary">
            No extraordinary or one-off items affecting EBITDA were reported in Maersk's Q2 2025 results.
          </p>
          
          <p className="analysis-details">
            The report explicitly notes that EBITDA improvements stemmed from operational performance—
            including volume growth, cost control, and margin improvement across Ocean, Logistics &
            Services, and Terminals segments <ReferenceLink number={1}>[1]</ReferenceLink>
            <ReferenceLink number={2}>[2]</ReferenceLink>. Gains or losses from asset sales, which could qualify as
            extraordinary items, are shown separately under EBIT and not included in EBITDA. The gain on
            sale of non-current assets was USD 25 m in Q2 2025, significantly lower than USD 208 m in Q2
            2024, but these affect EBIT, not EBITDA <ReferenceLink number={3}>[3]</ReferenceLink>. Hence, Q2 2025 EBITDA reflects core operating
            activities without one-off extraordinary adjustments.
          </p>

          <section className="findings-section">
            <h3>Key Findings</h3>
            
            <div className="finding-item">
              <h4>Page 3 — Highlights Q2 2025</h4>
              <p>
                EBITDA increase (USD 2.3 bn vs USD 2.1 bn prior year) attributed to operational improvements; no
                mention of extraordinary or one-off items. <ReferenceLink number={1}>[1]</ReferenceLink>
              </p>
            </div>
            
            <div className="finding-item">
              <h4>Page 5 — Review Q2 2025</h4>
              <p>
                EBITDA rise driven by higher revenue and cost control across all segments; no extraordinary gains
                or losses included. <ReferenceLink number={2}>[2]</ReferenceLink>
              </p>
            </div>
            
            <div className="finding-item">
              <h4>Page 15 — Condensed Income Statement</h4>
              <p>
                Gain on sale of non-current assets USD 25 m (vs USD 208 m prior year) reported separately below
                EBITDA; therefore, not part of EBITDA. <ReferenceLink number={3}>[3]</ReferenceLink>
              </p>
            </div>
          </section>

          <section className="evidence-section">
            <h3>Supporting Evidence</h3>
            
            <div className="evidence-item">
              <p className="evidence-header">
                <strong><ReferenceLink number={1}>[1]</ReferenceLink></strong> A.P. Moller – Maersk Q2 2025 Interim Report (7 Aug 2025) — Page 3
              </p>
              <blockquote className="evidence-quote">
                "Maersk's results continued to improve year-on-year ... EBITDA of USD 2.3 bn (USD 2.1 bn) ...
                driven by volume and other revenue growth in Ocean, margin improvements in Logistics &
                Services and significant top line growth in Terminals."
              </blockquote>
            </div>
            
            <div className="evidence-item">
              <p className="evidence-header">
                <strong><ReferenceLink number={2}>[2]</ReferenceLink></strong> A.P. Moller – Maersk Q2 2025 Interim Report (7 Aug 2025) — Page 5
              </p>
              <blockquote className="evidence-quote">
                "EBITDA increased to USD 2.3 bn (USD 2.1 bn) ... driven by higher revenue and cost management
                ... Ocean's EBITDA ... slightly increased by USD 36 m ... Logistics & Services contributed
                significantly with a USD 71 m increase ... Terminals' EBITDA increased by USD 50 m."
              </blockquote>
            </div>
            
            <div className="evidence-item">
              <p className="evidence-header">
                <strong><ReferenceLink number={3}>[3]</ReferenceLink></strong> A.P. Moller – Maersk Q2 2025 Interim Report (7 Aug 2025) — Page 15
              </p>
              <blockquote className="evidence-quote">
                "Gain on sale of non-current assets, etc., net 25 (208) ... Profit before depreciation, amortisation
                and impairment losses, etc. (EBITDA) 2,298"
              </blockquote>
            </div>
          </section>
          
          <footer className="pdf-info">
            <button 
              onClick={clearHighlights} 
              className="clear-highlights-btn"
              disabled={!state.currentHighlight}
            >
              Clear Highlights
            </button>
            <div className="pdf-path">
              <strong>PDF:</strong> {PDF_CONFIG.url}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}