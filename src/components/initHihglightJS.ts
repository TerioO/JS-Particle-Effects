import hljs from 'highlight.js/lib/core';

// Language you want to use:
import html from 'highlight.js/lib/languages/xml';
import javascript from 'highlight.js/lib/languages/javascript';

// Theme import:
import 'highlight.js/styles/stackoverflow-dark.css';

// Register languages:
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('html', html);

// Auto Detect language:
hljs.highlightAll();
