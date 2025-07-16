import React from 'react';
import './index.css';

const ResourceLibrary = () => {
  const books = [
    {
      id: 1,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      description: "A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.",
      thumbnail: "https://covers.openlibrary.org/b/id/8225261-L.jpg",
      url: "https://www.gutenberg.org/files/64317/64317-h/64317-h.htm"
    },
    {
      id: 2,
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      description: "A powerful story of racial injustice and childhood innocence in the American South.",
      thumbnail: "https://covers.openlibrary.org/b/id/8226934-L.jpg",
      url: "https://archive.org/details/ToKillAMockingbird_201608"
    },
    {
      id: 3,
      title: "1984",
      author: "George Orwell",
      description: "A dystopian novel about totalitarianism, surveillance, and the power of language.",
      thumbnail: "https://covers.openlibrary.org/b/id/7222246-L.jpg",
      url: "https://www.gutenberg.org/files/61/61-h/61-h.htm"
    }
  ];

  const handleBookClick = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Resource Library</h1>
          <p className="text-lg text-gray-600">Discover great literature with our curated collection</p>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
            >
              {/* Book Thumbnail */}
              <div
                className="relative cursor-pointer group"
                onClick={() => handleBookClick(book.url)}
              >
                <img
                  src={book.thumbnail}
                  alt={book.title}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Book Details */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{book.title}</h3>
                <p className="text-indigo-600 font-medium mb-3">by {book.author}</p>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{book.description}</p>

                <button
                  onClick={() => handleBookClick(book.url)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <span>Read Now</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-500">Click on any book thumbnail or the "Read Now" button to open the book in a new tab</p>
        </div>
      </div>
    </div>
  );
};

export default ResourceLibrary;