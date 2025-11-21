# CloudMotive Assignment - PDF Highlight Viewer

A modern React-based PDF viewer application with advanced text highlighting capabilities for financial document analysis.

## Features

- **PDF Rendering**: High-quality PDF display with zoom and scroll functionality
- **Text Highlighting**: Interactive text highlighting with smart phrase detection
- **Financial Analysis**: Specialized for analyzing financial reports with clickable references
- **Modern UI**: Glassmorphism design with gradient backgrounds and smooth animations
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Text Search**: Advanced text extraction and search algorithms

## Technologies Used

- **React 19**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **PDF.js**: Mozilla's PDF rendering library
- **CSS3**: Advanced styling with glassmorphism effects, gradients, and animations
- **Modern JavaScript**: ES6+ features with async/await patterns

## Installation

1. Clone the repository:
```bash
git clone https://github.com/nikhilsireesh/cloudMotive-assignment.git
cd cloudMotive-assignment
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## Usage

1. The application automatically loads the Maersk Q2 2025 financial report
2. Use the analysis panel on the right to view key findings
3. Click on reference numbers [1], [2], [3] to highlight specific text in the PDF
4. The PDF viewer supports scrolling and the highlights will automatically scroll into view
5. Use the "Clear Highlights" button to remove all highlights

## Project Structure

```
src/
├── App.jsx          # Main application component
├── App.css          # Styling with modern CSS features
└── main.jsx         # React entry point

public/
└── Maersk-Q2-2025.pdf    # Sample financial document
```

## Key Components

- **PDF Viewer**: Renders PDF pages with text extraction
- **Analysis Panel**: Interactive sidebar with clickable references
- **Highlight System**: Advanced text matching and visual highlighting
- **Search Algorithm**: Intelligent phrase detection with multiple variations

## Customization

### Adding New Search Phrases

Edit the `SEARCH_PHRASES` configuration in `App.jsx`:

```javascript
const SEARCH_PHRASES = {
  4: {
    canonical: 'Your search phrase',
    variations: ['variation1', 'variation2'],
    pageHint: 10 // Optional page number hint
  }
};
```

### Styling Customization

The application uses CSS custom properties and can be easily themed by modifying the gradient and color values in `App.css`.

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Development

This project uses Vite for fast development and building:

- **Hot Module Replacement (HMR)**: Instant updates during development
- **Fast Refresh**: Preserves component state during updates
- **ESLint**: Code quality and consistency checking

## Build

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Author

**Nikhil Sireesh**
- GitHub: [@nikhilsireesh](https://github.com/nikhilsireesh)
- Project: CloudMotive Technical Assignment

---

*Built with ⚡ Vite + React for CloudMotive Assignment*
